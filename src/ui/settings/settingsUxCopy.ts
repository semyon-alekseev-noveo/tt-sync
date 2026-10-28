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

/** UX-SET-GLOSSARY — compact chips for Maintenance + Deletion guard */
export type DeletionGlossaryTerm = {
	term: string;
	summary: string;
	not: string;
};

export const DELETION_GLOSSARY_HEADING = 'Deletion glossary';
export const DELETION_GLOSSARY_INTRO =
	'Skip ≠ Cancel ≠ Purge trash (DB). Held deletions appear after Synchronize, not in this purge control.';

export const DELETION_GLOSSARY_TERMS: readonly DeletionGlossaryTerm[] = [
	{
		term: 'Reset',
		summary: 'Wipes local Dexie + checkpoint only.',
		not: 'Not a TickTick wipe; not held deletions; not Purge trash.',
	},
	{
		term: 'Held deletions',
		summary: 'Modal after Synchronize when a big delete plan is held.',
		not: 'Not Settings Purge trash; not Reset.',
	},
	{
		term: 'Skip deletions this run',
		summary: 'Safe default on held modal: no planned deletes; creates/updates still run.',
		not: 'Not Cancel on Confirm Deletion; not Purge trash.',
	},
	{
		term: 'Apply once',
		summary: 'Applies the held delete plan this run only.',
		not: 'Never confuse with Purge trash (DB).',
	},
	{
		term: 'Confirm / Cancel',
		summary: 'Per-task orphan dialog; Cancel leaves lines/tasks alone.',
		not: 'Not held Skip; not Purge trash.',
	},
	{
		term: 'Purge trash (DB)',
		summary: 'Permanent purge of already soft-deleted Dexie rows.',
		not: '≠ held modal; does not clear a held plan.',
	},
	{
		term: 'On TT deletion',
		summary: 'You deleted in TickTick; sync pulls that truth.',
		not: 'Not Reset; not Purge trash; not a Danger action.',
	},
] as const;
