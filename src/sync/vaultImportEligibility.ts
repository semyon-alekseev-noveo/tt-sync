/**
 * Which TickTick tasks may create / offer new vault lines.
 * Case: BUG-SYNC-SKIP-COMPLETED-IMPORT / UX-ORPHAN-SKIP-DONE
 *
 * Completed (status 2), abandoned (-1), soft-deleted, Notebook notes, and
 * completed recurrence instances (`repeatTaskId`) must not flood the vault
 * or the orphan «Add» modal. Open series masters (status 0 + repeatFlag) still import.
 */

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
