/**
 * Settings UX Phase 1 (#191) — copy / labels only. No sync-semantics change.
 * Case IDs: UX-SET-* in ABYSS_FIRST_CASES.md / 27-settings-ux-redesign-plan.md.
 */

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

/** UX-SET-MANAGE-DELETED */
export const PURGE_TRASH_DB_LABEL = 'Purge trash (DB)';
export const PURGE_TRASH_DB_BUTTON = 'Purge trash (DB)';
export const PURGE_TRASH_DB_HELP =
	'Permanently remove already soft-deleted Dexie rows (housekeeping). This is not the held-deletions modal, not Skip / Apply once, and does not clear a held delete plan.';

/** UX-SET-MAINT-SYNC-PRIMARY */
export const MAINT_SYNC_PRIMARY_LABEL = 'Synchronize';
export const MAINT_SYNC_PRIMARY_NAME = 'Synchronize';
export const MAINT_SYNC_PRIMARY_HELP = 'Run a full sync now (same as the Synchronize command).';
/** Obsidian primary CTA class — only Synchronize should use this in Maintenance. */
export const MAINT_PRIMARY_CTA_CLASS = 'mod-cta';

/** UX-SET-RESET-ONE */
export const RESET_DANGER_ZONE_TITLE = 'Danger zone';
export const RESET_CONTROL_LABEL = 'Reset local sync database';
export const RESET_VAULT_TT_INTACT_COPY =
	'Wipes the local sync database (Dexie + checkpoint) only. Vault markdown and TickTick tasks stay intact. Then run Synchronize to re-link.';
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
	'Three safe exits: Skip (held modal) · Cancel (Confirm Deletion) · leave Purge alone. Orphans → Check Database help below.';

export const DELETION_GLOSSARY_TERMS: readonly DeletionGlossaryTerm[] = [
	{
		term: 'Held → Skip',
		summary: 'After Synchronize: big delete plan is held. Skip = keep tasks; Apply once = delete in TickTick.',
		not: 'Not Purge trash; not Reset.',
	},
	{
		term: 'Confirm → Cancel',
		summary: 'Dialog wants to remove a vault line (or similar). Cancel = leave the file alone.',
		not: 'Not Skip on held; not Purge.',
	},
	{
		term: 'Purge trash (DB)',
		summary: 'Wipes already soft-deleted rows in the local DB only.',
		not: 'Does not delete live TickTick tasks; not the held modal.',
	},
	{
		term: 'Reset',
		summary: 'Clears local sync cache only; vault markdown and TickTick stay.',
		not: 'Not a task wipe; run Synchronize after to re-link.',
	},
] as const;

/** Check Database / Orphaned TickTick Tasks — what to press */
export const CHECK_DATABASE_LABEL = 'Check database';
export const CHECK_DATABASE_BUTTON = 'Check Database';
export const CHECK_DATABASE_HELP =
	'Looks for sync/file mismatches. May open Orphaned TickTick Tasks (in TickTick, missing from vault/DB).';
export const CHECK_DATABASE_ORPHAN_HELP =
	'Orphans: Cancel = leave TickTick alone (usual after Reset). Add to file & db = import into vault. Delete from ticktick = remove in TickTick — avoid unless sure.';
