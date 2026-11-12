/**
 * Which TickTick tasks may create / offer new vault lines.
 * Case: BUG-SYNC-SKIP-COMPLETED-IMPORT / UX-ORPHAN-SKIP-DONE
 *
 * Completed (status 2), abandoned (-1), soft-deleted, Notebook notes, and
 * completed recurrence instances (`repeatTaskId`) must not flood the vault
 * or the orphan «Add» modal. Open series masters (status 0 + repeatFlag) still import.
 *
 * Keep this module free of `@/settings` imports — otherwise checkDatabase →
 * vaultImportEligibility → settings closes a cycle (release gate check:cycles).
 */
export { contextTagSlug } from '@/contextTags';

export type VaultImportTaskShape = {
	status?: number | null;
	deleted?: number | null;
	kind?: string | null;
	repeatTaskId?: string | null;
};

export function isOpenTaskEligibleForVaultImport(task: VaultImportTaskShape): boolean {
	if (task.deleted === 1) return false;
	if ((task.status ?? 0) !== 0) return false;
	if ((task.kind ?? '').toUpperCase() === 'NOTE') return false;
	// TickTick completed occurrence of a recurring series (not the live series).
	if (task.repeatTaskId) return false;
	return true;
}

/**
 * BUG-ORPHAN-ADD-STICKY — Abyss has no per-list stub path; Add must still land somewhere.
 * Prefer known path → context-tagged note → newTasksFile/default project file → Abyss capture → abyss-active.
 */
export const ABYSS_CAPTURE_FALLBACK = '00 Inbox/abyss-active.md';

export async function resolveOrphanAddFilepath(input: {
	filepath?: string;
	projectId?: string;
	parentNote?: string | null;
	projectMappedFile?: string | null;
	defaultProjectFile?: string | null;
	abyssCaptureFile?: string | null;
	newTasksFile?: string | null;
	contextNoteFile?: string | null;
}): Promise<string> {
	const trim = (s: string | null | undefined) => (s ?? '').trim();
	if (trim(input.filepath)) return trim(input.filepath);
	if (trim(input.parentNote)) return trim(input.parentNote);
	if (trim(input.contextNoteFile)) return trim(input.contextNoteFile);
	if (trim(input.projectMappedFile)) return trim(input.projectMappedFile);
	const hub = trim(input.newTasksFile);
	if (hub) return hub.endsWith('.md') ? hub : `${hub}.md`;
	if (trim(input.defaultProjectFile)) return trim(input.defaultProjectFile);
	if (trim(input.abyssCaptureFile)) return trim(input.abyssCaptureFile);
	return ABYSS_CAPTURE_FALLBACK;
}

/**
 * BUG-ORPHAN-STALE-REMATCH — after empty-TT / Rematch the vault often already has the
 * same title under a **new** ticktick_id. Old Dexie/metadata ids still look like orphans;
 * Add would duplicate. Detect title already linked with another id.
 */
export function normalizeVaultImportTitle(title: string): string {
	return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function fileHasSameTitleOtherId(
	lines: Array<{ id: string; title: string }>,
	orphanId: string,
	orphanTitle: string,
): boolean {
	const want = normalizeVaultImportTitle(orphanTitle);
	if (!want || !orphanId) return false;
	return lines.some(
		(l) => l.id !== orphanId && normalizeVaultImportTitle(l.title) === want,
	);
}
