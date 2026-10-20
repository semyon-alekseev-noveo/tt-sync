import type { App, TFile } from 'obsidian';
import type TickTickSync from '@/main';
import { NewFileMap } from '@/services/NewFileMap';
import { noteFileRead, noteVaultWrite } from '@/sync/perf';
import { closeVaultIdIndex, invalidateVaultIdIndex, openVaultIdIndex } from '@/utils/vaultIdScan';

/**
 * Per-sync cache of file text and the parsed NewFileMap.
 * `vault.read` and `vault.cachedRead` stay separate: a cached read is not a fresh read.
 * Any plugin write drops that path before the next read can see the old text.
 */

interface Slot {
	gen: number;
	text: string;
}

interface MapSlot {
	gen: number;
	text: string;
	map: NewFileMap;
}

interface FileRun {
	depth: number;
	closed: boolean;
	vault: Record<string, unknown>;
	gen: Map<string, number>;
	fresh: Map<string, Slot>;
	scan: Map<string, Slot>;
	maps: Map<string, MapSlot>;
	restore: Array<() => void>;
}

let active: FileRun | null = null;

type AnyFn = (...args: unknown[]) => unknown;

export function beginFileRun(vault: unknown): () => void {
	if (!vault || typeof vault !== 'object') return () => undefined;
	if (active && active.vault === vault) {
		active.depth++;
		return endOne;
	}
	const run: FileRun = {
		depth: 1,
		closed: false,
		vault: vault as Record<string, unknown>,
		gen: new Map(),
		fresh: new Map(),
		scan: new Map(),
		maps: new Map(),
		restore: [],
	};
	active = run;
	openVaultIdIndex();
	installRead(run, 'read', 'read');
	installRead(run, 'cachedRead', 'cached');
	for (const name of ['modify', 'process', 'append', 'delete'] as const) {
		installWrite(run, name, args => invalidate(run, pathOf(args[0]), true));
	}
	installWrite(run, 'create', args => invalidate(run, typeof args[0] === 'string' ? args[0] : pathOf(args[0]), true));
	installWrite(run, 'rename', args => {
		invalidate(run, pathOf(args[0]), true);
		invalidate(run, typeof args[1] === 'string' ? args[1] : undefined, false);
	});
	installEvents(run);
	return endOne;
}

function endOne(): void {
	if (!active) return;
	active.depth--;
	if (active.depth > 0) return;
	active.closed = true;
	for (const restore of active.restore.reverse()) restore();
	closeVaultIdIndex();
	active = null;
}

export async function syncFileMap(app: App, plugin: TickTickSync, file: TFile, text: string): Promise<NewFileMap> {
	const run = active;
	if (!run) {
		const created = new NewFileMap(app, plugin, file);
		await created.init(text);
		return created;
	}
	const generation = run.gen.get(file.path) ?? 0;
	const hit = run.maps.get(file.path);
	if (hit && hit.gen === generation && hit.text === text) return hit.map;
	const created = new NewFileMap(app, plugin, file);
	await created.init(text);
	if ((run.gen.get(file.path) ?? 0) === generation) {
		run.maps.set(file.path, { gen: generation, text, map: created });
	}
	return created;
}

function installRead(run: FileRun, name: 'read' | 'cachedRead', kind: 'read' | 'cached'): void {
	const orig = run.vault[name];
	if (typeof orig !== 'function') return;
	const fn = orig as AnyFn;
	const store = kind === 'read' ? run.fresh : run.scan;
	run.vault[name] = async (file: unknown, ...rest: unknown[]) => {
		const path = pathOf(file);
		const generation = path ? (run.gen.get(path) ?? 0) : 0;
		if (path) {
			const hit = store.get(path);
			if (hit && hit.gen === generation) return hit.text;
		}
		const text = await fn.apply(run.vault, [file, ...rest]);
		if (typeof text === 'string' && path && (run.gen.get(path) ?? 0) === generation) {
			store.set(path, { gen: generation, text });
		}
		noteFileRead(kind);
		return text;
	};
	run.restore.push(() => {
		run.vault[name] = orig;
	});
}

function installWrite(run: FileRun, name: string, after: (args: unknown[]) => void): void {
	const orig = run.vault[name];
	if (typeof orig !== 'function') return;
	const fn = orig as AnyFn;
	run.vault[name] = async (...args: unknown[]) => {
		const result = await fn.apply(run.vault, args);
		after(args);
		return result;
	};
	run.restore.push(() => {
		run.vault[name] = orig;
	});
}

function installEvents(run: FileRun): void {
	const on = run.vault.on;
	const off = run.vault.off;
	if (typeof on !== 'function') return;
	const drop = (file: unknown) => invalidate(run, pathOf(file), false);
	const renamed = (file: unknown, oldPath: unknown) => {
		invalidate(run, typeof oldPath === 'string' ? oldPath : undefined, false);
		invalidate(run, pathOf(file), false);
	};
	(on as AnyFn).call(run.vault, 'modify', drop);
	(on as AnyFn).call(run.vault, 'create', drop);
	(on as AnyFn).call(run.vault, 'delete', drop);
	(on as AnyFn).call(run.vault, 'rename', renamed);
	if (typeof off === 'function') {
		run.restore.push(() => {
			(off as AnyFn).call(run.vault, 'modify', drop);
			(off as AnyFn).call(run.vault, 'create', drop);
			(off as AnyFn).call(run.vault, 'delete', drop);
			(off as AnyFn).call(run.vault, 'rename', renamed);
		});
	}
}

function invalidate(run: FileRun, path: string | undefined, countWrite: boolean): void {
	if (run.closed) return;
	invalidateVaultIdIndex();
	if (!path) return;
	const next = (run.gen.get(path) ?? 0) + 1;
	run.gen.set(path, next);
	run.fresh.delete(path);
	run.scan.delete(path);
	run.maps.delete(path);
	if (countWrite) noteVaultWrite();
}

function pathOf(file: unknown): string | undefined {
	if (typeof file === 'string') return file;
	if (file && typeof file === 'object' && 'path' in file && typeof (file as { path: unknown }).path === 'string') {
		return (file as { path: string }).path;
	}
	return undefined;
}
