/**
 * data.json version migrations shown at load (#66 main extract).
 */
import { isOlder } from '@/utils/version';
import { NOTABLE_CHANGES } from '@/notable-changes';
import { migrateFromDataJson } from '@/db/migrations';
import log from '@/utils/logger';

export type ShowNotableChanges = (items: string[][]) => Promise<boolean>;

/** Apply historical data.json shape migrations; may prompt for notable changes. */
export async function migratePersistedSettingsData(
	data: Record<string, unknown>,
	opts: { pluginVersion: string; showNotableChanges: ShowNotableChanges },
): Promise<Record<string, unknown>> {
	if (!data) return data;

	//We're going to handle data structure conversions here.
	//NB: The version that goes in the literal is the current version.
	if ((!data.version) || (isOlder(data.version as string, '1.0.10'))) {
		//get rid of username and password. we don't need them no more.
		delete data.username;
		delete data.password;
	}
	if ((!data.version) || (isOlder(data.version as string, '1.0.36'))) {
		//default to AND because that's what we used to do:
		data.tagAndOr = 1;
	}

	//BIG Change. BIG I tell you!
	if ((!data.version) || isOlder(data.version as string, '2.0.0')) {
		log.debug('Entering 1.1.17 migration block');
		// Migrate from legacy data.json repository to Dexie-based repository
		data.__migratedDBData = migrateFromDataJson(data);
		log.debug('migrateFromDataJson completed');
	}
	if ((!data.version) || (isOlder(data.version as string, '2.0.5'))) {
		log.debug('Entering 2.0.5 migration block');
		// New in 2.0.5: opt-in settings for the "#ticktick" control tag.
		// Historically the plugin force-injected "ticktick" onto every
		// synced task's TickTick tags. Default off (false) preserves the
		// legacy behavior for existing installs.
		data.stopInjectingTickTickTag = false;
		data.stripTickTickTagOnReset = false;
	}

	//Build notable changes from the single source of truth
	const notableChanges: string[][] = [];
	const currentVersion = (data.version as string) || '0.0.0';
	for (const change of NOTABLE_CHANGES) {
		if (!data.version || isOlder(currentVersion, change.version)) {
			notableChanges.push([change.title, change.description, change.anchor]);
		}
	}

	if (notableChanges.length > 0) {
		log.debug('Calling LatestChangesModal with', notableChanges.length, 'items');
		await opts.showNotableChanges(notableChanges);
		log.debug('LatestChangesModal returned');
	} else {
		log.debug('Skipping LatestChangesModal - no notable changes');
	}

	//Update the version number. It will save me headaches later.

	if ((!data.version) || (isOlder(data.version as string, opts.pluginVersion))) {
		log.debug('Updating version number to ', opts.pluginVersion);
		data.version = opts.pluginVersion;
		// No saveSettings() here: in-memory settings are still DEFAULT_SETTINGS at this point and would
		// overwrite data.json (syncedLists, tagListMappings, token...). loadSettings() saves the merged data.
	}

	return data;
}
