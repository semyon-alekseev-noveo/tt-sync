/**
 * @deprecated Import from `@/sync/vault-io` (TECH-SYNC-MODULARIZATION PR 3).
 * Thin re-export so old paths keep compiling during the stack.
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
