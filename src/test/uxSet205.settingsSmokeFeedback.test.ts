/**
 * #205 Settings UX smoke feedback — copy / layout contracts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
	CHECK_DATABASE_HELP,
	DEFAULTS_ABYSS_OFF_HELP,
	DEFAULTS_ABYSS_ON_HELP,
	DEFAULT_PROJECT_LABEL,
	LOCAL_SYNC_CACHE,
	MAINT_TAB_INTRO,
	PURGE_TRASH_DB_HELP,
	RESET_CONTROL_LABEL,
	RESET_VAULT_TT_INTACT_COPY,
	SYNC_CONTROL_TAB_INTRO,
	SYNCED_LISTS_REMOVE_STALE,
	SYNCED_LISTS_STALE_HELP,
} from '@/ui/settings/settingsUxCopy';
import {
	GTD_STAGE_INACTIVE_BANNER,
	GTD_TAG_LIST_INACTIVE_LABEL,
	GTD_TAG_LIST_MAPPING_LABEL,
} from '@/ui/settings/settingsUxVisibility';
import { FULL_VAULT_SYNC_HELP } from '@/ui/settings/settingsUxNames';

const SETTINGS = join(__dirname, '../ui/settings');

describe('#205 terminology — local sync cache, no Dexie in UI copy', () => {
	it('exports LOCAL_SYNC_CACHE and uses it in Reset / Check / Purge', () => {
		expect(LOCAL_SYNC_CACHE).toBe('local sync cache');
		expect(RESET_CONTROL_LABEL.toLowerCase()).toContain(LOCAL_SYNC_CACHE);
		expect(RESET_VAULT_TT_INTACT_COPY.toLowerCase()).toContain(LOCAL_SYNC_CACHE);
		expect(RESET_VAULT_TT_INTACT_COPY.toLowerCase()).not.toContain('dexie');
		expect(CHECK_DATABASE_HELP.toLowerCase()).toContain(LOCAL_SYNC_CACHE);
		expect(PURGE_TRASH_DB_HELP.toLowerCase()).toContain(LOCAL_SYNC_CACHE);
		expect(PURGE_TRASH_DB_HELP.toLowerCase()).not.toContain('dexie');
	});
});

describe('#205 Synced lists layout + stale remove', () => {
	it('GtdSection uses full-width panel and remove-stale actions', () => {
		const src = readFileSync(join(SETTINGS, 'svelte/sections/GtdSection.svelte'), 'utf8');
		expect(src).toContain('tts-synced-lists-panel');
		expect(src).toContain('tts-synced-lists-checks');
		expect(src).toContain('removeStaleEntry');
		expect(src).toContain('SYNCED_LISTS_REMOVE_STALE');
		expect(SYNCED_LISTS_STALE_HELP.toLowerCase()).toMatch(/not found|renamed|stale|anymore/);
		expect(SYNCED_LISTS_REMOVE_STALE.toLowerCase()).toMatch(/remove/);
	});
});

describe('#205 tab ownership', () => {
	it('Maintenance and Sync Control intros split run vs rules', () => {
		expect(MAINT_TAB_INTRO.toLowerCase()).toMatch(/maintenance/);
		expect(MAINT_TAB_INTRO.toLowerCase()).toMatch(/sync control/);
		expect(SYNC_CONTROL_TAB_INTRO.toLowerCase()).toMatch(/sync control/);
		expect(SYNC_CONTROL_TAB_INTRO.toLowerCase()).toMatch(/maintenance/);
		expect(FULL_VAULT_SYNC_HELP.toLowerCase()).toMatch(/rule only|maintenance/);
		const maint = readFileSync(join(SETTINGS, 'svelte/ManualSyncOperations.svelte'), 'utf8');
		const sync = readFileSync(join(SETTINGS, 'svelte/sections/SyncControlSettings.svelte'), 'utf8');
		expect(maint).toContain('MAINT_TAB_INTRO');
		expect(sync).toContain('SYNC_CONTROL_TAB_INTRO');
	});
});

describe('#205 Defaults dual-mode + tag rename', () => {
	it('Defaults has Abyss ON/OFF help and fallback label', () => {
		expect(DEFAULTS_ABYSS_ON_HELP.toLowerCase()).toMatch(/abyss/);
		expect(DEFAULTS_ABYSS_OFF_HELP.toLowerCase()).toMatch(/off|classic/);
		expect(DEFAULT_PROJECT_LABEL.toLowerCase()).toMatch(/fallback/);
		const src = readFileSync(join(SETTINGS, 'svelte/sections/DefaultsSection.svelte'), 'utf8');
		expect(src).toContain('DEFAULTS_ABYSS_ON_HELP');
		expect(src).toContain('DEFAULT_PROJECT_LABEL');
	});

	it('GTD stage jargon replaced with tag → list', () => {
		expect(GTD_TAG_LIST_MAPPING_LABEL.toLowerCase()).toMatch(/tag/);
		expect(GTD_TAG_LIST_INACTIVE_LABEL.toLowerCase()).toMatch(/tag/);
		expect(GTD_STAGE_INACTIVE_BANNER.toLowerCase()).toMatch(/tag/);
		expect(GTD_STAGE_INACTIVE_BANNER.toLowerCase()).not.toMatch(/stage →/);
		const src = readFileSync(join(SETTINGS, 'svelte/sections/GtdSection.svelte'), 'utf8');
		expect(src).toContain('GTD_TAG_LIST_INACTIVE_LABEL');
		expect(src).not.toMatch(/>GTD stage mapping</);
	});
});
