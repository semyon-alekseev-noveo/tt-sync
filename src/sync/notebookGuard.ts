/**
 * TickTick Notebook safety (#160 BUG-NOTEBOOK-NO-DELETE).
 * Notebook items must never be deleted via vault→TT Phase 2 / orphan scans.
 */
import type { IProject } from '@/api/types/Project';
import type { ITask } from '@/api/types/Task';

/** Normalize TickTick `kind` for compare (API may use NOTE / Note / note). */
export function normalizeTickKind(kind: unknown): string {
	return typeof kind === 'string' ? kind.trim().toUpperCase() : '';
}

/** True when the item itself is a Notebook note (`kind: NOTE`). */
export function isNotebookTask(task: Pick<ITask, 'kind'> | null | undefined): boolean {
	return normalizeTickKind(task?.kind) === 'NOTE';
}

/** True when the parent list/project is a Notebook container. */
export function isNotebookProject(project: Pick<IProject, 'kind'> | null | undefined): boolean {
	return normalizeTickKind(project?.kind) === 'NOTE';
}

/**
 * Protect from vault-driven TickTick deletion.
 * Either the task is NOTE or it lives in a NOTE project.
 */
export function isNotebookProtectedFromVaultDelete(
	task: Pick<ITask, 'kind' | 'projectId'> | null | undefined,
	project?: Pick<IProject, 'kind'> | null,
): boolean {
	if (isNotebookTask(task)) return true;
	if (project && isNotebookProject(project)) return true;
	return false;
}
