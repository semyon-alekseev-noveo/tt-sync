/**
 * TP-TWO-LEAVES: one file is patched in one editor.
 * A second leaf showing the same file must not receive a second transaction.
 */
import { describe, expect, it } from 'vitest';
import { TFile, type App, type Editor } from 'obsidian';
import { clearEditorActivity } from '@/services/editorActivity';
import { commitVaultText } from '@/sync/vault-io';

function file(path: string): TFile {
	return Object.assign(Object.create(TFile.prototype), { path, stat: { mtime: 1, ctime: 0, size: 1 } }) as TFile;
}

describe('TP-TWO-LEAVES', () => {
	it('TP-TWO-LEAVES applies one editor transaction per file', async () => {
		clearEditorActivity();
		const note = file('notes/split.md');
		const before = '- [ ] one\n- [ ] two\n';
		const after = '- [ ] one\n- [ ] TWO\n';
		let transactions = 0;
		const make = (focused: boolean): Editor => ({
			getValue: () => before,
			getLine: (i: number) => before.split('\n')[i] ?? '',
			lineCount: () => before.split('\n').length,
			hasFocus: () => focused,
			getCursor: () => ({ line: 0, ch: 0 }),
			transaction: () => { transactions++; },
			replaceRange: () => { transactions++; },
		}) as unknown as Editor;
		const focused = make(true);
		const other = make(false);
		const app = {
			vault: {
				read: async () => before,
				process: async () => { throw new Error('closed write'); },
			},
			workspace: {
				activeEditor: { file: note, editor: focused },
				iterateAllLeaves: (cb: (leaf: { view?: unknown }) => void) => {
					cb({ view: { file: note, editor: focused } });
					cb({ view: { file: note, editor: other } });
				},
			},
		} as unknown as App;
		const result = await commitVaultText(app, note, before, after);
		expect(result.status).toBe('written');
		expect(transactions).toBe(1);
	});
});
