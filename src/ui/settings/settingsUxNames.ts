/**
 * Settings UX Phase 3 (#193) — names, safer defaults, warnings.
 * Copy / defaults / guidance only. No sync-semantics change.
 * Cases: UX-SET-SYNC-NOTES, UX-SET-NOTEBOOK-WARN, UX-SET-BKUP-DEFAULT, UX-SET-LEAN-WARN
 * (+ Status→tag vs Status→list headers, Full vault Abyss wording, quiet reading defaults).
 */

/** UX-SET-SYNC-NOTES — distinguishable from Notebook / NOTE-BODY. */
export const SYNC_TASK_DESCRIPTIONS_LABEL = 'Sync task descriptions';
export const SYNC_TASK_DESCRIPTIONS_HELP =
	'Pull TickTick task description / content into vault task lines (NOTE-BODY). Not TickTick Notebook items.';

/** Status → tag vs Status → list headers; list wins for list placement when mapped. */
export const STATUS_TAG_MAPPING_LABEL = 'Status → tag mapping';
export const STATUS_TAG_MAPPING_HELP =
	'Checkbox char → TickTick status tag, e.g. `/ = status/in-progress`. Does not choose the TickTick list.';
export const STATUS_LIST_MAPPING_LABEL = 'Status → list mapping';
export const STATUS_LIST_MAPPING_HELP =
	'Checkbox char → TickTick list (source of truth for list placement when non-empty). Example: `! = TTS-nextAction`. Distinct from Status → tag above.';
export const STATUS_LIST_WINS_BANNER =
	'List wins: when Status → list rows are set, they choose the TickTick list. Status → tag still maps tags; it does not override list placement.';

/** UX-SET-NOTEBOOK-WARN — Notebook folder must not be Inbox/capture. */
export const NOTEBOOK_FOLDER_LABEL = 'Notebook folder';
export const NOTEBOOK_FOLDER_HELP =
	'Vault path for TickTick Notebook markdown (frontmatter ticktick_id). Prefer a dedicated folder — not Inbox or capture.';
export const NOTEBOOK_INBOX_WARN =
	'Warning: Notebook folder looks like Inbox/capture. Prefer a dedicated path (e.g. TickTick Notebook) so capture notes are not mixed with Notebook sync.';

const INBOX_CAPTURE_HINTS = [
	/^00\s*inbox\/?$/i,
	/^inbox\/?$/i,
	/^capture\/?$/i,
	/^00\s*capture\/?$/i,
	/\/inbox\/?$/i,
	/\/capture\/?$/i,
];

/** True when folder path looks like Inbox or capture (pilot GTD folders). */
export function notebookFolderLooksLikeInboxOrCapture(folder: string | null | undefined): boolean {
	const raw = (folder ?? '').trim().replace(/\\/g, '/');
	if (!raw) return false;
	const normalized = raw.replace(/\/+$/, '') || '/';
	const lower = normalized.toLowerCase();
	if (lower === 'inbox' || lower === '00 inbox' || lower === 'capture') return true;
	return INBOX_CAPTURE_HINTS.some((re) => re.test(normalized) || re.test(lower));
}

/** UX-SET-BKUP-DEFAULT — safer new-install default; warn on vault root `/`. */
export const DEFAULT_BKUP_FOLDER = 'TickTickSync/backups';
export const BKUP_FOLDER_LABEL = 'Backup folder';
export const BKUP_FOLDER_HELP =
	`CSV backups land under this vault folder. New installs default to ${DEFAULT_BKUP_FOLDER} (not vault root).`;
export const BKUP_ROOT_WARN =
	'Warning: Backup folder is vault root (/). Prefer a subfolder such as TickTickSync/backups so CSV dumps stay out of the note tree.';

export function bkupFolderIsVaultRoot(folder: string | null | undefined): boolean {
	const raw = (folder ?? '').trim();
	return raw === '' || raw === '/' || raw === '\\';
}

/** Full vault — Abyss-aware wording; confirm modal kept. */
export const FULL_VAULT_SYNC_LABEL = 'Full vault sync';
export const FULL_VAULT_SYNC_HELP =
	'Rule only (Sync Control). Abyss/GTD pilots usually leave this off: sync follows Synced lists + vault scope, not every checkbox in the vault. When on, every vault task line can sync (including items under tasks). Requires confirmation. To run sync → Maintenance → Synchronize.';
export const FULL_VAULT_CONFIRM_TITLE = 'Full Vault Task Sync Confirmation';
export const FULL_VAULT_CONFIRM_MESSAGE =
	'Are you sure you want to sync ALL vault task lines?\n' +
	'Abyss/GTD mode already scopes sync via Synced lists and folder scope — Full vault is rarely needed there.\n' +
	'Indented tasks from Obsidian become TickTick subtasks.\n' +
	'TickTick task Items stay Items; this is the only way to create Items when Full vault sync is on.\n' +
	'Items of tasks MAY become Subtasks of the parent; Items are not deleted.\n' +
	'Proceed with caution.';
export const FULL_VAULT_CONFIRM_LABEL = 'Confirm Full Vault Task Sync';

/** Quiet reading defaults (new installs) — hide id/tag chrome in Reading mode. */
export const QUIET_READING_DEFAULTS_NOTE =
	'New installs hide TickTick ID and #ticktick tag in Reading mode (Edit mode still shows them). Reduces post-sync chrome on project Active Zones.';

/** UX-SET-LEAN-WARN — warn when template path looks like a heavy MOC. */
export const PROJECT_TEMPLATE_LABEL = 'Project note template';
export const PROJECT_TEMPLATE_HELP =
	'Optional note for projects created from TickTick. Prefer a lean title + Overview + Active Zone card. Empty = built-in lean template. Templater prompts/blocks are skipped; title and id are filled.';
export const LEAN_PROJECT_TEMPLATE_WARN =
	'Warning: this path looks like a heavy MOC template. Soak P0: lean project notes avoid empty Overview/Metadata and placeholder 1/2/3 checkboxes that become real TickTick tasks. Prefer a lean card or leave empty.';

export function projectTemplateLooksHeavyMoc(path: string | null | undefined): boolean {
	const p = (path ?? '').trim().toLowerCase();
	if (!p) return false;
	// Flag MOC-named templates only — lean cards under templates/ are fine.
	return /(^|\/)moc\.md$/.test(p) || p.includes('/moc.') || p.includes('templates/moc');
}
