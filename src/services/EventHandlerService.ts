/**
 * EventHandlerService - Handles all Obsidian events
 * Extracts event handling logic from main.ts
 */

import { App, Editor, type MarkdownFileInfo, MarkdownView, TFolder } from 'obsidian';
import type TickTickSync from '@/main';
import { getSettings } from '@/settings';
import { isPathInPushScope } from '@/syncScope';
import { createActiveFilePushScheduler, deferActiveFilePush, planActiveFilePush, setActiveFilePushRelease } from '@/services/activeFilePush';
import { noteEditorActivity } from '@/services/editorActivity';
import { traceWrite } from '@/services/writeTrace';
import log from '@/utils/logger';

export class EventHandlerService {
	private app: App;
	private plugin: TickTickSync;
	private processTimeout?: number;
	private activeFilePush = createActiveFilePushScheduler({
		debounceMs: 5000,
		push: (filepath) => { void this.flushActiveFilePush(filepath); },
	});

	constructor(app: App, plugin: TickTickSync) {
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
		const file = this.app.workspace.getActiveFile();
		if (!file || file.path !== filepath) return;
		const editor = this.app.workspace.activeEditor?.editor;
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
		traceWrite(this.app, 'flushActiveFilePush', filepath, 'push', { reason: 'push', caretLine });
		try {
			await this.plugin.service?.pushSettledActiveFile(filepath, plan.skipLines);
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
					const activateFile = this.app.workspace.getActiveFile();

					// To avoid conflicts, do not check files being edited
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
		this.plugin.registerEvent(
			this.app.workspace.on('active-leaf-change', async () => {
				await this.plugin.setStatusBarText();
			})
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
