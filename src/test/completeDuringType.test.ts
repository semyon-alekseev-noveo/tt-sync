/**
 * TP-COMPLETE-DURING-TYPE / TP-UNCOMPLETE-DURING-TYPE:
 * checking or unchecking a task must not replace text that appeared after the snapshot.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { App, TFile } from 'obsidian';
import type TickTickSync from '@/main';
import { FileOperation } from '@/fileOperation';
import { clearEditorActivity, noteEditorActivity } from '@/services/editorActivity';
import { getSettings, updateSettings } from '@/settings';

const saved = { ...getSettings() };
const TASK = 'abcdefabcdefabcdefabcdef';
const OPEN = `- [ ] buy milk #ticktick %%[ticktick_id:: ${TASK}]%%\n`;
const DONE = `- [x] buy milk #ticktick %%[ticktick_id:: ${TASK}]%%\n`;

function makeTFile(path: string): TFile {
	return Object.assign(Object.create(TFile.prototype), { path }) as TFile;
}

function pluginFor(app: App): FileOperation {
	const plugin = {
		app,
		fileMetadataService: { getFilepathForTask: async () => 'notes/a.md' },
		taskParser: { hasTickTickTag: (line: string) => line.includes('#ticktick') },
	} as unknown as TickTickSync;
	return new FileOperation(app, plugin);
}

describe('BUG-STALE-EDITOR-WRITE checkbox', () => {
	beforeEach(() => {
		clearEditorActivity();
		updateSettings({ ...saved }, { persist: false });
	});

	it('TP-COMPLETE-DURING-TYPE keeps text that arrived after the snapshot', async () => {
		const file = makeTFile('notes/a.md');
		const fresh = `${OPEN}hello from the user\n`;
		let disk = OPEN;
		let reads = 0;
		let wholeFileWrites = 0;
		const app = {
			workspace: { activeEditor: null },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => {
					reads++;
					const value = disk;
					if (reads === 1) disk = fresh;
					return value;
				},
				modify: async () => { wholeFileWrites++; },
				process: async (_f: TFile, cb: (data: string) => string) => {
					disk = cb(disk);
				},
			},
		} as unknown as App;

		await pluginFor(app).completeTaskInTheFile(TASK);

		expect(wholeFileWrites).toBe(0);
		expect(disk).toContain('hello from the user');
		expect(disk).toContain('[x]');
		expect(disk.split('\n')[0]).toContain('buy milk');
	});

	it('TP-COMPLETE-DURING-TYPE leaves a task line the user edited after the snapshot', async () => {
		const file = makeTFile('notes/a.md');
		const fresh = OPEN.replace('buy milk', 'buy oat milk');
		let disk = OPEN;
		let reads = 0;
		const app = {
			workspace: { activeEditor: null },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => {
					reads++;
					const value = disk;
					if (reads === 1) disk = fresh;
					return value;
				},
				modify: async (f: TFile, text: string) => { disk = text; void f; },
				process: async (_f: TFile, cb: (data: string) => string) => { disk = cb(disk); },
			},
		} as unknown as App;

		await pluginFor(app).completeTaskInTheFile(TASK);

		expect(disk).toBe(fresh);
		expect(disk).toContain('buy oat milk');
		expect(disk).not.toContain('[x]');
	});

	it('TP-COMPLETE-DURING-TYPE patches an open editor on the task line and keeps text typed on another line', async () => {
		const file = makeTFile('notes/a.md');
		let value = OPEN;
		let disk = OPEN;
		let gets = 0;
		let wholeFileWrites = 0;
		const editor = {
			getValue: () => {
				const current = value;
				gets++;
				if (gets === 1) value = `${current}hello from the user\n`;
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
		};
		const app = {
			workspace: {
				activeEditor: { file, editor },
				iterateAllLeaves: (cb: (leaf: { view: unknown }) => void) => cb({ view: { file, editor } }),
			},
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => disk,
				modify: async () => { wholeFileWrites++; },
				process: async (_f: TFile, cb: (data: string) => string) => {
					wholeFileWrites++;
					disk = cb(disk);
				},
			},
		} as unknown as App;

		await pluginFor(app).completeTaskInTheFile(TASK);

		expect(wholeFileWrites).toBe(1);
		expect(disk).toBe(value);
		expect(value.split('\n')[0]).toContain('[x]');
		expect(value).toContain('hello from the user');
	});

	it('TP-COMPLETE-DURING-TYPE defers the write while the note was typed in the last 2 seconds', async () => {
		const file = makeTFile('notes/a.md');
		let disk = OPEN;
		noteEditorActivity(file.path, Date.now());
		const app = {
			workspace: { activeEditor: null },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => disk,
				modify: async (_f: TFile, text: string) => { disk = text; },
				process: async (_f: TFile, cb: (data: string) => string) => { disk = cb(disk); },
			},
		} as unknown as App;

		await pluginFor(app).completeTaskInTheFile(TASK);

		expect(disk).toBe(OPEN);
		expect(disk).not.toContain('[x]');
	});

	it('TP-UNCOMPLETE-DURING-TYPE keeps text that arrived after the snapshot', async () => {
		const file = makeTFile('notes/a.md');
		const fresh = `${DONE}hello from the user\n`;
		let disk = DONE;
		let reads = 0;
		const app = {
			workspace: { activeEditor: null },
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => {
					reads++;
					const value = disk;
					if (reads === 1) disk = fresh;
					return value;
				},
				modify: async () => { throw new Error('whole-file modify'); },
				process: async (_f: TFile, cb: (data: string) => string) => { disk = cb(disk); },
			},
		} as unknown as App;

		await pluginFor(app).uncompleteTaskInTheFile(TASK);

		expect(disk).toContain('hello from the user');
		expect(disk.split('\n')[0]).toContain('[ ]');
		expect(disk.split('\n')[0]).not.toContain('[x]');
	});

	it('TP-UNCOMPLETE-DURING-TYPE patches an open editor on the task line and keeps text typed on another line', async () => {
		const file = makeTFile('notes/a.md');
		let value = DONE;
		let disk = DONE;
		let gets = 0;
		let wholeFileWrites = 0;
		const editor = {
			getValue: () => {
				const current = value;
				gets++;
				if (gets === 1) value = `${current}hello from the user\n`;
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
		};
		const app = {
			workspace: {
				activeEditor: { file, editor },
				iterateAllLeaves: (cb: (leaf: { view: unknown }) => void) => cb({ view: { file, editor } }),
			},
			vault: {
				getAbstractFileByPath: () => file,
				read: async () => disk,
				modify: async () => { wholeFileWrites++; },
				process: async (_f: TFile, cb: (data: string) => string) => {
					wholeFileWrites++;
					disk = cb(disk);
				},
			},
		} as unknown as App;

		await pluginFor(app).uncompleteTaskInTheFile(TASK);

		expect(wholeFileWrites).toBe(1);
		expect(disk).toBe(value);
		expect(value.split('\n')[0]).toContain('[ ]');
		expect(value.split('\n')[0]).not.toContain('[x]');
		expect(value).toContain('hello from the user');
	});
});
