/**
 * Store ports for sync layers (TECH-SYNC-MODULARIZATION PR 7).
 * Concrete Dexie adapters live in `src/repositories/*`; orchestrator depends on these types.
 */
export type { FileTaskQueriesPort } from '@/repositories/ports/FileTaskQueries';
export type { TaskRepositoryPort } from '@/repositories/ports/TaskRepository';
export type { SyncMetaPort } from '@/repositories/ports/SyncMeta';
