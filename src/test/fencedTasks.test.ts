import { describe, expect, it, vi } from 'vitest';
import { NewFileMap } from '../services/NewFileMap';
import { detachInContent, childIdsInContent } from '../detach';

vi.mock('../utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('../settings', () => ({ getSettings: vi.fn(() => ({})) }));

const idOf = (l: string) => l.match(/ticktick_id:: ([0-9a-f]+)/)?.[1] ?? null;
const plugin = { taskParser: {
	getNumTabs: (l: string) => (l.match(/^\t*/)?.[0].length ?? 0), getTabs: () => '',
	isMarkdownTask: (l: string) => /^\s*[-*+] \[[ x-]\]/.test(l), getTickTickId: idOf,
	isTaskItem: () => false, hasTickTickId: (l: string) => !!idOf(l),
} } as any;
const app = { metadataCache: { getFileCache: () => ({ listItems: [] }) } } as any;
const FENCE = '```';
const doc = [`${FENCE}md`, '- [ ] Пример %%[ticktick_id:: aa11]%%', FENCE, '- [ ] Real %%[ticktick_id:: bb22]%%'].join('\n');

describe('task lines inside code blocks are never rewritten', () => {
	it('NewFileMap does not index, update or delete a fenced id line', async () => {
		const m = new NewFileMap(app, plugin, { path: 'x.md' } as any);
		await m.init(doc);
		expect(m.getTaskIndex('aa11')).toBe(-1);
		expect(m.isFencedOnly('aa11')).toBe(true);
		expect(m.isFencedOnly('bb22')).toBe(false);
		expect(m.updateTask({ id: 'aa11' } as any, '- [x] HACKED')).toBe(false);
		m.deleteTask('aa11');
		expect(m.getFileLines()).toBe(doc);
	});
	it('detach / subtree helpers skip the fenced copy', () => {
		const withDup = doc + '\n\t- [ ] child %%[ticktick_id:: cc33]%%';
		expect(detachInContent(doc, 'aa11', '%%tt-detached%%')).toBeNull();
		expect(childIdsInContent(withDup, 'bb22')).toEqual(['cc33']);
	});
});

import { dedupeTaskIds } from '../utils/vaultIdScan';
describe('dedupe keeps code-block copies intact', () => {
	it('does not strip the id from a fenced copy of a real line', () => {
		const text = ['- [ ] Real %%[ticktick_id:: bb22]%%', '```', '- [ ] Real copy %%[ticktick_id:: bb22]%%', '```'].join('\n');
		expect(dedupeTaskIds([{ path: 'x.md', text }], () => 'x.md')).toEqual([]);
	});
});
