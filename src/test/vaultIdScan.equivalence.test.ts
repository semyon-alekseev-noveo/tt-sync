import { describe, expect, it } from 'vitest';
import { idsPresentInTexts, idsPresentInVault } from '@/utils/vaultIdScan';
import { beginFileRun } from '@/sync/fileRunCache';

/** The previous O(N·T) scan. Equivalence is against this, not against a new interpretation. */
async function idsPresentInVaultNaive(app: { vault: { getMarkdownFiles: () => { path: string }[]; cachedRead: (f: { path: string }) => Promise<string> } }, ids: string[]): Promise<Map<string, string>> {
	const left = new Set(ids.filter(Boolean)), found = new Map<string, string>();
	if (!left.size) return found;
	for (const f of app.vault.getMarkdownFiles()) {
		const text = await app.vault.cachedRead(f);
		for (const id of [...left]) if (text.includes(id)) { left.delete(id); found.set(id, f.path); }
		if (!left.size) break;
	}
	return found;
}

function naiveTexts(files: { path: string; text: string }[], ids: string[]): Map<string, string> {
	const left = new Set(ids.filter(Boolean)), found = new Map<string, string>();
	if (!left.size) return found;
	for (const f of files) {
		for (const id of [...left]) if (f.text.includes(id)) { left.delete(id); found.set(id, f.path); }
		if (!left.size) break;
	}
	return found;
}

function pairs(map: Map<string, string>): [string, string][] {
	return [...map.entries()].sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
}

function vaultFrom(files: { path: string; text: string }[], onRead?: (path: string, texts: Record<string, string>) => void) {
	const texts: Record<string, string> = Object.fromEntries(files.map(f => [f.path, f.text]));
	const order = files.map(f => f.path);
	const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
	const emit = (event: string, ...args: unknown[]) => {
		for (const fn of listeners[event] ?? []) fn(...args);
	};
	const app = {
		vault: {
			getMarkdownFiles: () => order.map(path => ({ path })),
			cachedRead: async (f: { path: string }) => {
				const text = texts[f.path] ?? '';
				onRead?.(f.path, texts);
				return text;
			},
			read: async (f: { path: string }) => texts[f.path] ?? '',
			modify: async (f: { path: string }, data: string) => { texts[f.path] = data; emit('modify', f); },
			process: async (f: { path: string }, fn: (data: string) => string) => { texts[f.path] = fn(texts[f.path] ?? ''); emit('modify', f); },
			create: async (path: string, data: string) => { texts[path] = data; order.push(path); emit('create', { path }); },
			delete: async (f: { path: string }) => { delete texts[f.path]; emit('delete', f); },
			rename: async (f: { path: string }, to: string) => { texts[to] = texts[f.path] ?? ''; delete texts[f.path]; emit('rename', { path: to }, f.path); },
			on: (event: string, fn: (...args: unknown[]) => void) => { (listeners[event] ??= []).push(fn); },
			off: (event: string, fn: (...args: unknown[]) => void) => { listeners[event] = (listeners[event] ?? []).filter(item => item !== fn); },
		},
	};
	return { app, texts, order };
}

describe('PERF-INDEX idsPresentInVault matches the includes scan', () => {
	it('keeps the first file for a duplicate id, including one that only sits in a fence', () => {
		const files = [
			{ path: 'a.md', text: '```\n%%[ticktick_id:: fenced]%%\n```\nplain fenced' },
			{ path: 'b.md', text: '- [ ] real %%[ticktick_id:: fenced]%%\n- [ ] other %%[ticktick_id:: onlyb]%%' },
			{ path: 'c.md', text: 'no ids here' },
		];
		const ids = ['fenced', 'onlyb', 'missing', ''];
		expect(pairs(idsPresentInTexts(files, ids))).toEqual(pairs(naiveTexts(files, ids)));
		expect(idsPresentInTexts(files, ids).get('fenced')).toBe('a.md');
		expect(idsPresentInTexts(files, ids).get('onlyb')).toBe('b.md');
	});

	it('finds an id in prose before a later marker, and a short id inside a longer one', () => {
		const files = [
			{ path: 'early.md', text: 'see abcdef in the sentence, not as a marker' },
			{ path: 'later.md', text: '%%[ticktick_id:: abcdef]%% and %%[ticktick_id:: abc]%%' },
			{ path: 'punct.md', text: 'token a.b+c (paren) here' },
		];
		const ids = ['abcdef', 'abc', 'a.b+c', '(paren)', 'nope'];
		expect(pairs(idsPresentInTexts(files, ids))).toEqual(pairs(naiveTexts(files, ids)));
		expect(idsPresentInTexts(files, ids).get('abcdef')).toBe('early.md');
		expect(idsPresentInTexts(files, ids).get('abc')).toBe('early.md');
	});

	it('finds same-length ids that overlap in the text', () => {
		const files = [
			{ path: 'a.md', text: 'abcd' },
			{ path: 'b.md', text: 'zzabca' },
		];
		const ids = ['abc', 'bcd', 'bca', 'zzz'];
		expect(pairs(idsPresentInTexts(files, ids))).toEqual(pairs(naiveTexts(files, ids)));
		expect(idsPresentInTexts(files, ids).get('abc')).toBe('a.md');
		expect(idsPresentInTexts(files, ids).get('bcd')).toBe('a.md');
		expect(idsPresentInTexts(files, ids).get('bca')).toBe('b.md');
	});

	it('sees a file that changes before it is read, and ignores a change to a file already read', async () => {
		const build = () => vaultFrom([
			{ path: 'a.md', text: '%%[ticktick_id:: aaa]%%' },
			{ path: 'b.md', text: '%%[ticktick_id:: bbb]%%' },
		], (path, texts) => {
			if (path === 'a.md') {
				texts['a.md'] = 'already consumed';
				texts['b.md'] = '%%[ticktick_id:: bbb]%% %%[ticktick_id:: ccc]%%';
			}
		});
		const ids = ['aaa', 'bbb', 'ccc'];
		const naive = await idsPresentInVaultNaive(build().app, ids);
		const indexed = await idsPresentInVault(build().app as never, ids);
		expect(pairs(indexed)).toEqual(pairs(naive));
		expect(indexed.get('aaa')).toBe('a.md');
		expect(indexed.get('ccc')).toBe('b.md');
	});

	it('PERF-INDEX a write during the run drops the cached index', async () => {
		const { app } = vaultFrom([
			{ path: 'a.md', text: '%%[ticktick_id:: aaa]%%' },
			{ path: 'b.md', text: 'nothing' },
		]);
		const end = beginFileRun(app.vault);
		try {
			expect((await idsPresentInVault(app as never, ['aaa'])).get('aaa')).toBe('a.md');
			await app.vault.modify({ path: 'a.md' }, 'moved');
			await app.vault.modify({ path: 'b.md' }, '%%[ticktick_id:: aaa]%%');
			const again = await idsPresentInVault(app as never, ['aaa']);
			const fresh = await idsPresentInVaultNaive(app, ['aaa']);
			expect(pairs(again)).toEqual(pairs(fresh));
			expect(again.get('aaa')).toBe('b.md');
		} finally {
			end();
		}
	});
});
