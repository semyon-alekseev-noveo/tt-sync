/**
 * Settings UX copy / labels. Case IDs: UX-SET-* / #205 smoke feedback.
 * Owner-facing store name is always «local sync cache» — never «Dexie» in UI.
 */

/** Canonical user-facing name for IndexedDB/Dexie plugin store (#205 §4). */
export const LOCAL_SYNC_CACHE = 'local sync cache';

/** UX-SET-SYNCTAG-EMPTY */
export const PULL_FILTER_TAG_LABEL = 'Pull filter tag';
export const PULL_FILTER_TAG_HELP =
	'Optional TickTick tag that narrows which tasks are pulled from ticked lists (no #). Leave empty to pull ALL tasks in those lists.';
export const PULL_FILTER_EMPTY_BADGE = 'pull ALL';
export const PULL_FILTER_EMPTY_TOOLTIP =
	'Empty Pull filter tag: every task in allow-listed (ticked) lists is pulled — not a silent “safe empty” filter.';

export function syncTagEmptyBadgeVisible(syncTag: string | null | undefined): boolean {
	return !(syncTag ?? '').trim();
}

/** UX-SET-SYNCED-LISTS-HELP */
export const SYNCED_LISTS_LABEL = 'Synced lists';
export const SYNCED_LISTS_HELP =
	'Allow-list of TickTick lists pulled into the vault. Empty = nothing pulled. A new list in TickTick is not synced until you tick it here.';
export const SYNCED_LISTS_STALE_HELP =
	'Saved names not in TickTick anymore (renamed/deleted lists). Remove them from the allow-list — they are not live lists.';
export const SYNCED_LISTS_REMOVE_STALE = 'Remove from allow-list';

/** UX-SET-MANAGE-DELETED / #205 §3 */
export const PURGE_TRASH_DB_LABEL = 'Purge soft-deleted cache rows';
export const PURGE_TRASH_DB_BUTTON = 'Purge soft-deleted cache rows';
export const PURGE_TRASH_DB_HELP =
	`When sync detaches or removes a task link, the plugin may keep a soft-deleted row in the ${LOCAL_SYNC_CACHE} for a while (retention days below). This button permanently deletes those soft-deleted rows only. It does not delete live TickTick tasks, vault lines, held deletions, or Skip/Apply once.`;

/** UX-SET-MAINT-SYNC-PRIMARY */
export const MAINT_SYNC_PRIMARY_LABEL = 'Synchronize';
export const MAINT_SYNC_PRIMARY_NAME = 'Synchronize';
/** UX-SYNC-ONE-FLOW: Sync is the day-to-day path for mismatches (Skip / Rebind). */
export const MAINT_SYNC_PRIMARY_HELP =
	'Day-to-day sync (same as the Synchronize command). If vault markers and TickTick disagree, Synchronize offers Don’t delete / Rebind — you usually do not need Check sync cache. Rules for what syncs live under Sync Control.';
/** Obsidian primary CTA class — only Synchronize should use this in Maintenance. */
export const MAINT_PRIMARY_CTA_CLASS = 'mod-cta';

/** Tab ownership (#205 §6) */
export const MAINT_TAB_INTRO =
	'Maintenance: run sync, check mismatches, backup, purge soft-deleted cache rows, Reset. What/how to sync → Sync Control.';
export const SYNC_CONTROL_TAB_INTRO =
	'Sync Control: what and how to sync (lists, scope, maps, guards). To run sync → Maintenance → Synchronize.';

/** UX-SET-RESET-ONE / #205 §4 */
export const RESET_DANGER_ZONE_TITLE = 'Danger zone';
export const RESET_CONTROL_LABEL = `Reset ${LOCAL_SYNC_CACHE}`;
export const RESET_VAULT_TT_INTACT_COPY =
	`Wipes the ${LOCAL_SYNC_CACHE} (task links + checkpoint) only. Vault markdown and TickTick tasks stay intact. Then run Synchronize to re-link.`;
/** Only Maintenance hosts ResetTasksControl (Tasks / Notes must not duplicate it). */
export const RESET_CONTROL_HOSTS = ['maintenance'] as const;

/** UX-SET-GLOSSARY — short chips + table (keep ≤4 rows; orphans live under Check Database) */
export type DeletionGlossaryTerm = {
	term: string;
	summary: string;
	not: string;
};

export const DELETION_GLOSSARY_HEADING = 'Deletion glossary';
export const DELETION_GLOSSARY_INTRO =
	'Safe exits: Skip · Rebind (no TT deletes) · Cancel (Confirm). Unmarked lines bind only via Rebind (not silent auto-bind). Gone from TT / not in backup → detach markers, keep text — never invent TickTick from vault. After restore prefer Rebind/Skip — not Apply once.';

export const DELETION_GLOSSARY_TERMS: readonly DeletionGlossaryTerm[] = [
	{
		term: 'Sync discrepancies (held) → Don’t delete / Rebind',
		summary:
			'After Synchronize: id/marker mismatch paused as a discrepancy dialog (held plan, not a silent wipe). Don’t delete (Skip) = keep as-is; Rebind = rewrite/bind vault markers (no TT deletes). Apply once = delete in TickTick — avoid after restore. Check sync cache is rare diagnostic, not a second sync.',
		not: 'Not Purge; not Reset; not silent auto-bind; not Check sync cache.',
	},
	{
		term: 'Confirm → Cancel',
		summary: 'Dialog wants to remove a vault line (or similar). Cancel = leave the file alone.',
		not: 'Not Skip on held; not Purge.',
	},
	{
		term: 'Purge soft-deleted',
		summary: `Permanently removes soft-deleted rows from the ${LOCAL_SYNC_CACHE} only.`,
		not: 'Does not delete live TickTick tasks; not the held modal.',
	},
	{
		term: 'Reset',
		summary: `Clears the ${LOCAL_SYNC_CACHE} only; vault markdown and TickTick stay.`,
		not: 'Not a task wipe; run Synchronize after to re-link.',
	},
] as const;

/** Check Database / Orphaned TickTick Tasks — what to press */
export const CHECK_DATABASE_LABEL = `Check ${LOCAL_SYNC_CACHE}`;
export const CHECK_DATABASE_BUTTON = 'Check sync cache';
/** UX-SYNC-ONE-FLOW: Check is rare; Synchronize handles day-to-day discrepancies. */
export const CHECK_DATABASE_HELP =
	`Rare diagnostic for stubborn ${LOCAL_SYNC_CACHE} ghosts — not a second Synchronize. Day-to-day marker/id mismatches → Synchronize (Don’t delete / Rebind). This scan may open «No vault link…» for TickTick tasks with no matching id in notes/cache.`;
export const CHECK_DATABASE_ORPHAN_HELP =
	'Orphans = TT tasks with no matching id in vault/cache (titles may already exist with new ids). Leave alone = usual after restore. Add may duplicate. Delete removes in TickTick.';

/**
 * Orphan modal (Check sync cache) — UX-NOTICE-ORPHAN-CLEAR (iter 2).
 * Paths are suggested Add targets, not proof the lines exist in those files.
 */
export const ORPHAN_MODAL_TITLE = 'No vault link for these TickTick tasks';
export const ORPHAN_MODAL_MESSAGE =
	`What this means: they are live in TickTick, but this plugin has no matching ticktick_id in vault lines or the ${LOCAL_SYNC_CACHE}.`;
export const ORPHAN_MODAL_RESTORE_HINT =
	'After empty-TT / Rematch you may already have the same titles with new ids — then choose Leave alone (do not Add).';
export const ORPHAN_MODAL_PATHS_HEADING =
	'Where Add would put them (not where they already are in the vault)';
export const ORPHAN_MODAL_PROMPT =
	'Leave alone = keep TickTick as-is. Add = write lines (may duplicate). Delete = remove these tasks in TickTick.';
export const ORPHAN_CANCEL_LABEL = 'Leave TickTick alone';
export const ORPHAN_ADD_LABEL = 'Add to vault — may duplicate';
export const ORPHAN_DELETE_LABEL = 'Delete in TickTick';
/** Cleanup / purge modals — same «local sync cache» wording as Settings */
export const CLEANUP_CACHE_FILES_TITLE = `Clean up ${LOCAL_SYNC_CACHE}`;
export const CLEANUP_CACHE_FILES_MESSAGE =
	`These files are still listed in the ${LOCAL_SYNC_CACHE} but no longer exist in the vault. Remove those cache rows?`;
export const CLEANUP_CACHE_FILES_CONFIRM = (n: number) => `Clean up cache (${n})`;
export const CLEANUP_SOFT_DELETED_TITLE = 'Permanently remove soft-deleted cache rows';
export const CLEANUP_SOFT_DELETED_MESSAGE =
	`Select soft-deleted rows to remove permanently from the ${LOCAL_SYNC_CACHE} (not live TickTick tasks):`;

/** Defaults dual-mode (#205 §7) */
export const DEFAULTS_ABYSS_ON_HELP =
	'Abyss Tasks format is ON: list placement usually follows Status → list and project notes. Default Project is only a fallback TickTick list when those do not apply (and for some TickTick→vault capture paths).';
export const DEFAULTS_ABYSS_OFF_HELP =
	'Abyss Tasks format is OFF (classic path): Default Project is the fallback TickTick list for new tasks without a file/project mapping. Prefer Status → list / Synced lists when you turn Abyss format back on.';
export const DEFAULT_PROJECT_LABEL = 'Default Project (fallback list)';
