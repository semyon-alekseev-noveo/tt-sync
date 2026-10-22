/**
 * TaskModificationDetector facade: detect vs push split under vault-push.
 * Call sites keep importing from `@/services/TaskModificationDetector` (re-export).
 */
export type { TaskModifications, PendingTickTickDeletion } from '@/sync/vault-push/taskModification/types';
export { TaskModificationDetector } from '@/sync/vault-push/taskModification/TaskModificationDetector';
