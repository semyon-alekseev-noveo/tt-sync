/**
 * TP-JOURNAL-EDITOR-PATCH / TP-UNDO-EDITOR-PATCH:
 * an open-editor line patch is in the redo journal before it lands, and undo restores it
 * whether the note is open or closed. A patch that does not land is not committed.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { TFile, type App, type Editor } from 'obsidian';
import type TickTickSync from '@/main';
import { RedoLog, type Adapter } from '@/redo/log';
import { instrumentVault, makeEnv } from '@/redo/obsidian';
import { execute, lastSyncId, planUndo } from '@/redo/rollback';
import { clearEditorActivity, noteEditorActivity } from '@/services/editorActivity';
import { commitVaultText, setNoteJournal } from '@/sync/vault-io';

const ID = 'abcdefabcdefabcdefabcdef';
const BEFORE = `- [ ] old %%[ticktick_id:: ${ID}]%%\nhello\n`;
const AFTER = `- [ ] renamed %%[ticktick_id:: ${ID}]%%\nhello\n`;

function makeTFile(path: string): TFile {
	return Object.assign(Object.create(TFile.prototype), { path }) as TFile;
}

function fakeFs(): Adapter & { files: Map<string, string>; events: string[] } {
	const files = new Map<string, string>();
	const dirs = new Set<string>();
	const events: string[] = [];
	return {
		files,
		events,
		exists: async p => files.has(p) || dirs.has(p) || [...files.keys()].some(f => f.startsWith(p + '/')),
		mkdir: async p => { dirs.add(p); },
		append: async (p, d) => {
			if (d.includes('"state":"pending"')) events.push('pending');
			if (d.includes('"commit"')) events.push('commit');
			files.set(p, (files.get(p) ?? '') + d);
		},
		read: async p => files.get(p) ?? '',
		list: async p => ({ files: [...files.keys()].filter(f => f.startsWith(p + '/')), folders: [] }),
		remove: async p => { files.delete(p); },
	};
}

function editorFor(initial: string, events: string[]) {
	let value = initial;
	const editor = {
		getValue: () => value,
		getLine: (i: number) => value.split('\n')[i] ?? '',
		lineCount: () => value.split('\n').length,
		transaction: ({ changes }: { changes: { from: { line: number }; to: { line: number }; text: string }[] }) => {
			events.push('transaction');
			for (const change of changes) {
				const lines = value.split('\n');
				const replacement = change.text === '' ? [] : change.text.split('\n');
				lines.splice(change.from.line, change.to.line - change.from.line + 1, ...replacement);
				value = lines.join('\n');
			}
		},
		replaceRange: () => { throw new Error('whole-buffer replace'); },
	};
	return { editor: editor as unknown as Editor, read: () => value, set: (next: string) => { value = next; } };
}

function appFor(file: TFile, disk: { text: string }, editor: Editor | null, events: string[]) {
	const vault = {
		getAbstractFileByPath: () => file,
		read: async () => disk.text,
		process: async (_f: TFile, cb: (data: string) => string) => { disk.text = cb(disk.text); },
		modify: async (_f: TFile, text: string) => { disk.text = text; },
		create: async () => undefined,
		delete: async () => undefined,
		trash: async () => undefined,
		rename: async () => undefined,
		getMarkdownFiles: () => [file],
		cachedRead: async () => disk.text,
	};
	const app = {
		vault,
		workspace: {
			activeEditor: editor ? { file, editor } : null,
			iterateAllLeaves: (cb: (leaf: { view?: unknown }) => void) => {
				if (editor) cb({ view: { file, editor } });
			},
		},
	} as unknown as App;
	return { app, closeEditor: () => { app.workspace.activeEditor = null; (app.workspace as { iterateAllLeaves: () => void }).iterateAllLeaves = () => undefined; } };
}

function pluginFor(app: App, redo: RedoLog): TickTickSync {
	return {
		app,
		redo,
		tickTickRestAPI: {},
		taskRepository: { loadTaskById: async () => null, loadLocalTaskById: async () => null, upsertTask: async () => undefined, deleteTask: async () => undefined },
		dateMan: { addDateHolderToTask: () => undefined },
		fileMetadataService: { getFilepathForProjectId: async () => undefined },
		fileOperation: { synchronizeToVault: async () => true },
	} as unknown as TickTickSync;
}

describe('TP-JOURNAL-EDITOR-PATCH', () => {
	beforeEach(() => {
		clearEditorActivity();
		setNoteJournal(null);
	});

	it('TP-JOURNAL-EDITOR-PATCH writes the journal entry before the editor transaction', async () => {
		const fs = fakeFs();
		const redo = new RedoLog(fs, () => new Date('2026-10-20T12:00:00Z'));
		const file = makeTFile('notes/a.md');
		const disk = { text: BEFORE };
		const buf = editorFor(BEFORE, fs.events);
		const { app } = appFor(file, disk, buf.editor, fs.events);
		instrumentVault(app, redo);

		await redo.session('sync', () => commitVaultText(app, file, BEFORE, AFTER));

		expect(fs.events.indexOf('pending')).toBeGreaterThanOrEqual(0);
		expect(fs.events.indexOf('pending')).toBeLessThan(fs.events.indexOf('transaction'));
		expect(fs.events.indexOf('transaction')).toBeLessThan(fs.events.indexOf('commit'));
		expect(buf.read()).toBe(AFTER);
		const entries = await redo.entries();
		const fileEntry = entries.find(e => e.kind === 'file' && e.committed);
		expect(fileEntry?.before).toBe(BEFORE);
		expect(fileEntry?.after).toBe(AFTER);
		expect(entries.some(e => e.kind === 'line' && e.committed && e.taskId === ID && e.before === BEFORE.split('\n')[0] && e.after === AFTER.split('\n')[0])).toBe(true);
	});

	it('TP-JOURNAL-EDITOR-PATCH journals a re-applied span against the fresh file', async () => {
		const fs = fakeFs();
		const redo = new RedoLog(fs, () => new Date('2026-10-20T12:00:00Z'));
		const file = makeTFile('notes/a.md');
		const snapshot = `- [ ] old %%[ticktick_id:: ${ID}]%%\n`;
		const fresh = `${snapshot}hello from the user\n`;
		const next = `- [ ] renamed %%[ticktick_id:: ${ID}]%%\n`;
		const disk = { text: fresh };
		const { app } = appFor(file, disk, null, fs.events);
		instrumentVault(app, redo);

		await redo.session('sync', () => commitVaultText(app, file, snapshot, next));

		expect(disk.text).toContain('hello from the user');
		expect(disk.text).toContain('renamed');
		const fileEntry = (await redo.entries()).find(e => e.kind === 'file' && e.committed);
		expect(fileEntry?.before).toBe(fresh);
		expect(String(fileEntry?.after)).toContain('hello from the user');
		expect(String(fileEntry?.after)).toContain('renamed');
		expect(fs.events.indexOf('pending')).toBeLessThan(fs.events.indexOf('commit'));
	});

	it('TP-JOURNAL-EDITOR-PATCH does not commit a journal entry when the patch does not land', async () => {
		const fs = fakeFs();
		const redo = new RedoLog(fs, () => new Date('2026-10-20T12:00:00Z'));
		const file = makeTFile('notes/a.md');
		const snapshot = `- [ ] old %%[ticktick_id:: ${ID}]%%\n`;
		const edited = `- [ ] user typed %%[ticktick_id:: ${ID}]%%\n`;
		const disk = { text: edited };
		const { app } = appFor(file, disk, null, fs.events);
		instrumentVault(app, redo);

		await redo.session('sync', () => commitVaultText(app, file, snapshot, `- [ ] renamed %%[ticktick_id:: ${ID}]%%\n`));

		expect(disk.text).toBe(edited);
		expect((await redo.entries()).filter(e => e.committed)).toEqual([]);
		expect(fs.events).not.toContain('pending');
	});

	it('TP-JOURNAL-EDITOR-PATCH leaves a pending record uncommitted when the buffer changes before the transaction', async () => {
		const fs = fakeFs();
		const redo = new RedoLog(fs, () => new Date('2026-10-20T12:00:00Z'));
		const file = makeTFile('notes/a.md');
		const disk = { text: BEFORE };
		const buf = editorFor(BEFORE, fs.events);
		const { app } = appFor(file, disk, buf.editor, fs.events);
		const origAppend = fs.append;
		let flipped = false;
		fs.append = async (p, d) => {
			await origAppend(p, d);
			if (!flipped && d.includes('"state":"pending"')) {
				flipped = true;
				buf.set(BEFORE.replace('old', 'user typed'));
			}
		};
		instrumentVault(app, redo);

		await redo.session('sync', () => commitVaultText(app, file, BEFORE, AFTER));

		expect(buf.read()).toContain('user typed');
		expect(buf.read()).not.toContain('renamed');
		expect((await redo.entries()).every(e => e.committed === false)).toBe(true);
		expect((await redo.entries()).some(e => e.committed)).toBe(false);
	});

	it('TP-UNDO-EDITOR-PATCH restores an open note and a closed note', async () => {
		const fs = fakeFs();
		const redo = new RedoLog(fs, () => new Date('2026-10-20T12:00:00Z'));
		const file = makeTFile('notes/a.md');
		const disk = { text: BEFORE };
		const buf = editorFor(BEFORE, fs.events);
		const { app, closeEditor } = appFor(file, disk, buf.editor, fs.events);
		const plugin = pluginFor(app, redo);
		instrumentVault(app, redo);
		await redo.session('sync', () => commitVaultText(app, file, BEFORE, AFTER));
		expect(buf.read()).toBe(AFTER);

		const openPlan = planUndo(await redo.entries(), lastSyncId(await redo.entries())!);
		const openReport = await execute(openPlan, makeEnv(plugin));
		expect(openReport.some(line => line.startsWith('OK'))).toBe(true);
		expect(buf.read()).toBe(BEFORE);

		buf.set(AFTER);
		disk.text = AFTER;
		closeEditor();
		const closedReport = await execute(planUndo(await redo.entries(), lastSyncId(await redo.entries())!), makeEnv(plugin));
		expect(closedReport.some(line => line.startsWith('OK'))).toBe(true);
		expect(disk.text).toBe(BEFORE);
	});

	it('TP-JOURNAL-EDITOR-PATCH records nothing when typing defers the write', async () => {
		const fs = fakeFs();
		const redo = new RedoLog(fs, () => new Date('2026-10-20T12:00:00Z'));
		const file = makeTFile('notes/a.md');
		const disk = { text: BEFORE };
		const buf = editorFor(BEFORE, fs.events);
		const { app } = appFor(file, disk, buf.editor, fs.events);
		instrumentVault(app, redo);
		noteEditorActivity(file.path, Date.now());

		await redo.session('sync', () => commitVaultText(app, file, BEFORE, AFTER));

		expect(buf.read()).toBe(BEFORE);
		expect(fs.events).toEqual([]);
		expect(await redo.entries()).toEqual([]);
	});
});
