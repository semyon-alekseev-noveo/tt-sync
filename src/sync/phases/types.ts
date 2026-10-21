/**
 * Shared dependencies for sync phase functions (PR 1 extract).
 * Populated by TickTickService; phases must not construct services themselves.
 */
import type TickTickSync from '@/main';
import type { TickTickService } from '@/services/index';
import type { SyncRunContext } from '@/sync/SyncRunContext';
import type { SyncActivityIndicator } from '@/services/SyncActivityIndicator';

export interface SyncPhaseDeps {
	plugin: TickTickSync;
	service: TickTickService;
	ui: SyncActivityIndicator;
	ctx: SyncRunContext;
}
