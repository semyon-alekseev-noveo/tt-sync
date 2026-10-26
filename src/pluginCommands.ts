/**
 * Palette commands registered from the Obsidian entry (#66 main extract).
 */
import { Notice, type Editor, type MarkdownFileInfo, type MarkdownView, type Plugin } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import { SetDefaultProjectForFileModal } from '@/modals/DefaultProjectModal';
import { CleanupDeletedTasksModal } from '@/modals/CleanupDeletedTasksModal';
import { RecoverDeletedTasksModal } from '@/modals/RecoverDeletedTasksModal';

type PluginHost = Plugin & PluginContext;

export function registerPluginCommands(plugin: PluginHost): void {
	plugin.addCommand({
		id: 'tts-default-project-for-file',
		name: 'Set default ticktick project for current file',
		editorCallback: (_editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
			if (!view || !view.file) {
				new Notice(`No active file.`);
				return;
			}
			const filepath = view.file.path;
			new SetDefaultProjectForFileModal(plugin.app, plugin, filepath);
		}
	});
	plugin.addCommand({
		id: 'tts-delete-permanent',
		name: 'Permanently delete tasks',
		callback: async () => {
			const deletedTasks = await plugin.taskRepository.getDeletedTasks();
			if (deletedTasks.length === 0) {
				new Notice('No deleted tasks found.');
				return;
			}
			const modal = new CleanupDeletedTasksModal(plugin.app, deletedTasks);
			const selected = await modal.showModal();
			if (selected.length > 0) {
				await plugin.taskRepository.hardDeleteTasks(selected);
				new Notice(`Permanently deleted ${selected.length} task(s).`);
			}
		}
	});

	plugin.addCommand({
		id: 'tts-recover-tasks',
		name: 'View and recover deleted tasks',
		callback: async () => {
			const deletedTasks = await plugin.taskRepository.getDeletedTasks();
			if (deletedTasks.length === 0) {
				new Notice('No deleted tasks found.');
				return;
			}
			const modal = new RecoverDeletedTasksModal(plugin.app, plugin, deletedTasks);
			await modal.showModal();
		}
	});
}
