import { describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { beginFileRun, syncFileMap, syncRead } from '@/sync/vault-io';
import { NewFileMap } from '@/services/NewFileMap';
import { TaskParser } from '@/taskParser';

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), trace: vi.fn() },
}));

class NoteFile extends TFile {
	path: string;
	constructor(path: string) {
		super();
		this.path = path;
	}
}

describe('PERF-CACHE file text and NewFileMap', () => {
	it('reads a file once per run through syncRead and drops the entry when the vault emits modify', async () => {
		const file = new NoteFile('notes/many.md');
		let reads = 0;
		let cachedReads = 0;
		const texts = new Map<string, string>([[file.path, '- [ ] one %%[ticktick_id:: aaa]%%\n- [ ] two %%[ticktick_id:: bbb]%%\n']]);
		const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
		const emit = (event: string, ...args: unknown[]) => {
			for (const fn of listeners[event] ?? []) fn(...args);
		};
		const vault = {
			read: async (f: { path: string }) => { reads++; return texts.get(f.path) ?? ''; },
			cachedRead: async (f: { path: string }) => { cachedReads++; return texts.get(f.path) ?? ''; },
			modify: async (f: { path: string }, data: string) => { texts.set(f.path, data); emit('modify', f); },
			process: async (f: { path: string }, fn: (data: string) => string) => { texts.set(f.path, fn(texts.get(f.path) ?? '')); emit('modify', f); },
			on: (event: string, fn: (...args: unknown[]) => void) => { (listeners[event] ??= []).push(fn); },
			off: (event: string, fn: (...args: unknown[]) => void) => { listeners[event] = (listeners[event] ?? []).filter(item => item !== fn); },
		};
		const plugin = {
			taskParser: undefined as unknown,
			fileOperation: { readFileContent: async () => texts.get(file.path) ?? '' },
		};
		const app = {
			vault,
			metadataCache: { getFileCache: () => null },
			workspace: {},
		};
		plugin.taskParser = new TaskParser(app as never, plugin as never);
		const end = beginFileRun(vault);
		try {
			const first = await syncRead(vault, file);
			const second = await syncRead(vault, file);
			expect(second).toBe(first);
			expect(reads).toBe(1);
			const mapA = await syncFileMap(app as never, plugin as never, file, first);
			const mapB = await syncFileMap(app as never, plugin as never, file, second);
			expect(mapB).toBe(mapA);
			expect(mapA.getTaskIndex('aaa')).toBeGreaterThanOrEqual(0);
			expect(mapA.getTaskIndex('bbb')).toBeGreaterThanOrEqual(0);

			await vault.modify(file, '- [ ] changed %%[ticktick_id:: ccc]%%\n');
			const third = await syncRead(vault, file);
			expect(reads).toBe(2);
			expect(third).toContain('ccc');
			const mapC = await syncFileMap(app as never, plugin as never, file, third);
			expect(mapC).not.toBe(mapA);
			expect(mapC.getTaskIndex('ccc')).toBeGreaterThanOrEqual(0);
			expect(mapC.getTaskIndex('aaa')).toBe(-1);

			await vault.process(file, () => '- [ ] processed %%[ticktick_id:: ddd]%%\n');
			const fourth = await syncRead(vault, file);
			expect(reads).toBe(3);
			expect(fourth).toContain('ddd');
			const mapD = await syncFileMap(app as never, plugin as never, file, fourth);
			expect(mapD).not.toBe(mapC);
			expect(mapD).toBeInstanceOf(NewFileMap);
		} finally {
			end();
		}
		await syncRead(vault, file);
		expect(reads).toBe(4);
		expect(cachedReads).toBe(0);
	});
});
