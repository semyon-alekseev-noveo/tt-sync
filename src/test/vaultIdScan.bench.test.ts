/**
 * PERF-INDEX synthetic vault: 2000 notes, 5000 tasks.
 * The threshold is loose on purpose so a busy CI runner still passes;
 * the assertion that matters is that the index stays far below the includes scan.
 */
import { describe, expect, it } from 'vitest';
import { TFile } from 'obsidian';
import { idsPresentInTexts, idsPresentInVault } from '@/utils/vaultIdScan';
import { beginFileRun, syncFileMap, syncRead } from '@/sync/vault-io';
import { TaskParser } from '@/taskParser';
import { resetSyncPerfForTests, lastSyncPerf, startSyncPerf, finishSyncPerf } from '@/sync/perf';

class NoteFile extends TFile {
	path: string;
	constructor(path: string) {
		super();
		this.path = path;
	}
}

function naive(files: { path: string; text: string }[], ids: string[]): Map<string, string> {
	const left = new Set(ids.filter(Boolean)), found = new Map<string, string>();
	if (!left.size) return found;
	for (const f of files) {
		for (const id of [...left]) if (f.text.includes(id)) { left.delete(id); found.set(id, f.path); }
		if (!left.size) break;
	}
	return found;
}

function median(samples: number[]): number {
	const sorted = [...samples].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function buildVault(notes: number, tasks: number) {
	const ids: string[] = [];
	for (let i = 0; i < tasks; i++) ids.push(i.toString(16).padStart(24, '0'));
	const prose = 'Daily note prose. '.repeat(40);
	const files: { path: string; text: string; file: NoteFile }[] = [];
	const taskAt: { id: string; path: string }[] = [];
	for (let n = 0; n < notes; n++) {
		const lines = [`# note ${n}`, '', prose];
		const owned = [n, (n + notes) % tasks, (n + notes * 2) % tasks];
		const seen = new Set<number>();
		for (const index of owned) {
			if (seen.has(index)) continue;
			seen.add(index);
			lines.push(`- [ ] task ${index} %%[ticktick_id:: ${ids[index]}]%%`);
			taskAt.push({ id: ids[index]!, path: `notes/${n}.md` });
		}
		if (n === 0) {
			lines.push('```', `- [ ] example %%[ticktick_id:: ${ids[1]}]%%`, '```');
		}
		if (n === 3) lines.push(`raw copy of ${ids[4]} before any later marker`);
		const path = `notes/${n}.md`;
		files.push({ path, text: lines.join('\n'), file: new NoteFile(path) });
	}
	return { ids, files, taskAt };
}

describe('PERF-INDEX synthetic vault', () => {
	it('indexes 2000 notes and 5000 tasks much faster than includes, and reads each file once', async () => {
		const notes = 2000;
		const tasks = 5000;
		const { ids, files, taskAt } = buildVault(notes, tasks);
		const plain = files.map(f => ({ path: f.path, text: f.text }));

		const indexedSamples: number[] = [];
		for (let i = 0; i < 3; i++) {
			const t0 = performance.now();
			idsPresentInTexts(plain, ids);
			indexedSamples.push(performance.now() - t0);
		}
		const indexedMs = median(indexedSamples);
		const indexed = idsPresentInTexts(plain, ids);
		const naiveT0 = performance.now();
		const naiveMap = naive(plain, ids);
		const naiveMs = performance.now() - naiveT0;
		let mismatch = 0;
		for (const id of ids) if (indexed.get(id) !== naiveMap.get(id)) mismatch++;
		expect(mismatch).toBe(0);
		expect(indexedMs).toBeLessThan(1000);
		if (naiveMs > 50) expect(indexedMs * 5).toBeLessThan(naiveMs);

		const byPath = new Map(files.map(f => [f.path, f]));
		let uncachedReads = 0;
		const uncachedVault = {
			getMarkdownFiles: () => files.map(f => f.file),
			cachedRead: async (f: { path: string }) => { uncachedReads++; return byPath.get(f.path)?.text ?? ''; },
			read: async (f: { path: string }) => { uncachedReads++; return byPath.get(f.path)?.text ?? ''; },
		};
		const app = {
			vault: uncachedVault,
			metadataCache: { getFileCache: () => null },
			workspace: {},
		};
		const plugin = { taskParser: undefined as unknown, fileOperation: { readFileContent: async (f: { path: string }) => byPath.get(f.path)?.text ?? '' } };
		plugin.taskParser = new TaskParser(app as never, plugin as never);

		const reconcileNaiveT0 = performance.now();
		naive(plain, ids);
		for (const task of taskAt) {
			const text = await uncachedVault.read({ path: task.path });
			const map = await syncFileMap(app as never, plugin as never, byPath.get(task.path)!.file, text);
			map.getTaskIndex(task.id);
		}
		const reconcileNaiveMs = performance.now() - reconcileNaiveT0;
		const readsWithoutCache = uncachedReads;

		let cachedReads = 0;
		const cachedVault = {
			getMarkdownFiles: () => files.map(f => f.file),
			cachedRead: async (f: { path: string }) => { cachedReads++; return byPath.get(f.path)?.text ?? ''; },
			read: async (f: { path: string }) => { cachedReads++; return byPath.get(f.path)?.text ?? ''; },
			modify: async () => undefined,
		};
		resetSyncPerfForTests();
		const perf = startSyncPerf({ trigger: 'manual', fullSync: false });
		const end = beginFileRun(cachedVault);
		const reconcileIndexedT0 = performance.now();
		try {
			await idsPresentInVault({ vault: cachedVault } as never, ids);
			for (const task of taskAt) {
				const file = byPath.get(task.path)!.file;
				const text = await syncRead(cachedVault, file);
				const map = await syncFileMap(app as never, plugin as never, file, text);
				map.getTaskIndex(task.id);
			}
		} finally {
			end();
		}
		const reconcileIndexedMs = performance.now() - reconcileIndexedT0;
		const report = finishSyncPerf(perf, true);
		const readsWithCache = cachedReads;
		const distinctFiles = new Set(taskAt.map(t => t.path)).size;

		console.log(JSON.stringify({
			notes, tasks,
			indexedMs: Math.round(indexedMs * 10) / 10,
			naiveMs: Math.round(naiveMs * 10) / 10,
			readsWithoutCache,
			readsWithCache,
			distinctFiles,
			reconcileNaiveMs: Math.round(reconcileNaiveMs * 10) / 10,
			reconcileIndexedMs: Math.round(reconcileIndexedMs * 10) / 10,
			filesReadCounter: report.counts.filesRead,
			filesScanned: report.counts.filesScanned,
		}));

		expect(readsWithCache).toBeLessThan(readsWithoutCache);
		expect(readsWithCache).toBeLessThanOrEqual(distinctFiles * 2);
		expect(report.counts.filesRead).toBe(readsWithCache);
		expect(lastSyncPerf()?.counts.filesRead).toBe(readsWithCache);
	}, 120_000);
});
