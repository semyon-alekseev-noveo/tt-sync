import type { App } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import type { FolderSyncService } from '@/services/FolderSyncService';
import { applyMixins } from '@/sync/vault-push/taskModification/applyMixins';
import { TaskModificationDetect } from '@/sync/vault-push/taskModification/detect';
import { TaskModificationPush } from '@/sync/vault-push/taskModification/push';
import { TaskModificationNewTasks } from '@/sync/vault-push/taskModification/newTasks';
import { TaskModificationScan } from '@/sync/vault-push/taskModification/scan';

/**
 * Facade: vault→TickTick modification detect + push.
 * Methods live in concern mixins (detect / push / newTasks / scan).
 */
export interface TaskModificationDetector extends
	TaskModificationDetect,
	TaskModificationPush,
	TaskModificationNewTasks,
	TaskModificationScan {}

export class TaskModificationDetector {
	app: App;
	plugin: PluginContext;
	folderSyncService?: FolderSyncService;

	constructor(app: App, plugin: PluginContext, folderSyncService?: FolderSyncService) {
		this.app = app;
		this.plugin = plugin;
		this.folderSyncService = folderSyncService;
	}
}

applyMixins(TaskModificationDetector, [
	TaskModificationDetect,
	TaskModificationPush,
	TaskModificationNewTasks,
	TaskModificationScan,
]);
