/**
 * Transitional path: prefer `@/sync/vault-push/taskModification`.
 * Re-exports the split detect/push modules for stable caller imports.
 */
export type { TaskModifications, PendingTickTickDeletion } from '@/sync/vault-push/taskModification';
export { TaskModificationDetector } from '@/sync/vault-push/taskModification';
