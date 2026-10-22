/**
 * EventHandlerService - Handles all Obsidian events
 * Extracts event handling logic from main.ts
 */

import { App, Editor, type MarkdownFileInfo, MarkdownView, TFile, TFolder } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import { getSettings } from '@/settings';
import { isPathInPushScope } from '@/syncScope';
import {
	createActiveFilePushScheduler,
	deferActiveFilePush,
	planActiveFilePush,
	setActiveFilePushRelease,
	shouldNotifyPushOnVaultModify,
} from '@/services/activeFilePush';
import { noteEditorActivity } from '@/services/editorActivity';
import { traceWrite } from '@/services/writeTrace';
import { repairEmptyEditorFromDisk } from '@/sync/vault-io';
import log from '@/utils/logger';

export class EventHandlerService {
	private app: App;
	private plugin: PluginContext;
	private processTimeout?: number;
	private activeFilePush = createActiveFilePushScheduler({
		debounceMs: 5000,
		push: (filepath) => { void this.flushActiveFilePush(filepath); },
	});

	constructor(app: App, plugin: PluginContext) {
		this.app = app;
		this.plugin = plugin;
		setActiveFilePushRelease((paths) => {
			for (const path of paths) void this.flushActiveFilePush(path);
		});
	}

	/**
	 * Register all event handlers
	 */
	registerAll(): void {
		this.registerKeyboardEvents();
		this.registerClickEvents();
		this.registerEditorChangeEvents();
		this.registerFileEvents();
		this.registerWorkspaceEvents();
	}

	/**
	 * Register keyboard event handlers
	 */
	private registerKeyboardEvents(): void {
		this.plugin.registerDomEvent(document, 'keyup', async (evt: KeyboardEvent) => {
			if (!getSettings().token) {
				return;
			}

			const editor = this.app.workspace.activeEditor?.editor;
			if (!editor || !editor.hasFocus()) {
				return;
			}

			// Handle arrow key navigation
			if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(evt.key)) {
				if (!this.plugin.checkModuleClass()) {
					return;
				}
				await this.plugin.lineNumberCheck();
			}

			// Handle deletion keys
			if (['Delete', 'Backspace'].includes(evt.key)) {
				try {
					if (!this.plugin.checkModuleClass()) {
						return;
					}
					await this.plugin.service.deletedTaskCheck(null);
					await this.plugin.saveSettings();
				} catch (error) {
					log.warn(`An error occurred while deleting tasks: ${String(error)}`);
				}
			}
		});
	}

	/**
	 * Register click event handlers
	 */
	private registerClickEvents(): void {
		this.plugin.registerDomEvent(document, 'click', async (evt: MouseEvent) => {
			const { target } = evt;

			if (!getSettings().token) {
				return;
			}

			const editor = this.app.workspace.activeEditor?.editor;

			if (!this.plugin.checkModuleClass()) {
				return;
			}

			await this.plugin.lineNumberCheck();

			// Handle checkbox clicks
			if (target && (target as HTMLInputElement).type === 'checkbox') {
				await this.plugin.checkboxEventhandler(evt, editor!);
			}
		});
	}

	/**
	 * Register editor change events
	 */
	private registerEditorChangeEvents(): void {
		// Creating a task while the caret is still on the line grabs half-typed text (`%%`).
		// After the user pauses, push the open note except that unfinished line.
		// vault 'modify' still ignores the active file so keystrokes do not push immediately.
		this.plugin.registerEvent(
			this.app.workspace.on('editor-change', (_editor, info) => {
				const filepath = info?.file?.path;
				if (!filepath || !getSettings().token) return;
				noteEditorActivity(filepath);
				this.activeFilePush.notify(filepath);
			}),
		);
	}

	private async flushActiveFilePush(filepath: string): Promise<void> {
		// BUG-COMMENT-ABYSS-VIEW: do not require getActiveFile() === filepath. Abyss view
		// (and switching leaves before the 5s quiet period) still need the notified path pushed.
		const file = this.app.vault.getAbstractFileByPath(filepath);
		if (!(file instanceof TFile)) return;
		const active = this.app.workspace.getActiveFile();
		const isActive = active?.path === filepath;
		const editor = isActive ? this.app.workspace.activeEditor?.editor : undefined;
		const caretLine = editor ? editor.getCursor().line : null;
		const caretRaw = editor && caretLine != null ? editor.getLine(caretLine) : '';
		const parser = this.plugin.taskParser;
		const caretIsTask = !!(parser && caretRaw && parser.isMarkdownTask(caretRaw));
		const caretTitle = caretIsTask ? (parser.getTaskContentFromLineText(caretRaw.trimStart()) ?? '') : '';
		const plan = planActiveFilePush({
			hasToken: !!getSettings().token,
			syncRunning: !!this.plugin.syncRunning,
			inScope: isPathInPushScope(filepath),
			isMarkdown: this.plugin.fileOperation?.isMarkdownFile(file.name) ?? filepath.endsWith('.md'),
			caretLine,
			caretIsTask,
			caretTitle,
			caretRaw,
		});
		if (plan.retryAfterSync) {
			deferActiveFilePush(filepath);
			traceWrite(this.app, 'flushActiveFilePush', filepath, 'defer', { reason: 'syncRunning' });
			return;
		}
		if (!plan.push) return;
		// Markdown editor caret → identifiedOnly. Abyss leaf / no editor → full comment sweep.
		const identifiedOnly = !!(isActive && editor);
		traceWrite(this.app, 'flushActiveFilePush', filepath, 'push', {
			reason: identifiedOnly ? 'push' : 'push-abyss-or-background',
			caretLine,
		});
		try {
			await this.plugin.service?.pushSettledActiveFile(filepath, plan.skipLines, { identifiedOnly });
		} catch (error) {
			log.warn('Active file push failed', filepath, error);
		}
	}

	/**
	 * Register file events (create, delete, rename, modify)
	 */
	private registerFileEvents(): void {
		// Create event - ensure new files are registered in metadata
		this.plugin.registerEvent(
			this.app.vault.on('create', async (file) => {
				if (file instanceof TFolder || !getSettings().token) {
					return;
				}

				// Register the file in metadata so it can be scanned for tasks
				if (this.plugin.fileOperation.isMarkdownFile(file.name)) {
					await this.plugin.fileMetadataService?.getFileMetadata(file.path);
				} else {
					log.debug('non markdown file detected.', file.name);
				}
			})
		);

		// Delete event
		this.plugin.registerEvent(
			this.app.vault.on('delete', async (file) => {
				if (file instanceof TFolder || !getSettings().token) {
					return;
				}

				const updated = await this.plugin.service.deletedFileCheck(file.path);
				if (updated) {
					await this.plugin.saveSettings();
				}
			})
		);

		// Rename event
		this.plugin.registerEvent(
			this.app.vault.on('rename', async (file, oldPath) => {
				if (file instanceof TFolder || !getSettings().token) {
					return;
				}

				const updated = await this.plugin.service.renamedFileCheck(file.path, oldPath);
				if (updated) {
					await this.plugin.saveSettings();
				}
			})
		);

		// Modify event
		this.plugin.registerEvent(
			this.app.vault.on('modify', async (file) => {
				try {
					if (!getSettings().token) {
						return;
					}

					const filepath = file.path;
					if (!this.plugin.fileOperation.isMarkdownFile(file.path)) {
						log.debug('on modify non markdown file detected.', file.path);
						return;
					}
					const inScope = isPathInPushScope(filepath);
					const activateFile = this.app.workspace.getActiveFile();
					// BUG-COMMENT-ABYSS-VIEW: Abyss Tasks writes the note via vault.modify while the
					// Abyss leaf is focused (no editor-change). Schedule the same 5s push as typing.
					if (shouldNotifyPushOnVaultModify({
						hasToken: true,
						isMarkdown: true,
						inScope,
					})) {
						this.activeFilePush.notify(filepath);
					}

					// Markdown editor keystrokes: editor-change already debounces; skip immediate
					// new-task scan so a half-typed checkbox is not created.
					if (activateFile?.path === filepath) {
						return;
					}

					await this.plugin.service.fullTextNewTaskCheck(filepath);
				} catch (error) {
					log.error('An error occurred while modifying the file: ', error);
				}
			})
		);
	}

	/**
	 * Register workspace events
	 */
	private registerWorkspaceEvents(): void {
		const repairIfEmpty = (file: unknown) => {
			if (!(file instanceof TFile) || file.extension !== 'md') return;
			window.setTimeout(() => { void repairEmptyEditorFromDisk(this.app, file); }, 0);
		};
		this.plugin.registerEvent(this.app.workspace.on('file-open', repairIfEmpty));
		this.plugin.registerEvent(
			this.app.workspace.on('active-leaf-change', async (leaf) => {
				await this.plugin.setStatusBarText();
				const view = leaf?.view;
				if (view instanceof MarkdownView && view.file) repairIfEmpty(view.file);
			}),
		);
	}

	/**
	 * Cleanup timeouts
	 */
	cleanup(): void {
		if (this.processTimeout) {
			window.clearTimeout(this.processTimeout);
		}
		this.activeFilePush.dispose();
	}
}
