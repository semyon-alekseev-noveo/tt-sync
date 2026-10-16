import { DEFAULT_SETTINGS, type ITickTickSyncSettings } from '@/settings';
import { migrateSyncedLists } from '@/syncScope';

/** GTD arrays that must not be replaced by empty in-memory defaults when disk still has data. */
export const GTD_ARRAY_KEYS = ['syncedLists', 'tagListMappings', 'syncScopeFolders'] as const;

const GTD_SCALAR_KEYS: (keyof ITickTickSyncSettings)[] = [
	'TickTickTasksFilePath',
	'projectsFolder',
	'projectsListName',
	'newTasksFile',
	'projectTemplatePath',
	'SyncTag',
	'projectsListId',
	'defaultProjectId',
	'defaultProjectName',
];

/** Session / login fields that may be updated before loadSettings finishes. */
export const LOGIN_SESSION_KEYS = [
	'token',
	'inboxID',
	'inboxName',
	'checkPoint',
	'username',
	'password',
	'baseURL',
] as const;

/** Merge on-disk data.json with defaults; user keys always win over DEFAULT_SETTINGS. */
export function mergeSettingsWithDefaults(data: Record<string, unknown>): ITickTickSyncSettings {
	const migrated = migrateSyncedLists(data as { syncedLists?: unknown; SyncProject?: unknown });
	const merged = { ...DEFAULT_SETTINGS, ...migrated } as ITickTickSyncSettings;
	return preserveGtdFromDisk(merged, data);
}

/**
 * When memory still holds plugin defaults (empty arrays) but data.json or migrationSnapshot has GTD config,
 * keep the on-disk values so login / early save cannot wipe them.
 */
export function preserveGtdFromDisk(
	memory: ITickTickSyncSettings,
	disk: Record<string, unknown> | null | undefined,
): ITickTickSyncSettings {
	if (!disk) return memory;
	const out = { ...memory };

	for (const key of GTD_ARRAY_KEYS) {
		const m = memory[key];
		const d = disk[key];
		if (Array.isArray(m) && m.length === 0 && Array.isArray(d) && d.length > 0) {
			(out as Record<string, unknown>)[key] = d;
		}
	}

	const snap = disk.migrationSnapshot as Record<string, unknown> | undefined;
	if (snap) {
		for (const key of ['syncedLists', 'tagListMappings'] as const) {
			const m = out[key];
			const s = snap[key];
			if (Array.isArray(m) && m.length === 0 && Array.isArray(s) && s.length > 0) {
				(out as Record<string, unknown>)[key] = s;
			}
		}
	}

	for (const key of GTD_SCALAR_KEYS) {
		const def = DEFAULT_SETTINGS[key];
		const m = memory[key];
		const d = disk[key];
		if (m === def && d !== undefined && d !== def && d !== '') {
			(out as Record<string, unknown>)[key] = d;
		}
	}

	if (!memory.projectSchemeEnabled && disk.projectSchemeEnabled === true) {
		out.projectSchemeEnabled = true;
	}

	return out;
}

/** True if memory would persist empty GTD arrays while data.json (or migrationSnapshot) still has entries. */
export function wouldWipeGtdFromDisk(
	memory: ITickTickSyncSettings,
	disk: Record<string, unknown> | null | undefined,
): boolean {
	if (!disk) return false;
	for (const key of ['syncedLists', 'tagListMappings'] as const) {
		const m = memory[key];
		const d = disk[key];
		if (Array.isArray(m) && m.length === 0 && Array.isArray(d) && d.length > 0) {
			return true;
		}
	}
	const snap = disk.migrationSnapshot as Record<string, unknown> | undefined;
	if (!snap) return false;
	for (const key of ['syncedLists', 'tagListMappings'] as const) {
		const m = memory[key];
		const s = snap[key];
		if (Array.isArray(m) && m.length === 0 && Array.isArray(s) && s.length > 0) {
			return true;
		}
	}
	return false;
}

export function overlayLoginSession(
	base: ITickTickSyncSettings,
	overlay: Partial<ITickTickSyncSettings>,
): ITickTickSyncSettings {
	const out = { ...base };
	for (const k of LOGIN_SESSION_KEYS) {
		if (k in overlay && overlay[k] !== undefined) {
			(out as Record<string, unknown>)[k] = overlay[k];
		}
	}
	return out;
}

/** Rebuild in-memory settings from disk, then re-apply login/session fields from memory (pre-loadSettings login). */
export function hydrateSettingsFromDisk(
	memory: ITickTickSyncSettings,
	disk: Record<string, unknown> | null | undefined,
): ITickTickSyncSettings {
	if (!disk) return memory;
	const merged = mergeSettingsWithDefaults(disk);
	return overlayLoginSession(merged, memory);
}

const PERSIST_OMIT_KEYS = ['fileMetadata', 'TickTickTasksData', '__migratedDBData'] as const;

/**
 * Build the object written to data.json: start from on-disk keys (survives partial in-memory state on upgrade),
 * overlay GTD-safe memory, drop legacy blobs.
 */
export function buildPersistedSettings(
	memory: ITickTickSyncSettings,
	disk: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
	const safeMemory = preserveGtdFromDisk(memory, disk);
	const out: Record<string, unknown> = { ...(disk ?? {}) };
	for (const [key, value] of Object.entries(safeMemory)) {
		if (value !== undefined) {
			out[key] = value;
		}
	}
	for (const key of PERSIST_OMIT_KEYS) {
		delete out[key];
	}
	return out;
}
