import type { App, TFile } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import { NewFileMap } from '@/services/NewFileMap';
import { noteFileRead, noteVaultWrite } from '@/sync/perf';
import { closeVaultIdIndex, invalidateVaultIdIndex, openVaultIdIndex } from '@/utils/vaultIdScan';

/**
 * Per-sync cache of file text and the parsed NewFileMap.
 * Plugin code reads through {@link syncRead} / {@link syncCachedRead}.
 * `app.vault.read` and `app.vault.cachedRead` are never replaced: Obsidian's own
 * view reload must keep seeing the disk, not a copy taken at the start of the run.
 * A file open in an editor is never cached. A plugin write drops that path.
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
	vault: object;
	gen: Map<string, number>;
	fresh: Map<string, Slot>;
	scan: Map<string, Slot>;
	maps: Map<string, MapSlot>;
	editorOpen?: (path: string) => boolean;
	restore: Array<() => void>;
}

let active: FileRun | null = null;

type ReadVault = {
	// `any` so Obsidian's `(file: TFile) => Promise<string>` is assignable. Events are not part of this type.
	read?: (file: any, ...rest: any[]) => Promise<any>;
	cachedRead?: (file: any, ...rest: any[]) => Promise<any>;
};

export function fileRunIsActive(): boolean {
	return !!active && !active.closed;
}

export function beginFileRun(vault: unknown, opts?: { editorOpen?: (path: string) => boolean }): () => void {
	if (!vault || typeof vault !== 'object') return () => { /* no vault */ };
	if (active && active.vault === vault) {
		active.depth++;
		if (opts?.editorOpen) active.editorOpen = opts.editorOpen;
		return endOne;
	}
	const run: FileRun = {
		depth: 1,
		closed: false,
		vault,
		gen: new Map(),
		fresh: new Map(),
		scan: new Map(),
		maps: new Map(),
		editorOpen: opts?.editorOpen,
		restore: [],
	};
	active = run;
	openVaultIdIndex();
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

/** Drop one path (or the id index, when `path` is omitted) so the next plugin read is fresh. */
export function invalidateFileRun(path: string | undefined, countWrite = false): void {
	if (!active || active.closed) {
		invalidateVaultIdIndex();
		return;
	}
	invalidate(active, path, countWrite);
}

export async function syncRead(vault: ReadVault, file: { path: string }, ...rest: unknown[]): Promise<string> {
	return readThrough(vault, 'read', 'read', file, rest);
}

export async function syncCachedRead(vault: ReadVault, file: { path: string }, ...rest: unknown[]): Promise<string> {
	return readThrough(vault, 'cachedRead', 'cached', file, rest);
}

async function readThrough(
	vault: ReadVault,
	name: 'read' | 'cachedRead',
	kind: 'read' | 'cached',
	file: { path: string },
	rest: unknown[],
): Promise<string> {
	const fn = vault[name];
	if (typeof fn !== 'function') return '';
	const run = active;
	const path = pathOf(file);
	const open = !!(path && run && !run.closed && run.editorOpen?.(path));
	const caching = !!run && !run.closed && run.vault === vault && !open;
	if (!caching || !run) {
		const text = await fn.call(vault, file, ...rest);
		if (run && !run.closed) noteFileRead(kind);
		return typeof text === 'string' ? text : '';
	}
	const store = kind === 'read' ? run.fresh : run.scan;
	const generation = path ? (run.gen.get(path) ?? 0) : 0;
	if (path) {
		const hit = store.get(path);
		if (hit && hit.gen === generation) return hit.text;
	}
	const text = await fn.call(vault, file, ...rest);
	if (typeof text === 'string' && path && (run.gen.get(path) ?? 0) === generation && !run.editorOpen?.(path)) {
		store.set(path, { gen: generation, text });
	}
	noteFileRead(kind);
	return typeof text === 'string' ? text : '';
}

export async function syncFileMap(app: App, plugin: PluginContext, file: TFile, text: string): Promise<NewFileMap> {
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

function installEvents(run: FileRun): void {
	const vault = run.vault as {
		on?: (event: string, handler: (...args: any[]) => void) => void;
		off?: (event: string, handler: (...args: any[]) => void) => void;
	};
	if (typeof vault.on !== 'function') return;
	const drop = (file: unknown) => invalidate(run, pathOf(file), false);
	const renamed = (file: unknown, oldPath: unknown) => {
		invalidate(run, typeof oldPath === 'string' ? oldPath : undefined, false);
		invalidate(run, pathOf(file), false);
	};
	vault.on('modify', drop);
	vault.on('create', drop);
	vault.on('delete', drop);
	vault.on('rename', renamed);
	if (typeof vault.off === 'function') {
		run.restore.push(() => {
			vault.off!('modify', drop);
			vault.off!('create', drop);
			vault.off!('delete', drop);
			vault.off!('rename', renamed);
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
