/**
 * Dexie adapter for {@link SyncMetaPort}.
 */
import { db } from '@/db/dexie';
import type { SyncMeta } from '@/db/schema';
import type { SyncMetaPort } from '@/repositories/ports/SyncMeta';

export class SyncMetaRepository implements SyncMetaPort {
	async getSyncMeta(): Promise<SyncMeta | undefined> {
		return db.meta.get('sync');
	}

	async updateSyncMeta(partial: Partial<SyncMeta>): Promise<number> {
		return db.meta.update('sync', partial);
	}
}
