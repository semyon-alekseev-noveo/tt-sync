import type { ITaskComment } from '@/api/types/TaskComment';
import type { AbyssCommentThread } from '@/abyssFormat';
import type { TaskCommentMap } from '@/db/schema';

/** Canonical text key for matching vault ↔ TickTick (stamp stripped, whitespace normalized). */
export type CommentContentKey = string;

export interface VaultCommentThreadRef {
	thread: AbyssCommentThread;
	contentKey: CommentContentKey;
	aliasKeys: ReadonlySet<CommentContentKey>;
}

export interface RemoteCommentRef {
	comment: Pick<ITaskComment, 'id' | 'title'>;
	contentKey: CommentContentKey;
	aliasKeys: ReadonlySet<CommentContentKey>;
}

export interface CommentSyncMatch {
	map?: TaskCommentMap;
	vault?: VaultCommentThreadRef;
	remote?: RemoteCommentRef;
}

/** Result of matching one task's vault threads, API comments, and Dexie maps. */
export interface CommentSyncPlan {
	/** Stable id already linked; content may still differ (edit). */
	linked: CommentSyncMatch[];
	/** Vault thread with no remote / map yet → push create. */
	vaultOnly: VaultCommentThreadRef[];
	/** TickTick comment with no vault thread → pull line or TT-only preserve. */
	remoteOnly: RemoteCommentRef[];
	/** Map row with no vault thread and no remote → stale map cleanup candidate. */
	orphanMaps: TaskCommentMap[];
	/** Map + remote but vault thread missing → deletion policy applies separately. */
	mapWithoutVault: CommentSyncMatch[];
}
