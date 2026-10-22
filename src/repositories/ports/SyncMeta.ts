/**
 * Store port: Dexie sync meta row (TECH-SYNC-MODULARIZATION PR 7).
 * Orchestrator phases read/stamp push wall clock and last sync times via this, not `db.meta`.
 */
import type { SyncMeta } from '@/db/schema';

export interface SyncMetaPort {
	getSyncMeta(): Promise<SyncMeta | undefined>;
	updateSyncMeta(partial: Partial<SyncMeta>): Promise<number>;
}
