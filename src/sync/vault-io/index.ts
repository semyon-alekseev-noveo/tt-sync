/**
 * Vault I/O facade: note read/write, per-sync file cache, pending marker ids.
 * Push/pull and orchestrator import from here — not from services/vaultWrite.
 */
export {
	OPEN_NOTE_DEFER_NOTICE,
	applyLineSpans,
	commitFrontMatter,
	commitVaultText,
	editorsForFile,
	isHelperVaultWrite,
	lineSpans,
	readNoteForWrite,
	repairEmptyEditorFromDisk,
	setNoteJournal,
	type CommitResult,
	type LineSpan,
	type NoteJournal,
	type PendingNoteWrite,
} from '@/sync/vault-io/vaultWrite';

export {
	beginFileRun,
	fileRunIsActive,
	invalidateFileRun,
	syncCachedRead,
	syncFileMap,
	syncRead,
} from '@/sync/vault-io/fileRunCache';

export {
	clearPendingMarkerTaskIds,
	isPendingMarkerTaskId,
	pendingMarkerTaskIdCount,
	prunePendingMarkerTaskIds,
	registerPendingMarkerTaskId,
} from '@/sync/vault-io/pendingMarkerTaskIds';
