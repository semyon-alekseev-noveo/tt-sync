/**
 * Settings UX Phase 2 (#192) — Abyss/GTD redundancy visibility.
 * Visibility / merge only. No sync-semantics change.
 * Cases: UX-SET-HIDE-DEFAULTS, UX-SET-EXTRA-FILTERS, UX-SET-STATUS-VS-STAGE
 * (+ hub / strip-on-reset / Keep TickTick folders from #192 scope).
 */

export type SettingsUxSlice = {
	projectSchemeEnabled?: boolean | null;
	abyssTasksFormat?: boolean | null;
	syncScopeFolders?: readonly string[] | null;
	syncedLists?: readonly string[] | null;
	statusListMappings?: readonly unknown[] | null;
};

/** Same stack as UX-STUB-1 / UX-SET-HIDE-DEFAULTS. */
export function isAbyssGtdPathActive(s: SettingsUxSlice): boolean {
	return !!(
		s.projectSchemeEnabled &&
		s.abyssTasksFormat &&
		(s.syncScopeFolders?.length ?? 0) > 0
	);
}

/** UX-SET-HIDE-DEFAULTS — Defaults folder twin of GTD Tasks folder (`TickTickTasksFilePath`). */
export function hideDefaultsTasksFolderTwin(s: SettingsUxSlice): boolean {
	return isAbyssGtdPathActive(s);
}

/** UX-SET-EXTRA-FILTERS — hide Legacy SyncProject / AND-OR when GTD lists are active. */
export function hideExtraFilters(s: SettingsUxSlice): boolean {
	return (s.syncedLists?.length ?? 0) > 0;
}

/** Single tasks file (hub) — Abyss path owns placement; hub is classic noise. */
export function hideHubSingleTasksFile(s: SettingsUxSlice): boolean {
	return isAbyssGtdPathActive(s);
}

/**
 * Strip ticktick on reset — dead with wipe-only Reset (UX-RESET-1).
 * Always hide; setting may remain in data.json unused.
 */
export function hideStripTickTickOnReset(): boolean {
	return true;
}

/** Keep / organize by TickTick folders — hide when project scheme is on. */
export function hideKeepTickTickFolders(s: SettingsUxSlice): boolean {
	return !!s.projectSchemeEnabled;
}

/** UX-SET-STATUS-VS-STAGE — list SoT = status→list when mappings non-empty. */
export function statusListIsSourceOfTruth(s: SettingsUxSlice): boolean {
	return (s.statusListMappings?.length ?? 0) > 0;
}

export function hideOrInactiveGtdStageMapping(s: SettingsUxSlice): boolean {
	return statusListIsSourceOfTruth(s);
}

export const DEFAULTS_FOLDER_MERGED_NOTE =
	'Tasks folder is configured under GTD and projects (same setting). Defaults folder is hidden in Abyss/GTD mode.';

export const EXTRA_FILTERS_HIDDEN_NOTE =
	'Extra filters (legacy SyncProject / AND-OR) are hidden while synced lists are the allow-list.';

/** #205 §9 — say «tag», not «stage» */
export const GTD_STAGE_INACTIVE_BANNER =
	'Inactive: Status → list is the source of truth. GTD tag → list (#gtd/* style maps) does not move the TickTick list while Status → list rows are set.';

export const GTD_TAG_LIST_MAPPING_LABEL = 'GTD tag → list mapping';
export const GTD_TAG_LIST_INACTIVE_LABEL = 'GTD tag → list mapping (inactive)';

export const HUB_HIDDEN_NOTE =
	'Single tasks file (hub) is hidden in Abyss/GTD mode; tasks stay in scoped notes / project notes.';
