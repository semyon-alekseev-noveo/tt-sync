/**
 * Vault-push: Obsidian → TickTick (local edits, new tasks, modification detect/push).
 */
export {
	activeMarkdownPathInPushScope,
	pathsForPrePullPush,
} from '@/sync/vault-push/pushLocalPaths';
export type { TaskModifications, PendingTickTickDeletion } from '@/sync/vault-push/taskModification';
export { TaskModificationDetector } from '@/sync/vault-push/taskModification';
