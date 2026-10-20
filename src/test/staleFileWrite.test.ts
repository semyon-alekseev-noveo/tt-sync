/**
 * BUG-STALE-EDITOR-WRITE: a vault write must not replace text that appeared after the snapshot.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App, TFile } from 'obsidian';
import type TickTickSync from '@/main';
import type { ITask } from '@/api/types/Task';
import { FileOperation } from '@/fileOperation';
import { clearEditorActivity, noteEditorActivity } from '@/services/editorActivity';
import { applyLineSpans, lineSpans } from '@/services/vaultWrite';
import { getSettings, updateSettings } from '@/settings';

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), trace: vi.fn() },
}));
vi.mock('@/main', () => ({ default: class {} }));
vi.mock('@/db/dexie', () => ({
	db: { projects: { get: async () => undefined }, taskCommentMaps: { where: () => ({ equals: () => ({ toArray: async () => [] }) }) } },
}));

const saved = { ...getSettings() };

function makeTFile(path: string): TFile {
	return Object.assign(Object.create(TFile.prototype), { path }) as TFile;
}

const RENAMED = '- [ ] renamed %%[ticktick_id:: task-1]%%';

function parserStub() {
	return {
		isMarkdownTask: (line: string) => /^\s*[-*+] \[[x ]\]/i.test(line),
		hasTickTickId: (line: string) => /%%\[ticktick_id::/.test(line),
		getTickTickId: (line: string) => line.match(/%%\[ticktick_id::\s*(\S+?)\]%%/)?.[1] ?? null,
		getNumTabs: () => 0,
		getTabs: (line: string) => line.match(/^\s*/)?.[0] ?? '',
		convertTaskToLine: async () => RENAMED,
		isProjectIdChanged: async () => false,
		isParentIdChanged: () => false,
		getNoteString: () => '',
		getLineHash: async () => 'hash',
		getLinkLocation: () => ({ taskURL: null, noteURL: null }),
	};
}

const task = { id: 'task-1', projectId: 'proj-a', title: 'renamed' } as ITask;

describe('BUG-STALE-EDITOR-WRITE', () => {
	beforeEach(() => {
		clearEditorActivity();
		updateSettings({
			...saved,
			abyssTasksFormat: false,
			syncAbyssCommentsViaApi: false,
			syncNotes: false,
			enableFullVaultSync: false,
		}, { persist: false });
	});

	it('TP-STALE-FILE-WRITE does not write a stale snapshot over text that arrived after the read', async () => {
		const file = makeTFile('notes/a.md');
		const snapshot = '- [ ] old %%[ticktick_id:: task-1]%%\n';
		const fresh = '- [ ] old %%[ticktick_id:: task-1]%%\nhello from the user\n';
		let disk = snapshot;
		let reads = 0;
		let processed = 0;
		const app = {
			workspace: { getActiveFile: () => null, activeEditor: null },
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => {
					reads++;
					const value = disk;
					if (reads === 1) disk = fresh;
					return value;
				},
				process: async (_f: TFile, cb: (data: string) => string) => {
					processed++;
					disk = cb(disk);
				},
			},
		} as unknown as App;
		const plugin = {
			app,
			lastLines: new Map<string, number>(),
			taskParser: parserStub(),
			dateMan: { addDateHolderToTask: () => undefined },
			taskRepository: {
				loadTaskById: async () => task,
				upsertTask: vi.fn(async () => undefined),
			},
			fileTaskQueries: {
				getDefaultProjectIdForFilepath: async () => 'proj-a',
				filepathHasDefaultProjectID: async () => true,
			},
			tickTickRestAPI: { updateTask: async (t: ITask) => t, getTaskComments: vi.fn() },
		} as unknown as TickTickSync;
		(plugin as { fileOperation: FileOperation }).fileOperation = new FileOperation(app, plugin);
		const fileOperation = (plugin as { fileOperation: FileOperation }).fileOperation;

		await fileOperation.synchronizeToVault('notes/a.md', [task], true);

		expect(processed).toBe(1);
		expect(disk).toContain('hello from the user');
		expect(disk).toContain('renamed');
		expect(disk).not.toBe(RENAMED);
	});

	it('TP-STALE-FILE-WRITE leaves a task line alone when the user changed that line after the snapshot', async () => {
		const file = makeTFile('notes/a.md');
		const snapshot = '- [ ] old %%[ticktick_id:: task-1]%%\n';
		const fresh = '- [ ] old typed %%[ticktick_id:: task-1]%%\n';
		let disk = snapshot;
		let reads = 0;
		const app = {
			workspace: { getActiveFile: () => null, activeEditor: null },
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => {
					reads++;
					const value = disk;
					if (reads === 1) disk = fresh;
					return value;
				},
				process: async (_f: TFile, cb: (data: string) => string) => {
					disk = cb(disk);
				},
			},
		} as unknown as App;
		const plugin = {
			app,
			lastLines: new Map<string, number>(),
			taskParser: parserStub(),
			dateMan: { addDateHolderToTask: () => undefined },
			taskRepository: { loadTaskById: async () => task, upsertTask: vi.fn(async () => undefined) },
			fileTaskQueries: {
				getDefaultProjectIdForFilepath: async () => 'proj-a',
				filepathHasDefaultProjectID: async () => true,
			},
			tickTickRestAPI: { updateTask: async (t: ITask) => t },
		} as unknown as TickTickSync;
		const fileOperation = new FileOperation(app, plugin);
		(plugin as { fileOperation: FileOperation }).fileOperation = fileOperation;

		await fileOperation.synchronizeToVault('notes/a.md', [task], true);

		expect(disk).toBe(fresh);
		expect(disk).not.toContain('renamed');
	});

	it('TP-STALE-FILE-WRITE patches an open editor on the task line and keeps text typed on another line', async () => {
		const file = makeTFile('notes/a.md');
		const snapshot = '- [ ] old %%[ticktick_id:: task-1]%%\n';
		let value = snapshot;
		let gets = 0;
		const editor = {
			getValue: () => {
				const current = value;
				gets++;
				if (gets === 1) value = `${snapshot}hello from the user\n`;
				return current;
			},
			getLine: (i: number) => value.split('\n')[i] ?? '',
			lineCount: () => value.split('\n').length,
			transaction: ({ changes }: { changes: { from: { line: number }; to: { line: number }; text: string }[] }) => {
				for (const change of changes) {
					const lines = value.split('\n');
					const replacement = change.text === '' ? [] : change.text.split('\n');
					lines.splice(change.from.line, change.to.line - change.from.line + 1, ...replacement);
					value = lines.join('\n');
				}
			},
			replaceRange: () => { throw new Error('setValue/replaceRange of the whole buffer is not used'); },
		};
		let processed = 0;
		const app = {
			workspace: {
				getActiveFile: () => file,
				activeEditor: { file, editor },
				iterateAllLeaves: (cb: (leaf: { view: unknown }) => void) => cb({ view: { file, editor } }),
			},
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => snapshot,
				process: async () => { processed++; },
			},
		} as unknown as App;
		const plugin = {
			app,
			lastLines: new Map<string, number>(),
			taskParser: parserStub(),
			dateMan: { addDateHolderToTask: () => undefined },
			taskRepository: { loadTaskById: async () => task, upsertTask: vi.fn(async () => undefined) },
			fileTaskQueries: {
				getDefaultProjectIdForFilepath: async () => 'proj-a',
				filepathHasDefaultProjectID: async () => true,
			},
			tickTickRestAPI: { updateTask: async (t: ITask) => t },
		} as unknown as TickTickSync;
		const fileOperation = new FileOperation(app, plugin);
		(plugin as { fileOperation: FileOperation }).fileOperation = fileOperation;

		await fileOperation.synchronizeToVault('notes/a.md', [task], true);

		expect(processed).toBe(0);
		expect(value).toContain('hello from the user');
		expect(value).toContain('renamed');
		expect(value.split('\n')[1]).toBe('hello from the user');
	});

	it('TP-STALE-FILE-WRITE defers the write when the note was typed in the last 2 seconds', async () => {
		const file = makeTFile('notes/a.md');
		const snapshot = '- [ ] old %%[ticktick_id:: task-1]%%\n';
		let disk = snapshot;
		noteEditorActivity(file.path, Date.now());
		const app = {
			workspace: { getActiveFile: () => null, activeEditor: null },
			metadataCache: { getFileCache: () => ({ listItems: [] }) },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => disk,
				process: async (_f: TFile, cb: (data: string) => string) => { disk = cb(disk); },
			},
		} as unknown as App;
		const upsertTask = vi.fn(async () => undefined);
		const plugin = {
			app,
			lastLines: new Map<string, number>(),
			taskParser: parserStub(),
			dateMan: { addDateHolderToTask: () => undefined },
			taskRepository: { loadTaskById: async () => task, upsertTask },
			fileTaskQueries: {
				getDefaultProjectIdForFilepath: async () => 'proj-a',
				filepathHasDefaultProjectID: async () => true,
			},
			tickTickRestAPI: { updateTask: async (t: ITask) => t },
		} as unknown as TickTickSync;
		const fileOperation = new FileOperation(app, plugin);
		(plugin as { fileOperation: FileOperation }).fileOperation = fileOperation;

		await fileOperation.synchronizeToVault('notes/a.md', [task], true);

		expect(disk).toBe(snapshot);
		expect(upsertTask).not.toHaveBeenCalled();
	});

	it('TP-EDITOR-OTHER-LEAF reads the file when the active editor shows another note', async () => {
		const fileA = makeTFile('notes/a.md');
		const fileB = makeTFile('notes/b.md');
		const app = {
			workspace: {
				getActiveFile: () => fileA,
				activeEditor: { file: fileB, editor: { getValue: () => 'BUFFER OF B' } },
			},
			vault: {
				read: async (f: TFile) => (f.path === fileA.path ? 'DISK A' : 'DISK B'),
			},
		} as unknown as App;
		const fileOperation = new FileOperation(app, {} as TickTickSync);

		expect(await fileOperation.readFileContent(fileA)).toBe('DISK A');
		expect(await fileOperation.readFileContent(fileB)).toBe('BUFFER OF B');
	});

	it('line spans reapply onto a longer note without dropping the new lines', () => {
		const before = '- [ ] old %%[ticktick_id:: task-1]%%\n';
		const after = `${RENAMED}\n`;
		const fresh = '- [ ] old %%[ticktick_id:: task-1]%%\nhello from the user\n';
		const applied = applyLineSpans(fresh, lineSpans(before, after));
		expect(applied.skipped).toBe(0);
		expect(applied.text).toContain('renamed');
		expect(applied.text).toContain('hello from the user');
	});
});
