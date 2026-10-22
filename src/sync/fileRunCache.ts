/**
 * @deprecated Import from `@/sync/vault-io` (TECH-SYNC-MODULARIZATION PR 3).
 * Thin re-export so old paths keep compiling during the stack.
 */
export {
	beginFileRun,
	fileRunIsActive,
	invalidateFileRun,
	syncCachedRead,
	syncFileMap,
	syncRead,
} from '@/sync/vault-io/fileRunCache';
