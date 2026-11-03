/**
 * Which TickTick tasks may create / offer new vault lines.
 * Case: BUG-SYNC-SKIP-COMPLETED-IMPORT / UX-ORPHAN-SKIP-DONE
 *
 * Completed (status 2), abandoned (-1), soft-deleted, Notebook notes, and
 * completed recurrence instances (`repeatTaskId`) must not flood the vault
 * or the orphan «Add» modal. Open series masters (status 0 + repeatFlag) still import.
 */

import { getSettings } from '@/settings';

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
 * Prefer known path → newTasksFile/default project file → Abyss capture → abyss-active.
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
}): Promise<string> {
	const trim = (s: string | null | undefined) => (s ?? '').trim();
	if (trim(input.filepath)) return trim(input.filepath);
	if (trim(input.parentNote)) return trim(input.parentNote);
	if (trim(input.projectMappedFile)) return trim(input.projectMappedFile);
	const hub = trim(input.newTasksFile ?? getSettings().newTasksFile);
	if (hub) return hub.endsWith('.md') ? hub : `${hub}.md`;
	if (trim(input.defaultProjectFile)) return trim(input.defaultProjectFile);
	if (trim(input.abyssCaptureFile)) return trim(input.abyssCaptureFile);
	return ABYSS_CAPTURE_FALLBACK;
}
