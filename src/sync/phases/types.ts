/**
 * Shared dependencies for sync phase functions (PR 1 extract).
 * Populated by TickTickService; phases must not construct services themselves.
 */
import type { PluginContext } from '@/pluginContext';
import type { TickTickService } from '@/services/index';
import type { TickTickRestAPI } from '@/services/TicktickRestAPI';
import type { SyncActivityIndicator } from '@/services/SyncActivityIndicator';
import type { SyncRunContext } from '@/sync/SyncRunContext';

export interface SyncPhaseDeps {
	plugin: PluginContext;
	service: TickTickService;
	ui: SyncActivityIndicator;
	ctx: SyncRunContext;
	/** Present inside the locked API section of synchronizationInner. */
	tickApi?: TickTickRestAPI;
}
