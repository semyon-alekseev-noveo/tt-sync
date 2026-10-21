export type {
	CommentContentKey,
	CommentSyncMatch,
	CommentSyncPlan,
	RemoteCommentRef,
	VaultCommentThreadRef,
} from '@/sync/comments/types';
export {
	aliasKeysForBody,
	normalizedCommentKey,
	normalizedKeysFromRemote,
	normalizedKeysFromVaultLines,
	remoteCommentRef,
	vaultThreadRef,
} from '@/sync/comments/keys';
export {
	commentSetsEquivalentByNormalizedKey,
	planCommentSync,
	remoteCommentKeysAheadOfVault,
	vaultCommentKeysAheadOfRemote,
	vaultHasUnpushedCommentThreads,
} from '@/sync/comments/match';
