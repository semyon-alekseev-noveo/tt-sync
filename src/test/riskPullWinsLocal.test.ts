/**
 * RISK-PULL-WINS-LOCAL — a local LWW win must rewrite a stale vault line
 * from the local task. The losing remote title, status, and content stay out of the note.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewFileMap } from '@/services/NewFileMap';
import { getSettings, updateSettings } from '@/settings';
import type { ITask } from '@/api/types/Task';

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), trace: vi.fn() },
}));

const saved = { ...getSettings() };
const TASK = 'abcdefabcdefabcdefabcdef';

function plugin() {
	return {
		taskParser: {
			getNumTabs: (line: string) => line.match(/^\t*/)?.[0].length ?? 0,
			getTabs: (line: string) => line.match(/^\t*/)?.[0] ?? '',
			isMarkdownTask: (line: string) => /^\s*[-*+] \[[^\]]\]/.test(line),
			hasTickTickId: (line: string) => /%%\[ticktick_id::/.test(line),
			getTickTickId: (line: string) => line.match(/%%\[ticktick_id::\s*(\S+?)\]%%/)?.[1] ?? null,
		},
		projectScheme: { isParentId: () => false },
		fileOperation: { readFileContent: vi.fn() },
	} as never;
}

describe('RISK-PULL-WINS-LOCAL vault line', () => {
	beforeEach(() => {
		updateSettings({ ...saved, abyssTasksFormat: true, abyssIndent: 'tab' }, { persist: false });
	});

	afterEach(() => {
		updateSettings(saved, { persist: false });
	});

	it('RISK-PULL-WINS-LOCAL writes the local title, status, and content over the stale remote line', async () => {
		const app = { metadataCache: { getFileCache: () => ({ listItems: [] }) } };
		const fileMap = new NewFileMap(app as never, plugin(), { path: 'notes/local-win.md' } as never);
		const stale = `- [x] remote title %%[ticktick_id:: ${TASK}]%%\n\t- > remote body\n`;
		await fileMap.init(stale);
		const task = {
			id: TASK,
			title: 'local title',
			content: 'local body',
			status: 0,
		} as ITask;
		Object.defineProperty(task, '__localLwwRewrite', { value: true, enumerable: false });
		const generated = `- [ ] local title %%[ticktick_id:: ${TASK}]%%\n\t- > local body`;

		expect(fileMap.updateTask(task, generated)).toBe(true);
		const text = fileMap.getFileLines();
		expect(text).toContain('local title');
		expect(text).toContain('- [ ]');
		expect(text).toContain('local body');
		expect(text).not.toContain('remote title');
		expect(text).not.toContain('remote body');
		expect(text).not.toContain('[x]');
	});
});
