import { MarkdownView, TFile, type App, type Editor } from 'obsidian';
import { getSettings } from '@/settings';
import { typedAgoMs } from '@/services/editorActivity';
import { fileRunIsActive } from '@/sync/vault-io/fileRunCache';
import { currentSyncPhase, currentSyncTrigger } from '@/sync/perf';
import log from '@/utils/logger';

/**
 * Debug write trace. Off unless `debugWriteTrace` is on.
 * Each record goes to the console (warn) and to `<vault>/.tickticksync/write-trace.jsonl`.
 * Turn the setting on, then reload the plugin so the view-reload check is installed.
 */

const TRACE_PATH = '.tickticksync/write-trace.jsonl';

export interface WriteTraceSpan {
	start: number;
	oldCount: number;
	newCount: number;
	touchesCaret: boolean;
}

export interface WriteTraceExtra {
	trigger?: string;
	phase?: string;
	editorOpen?: number;
	activeIsThis?: boolean;
	focus?: boolean;
	bufferEqDisk?: boolean | null;
	typedAgoMs?: number | null;
	caretLine?: number | null;
	spans?: WriteTraceSpan[];
	oldLines?: string;
	newLines?: string;
	taskIds?: string[];
	reason?: string;
	fileRunActive?: boolean;
	to?: string;
	[key: string]: unknown;
}

let watchInstalled = false;
let traceApp: App | null = null;

function clip(text: string | undefined, n = 120): string | undefined {
	if (text == null) return undefined;
	return text.length > n ? `${text.slice(0, n)}…` : text;
}

function editorsOf(app: App, path: string): Editor[] {
	const found: Editor[] = [];
	const ws = app.workspace as App['workspace'] & {
		iterateAllLeaves?: (cb: (leaf: { view?: unknown }) => void) => void;
	};
	const take = (view: unknown) => {
		if (!view || typeof view !== 'object') return;
		const v = view as { file?: { path?: string }; editor?: Editor };
		if (v.file?.path === path && v.editor?.getLine && !found.includes(v.editor)) found.push(v.editor);
	};
	if (typeof ws?.iterateAllLeaves === 'function') ws.iterateAllLeaves(leaf => take(leaf?.view));
	take(ws?.activeEditor ? { file: ws.activeEditor.file, editor: ws.activeEditor.editor } : null);
	return found;
}

function callerStack(): string[] {
	return (new Error().stack ?? '').split('\n').slice(3, 8).map(line => line.trim());
}

async function appendTrace(app: App | null, entry: Record<string, unknown>): Promise<void> {
	const adapter = app?.vault?.adapter;
	if (!adapter?.append) return;
	try {
		if (adapter.exists && !(await adapter.exists('.tickticksync'))) {
			await adapter.mkdir?.('.tickticksync');
		}
		await adapter.append(TRACE_PATH, `${JSON.stringify(entry)}\n`);
	} catch (error) {
		log.debug('write trace append failed', error);
	}
}

/**
 * Log one write or one update decision. No-op when the setting is off.
 * `bufferEqDisk` is filled from `adapter.read` when an editor is open, not from `vault.read`.
 */
export function traceWrite(app: App | null | undefined, site: string, path: string | undefined, api: string, extra: WriteTraceExtra = {}): void {
	if (!getSettings().debugWriteTrace) return;
	const live = app ?? traceApp;
	const editors = live && path ? editorsOf(live, path) : [];
	const active = live?.workspace?.activeEditor;
	const editor = editors.find(item => typeof item.hasFocus === 'function' && item.hasFocus()) ?? editors[0];
	const caret = editor && typeof editor.getCursor === 'function' ? editor.getCursor().line : null;
	const entry: Record<string, unknown> = {
		ts: new Date().toISOString(),
		site,
		path,
		api,
		trigger: extra.trigger ?? currentSyncTrigger(),
		phase: extra.phase ?? currentSyncPhase(),
		editorOpen: extra.editorOpen ?? editors.length,
		activeIsThis: extra.activeIsThis ?? (!!path && active?.file?.path === path),
		focus: extra.focus ?? (typeof editor?.hasFocus === 'function' ? editor.hasFocus() : undefined),
		typedAgoMs: extra.typedAgoMs ?? (path ? typedAgoMs(path) : null),
		caretLine: extra.caretLine ?? caret,
		spans: extra.spans,
		oldLines: clip(extra.oldLines),
		newLines: clip(extra.newLines),
		taskIds: extra.taskIds,
		reason: extra.reason,
		fileRunActive: extra.fileRunActive ?? fileRunIsActive(),
		to: extra.to,
		caller: callerStack(),
	};
	log.warn(`[write-trace] ${JSON.stringify(entry)}`);
	void (async () => {
		if (live && path && editor && typeof editor.getValue === 'function' && live.vault?.adapter?.read) {
			try {
				const disk = await live.vault.adapter.read(path);
				entry.bufferEqDisk = editor.getValue() === disk;
			} catch {
				entry.bufferEqDisk = null;
			}
		}
		await appendTrace(live, entry);
	})();
}

async function logViewVsDisk(app: App, file: { path?: string }): Promise<void> {
	if (!getSettings().debugWriteTrace || !file?.path) return;
	const editors = editorsOf(app, file.path);
	if (!editors.length) return;
	let diskLen = -1;
	try {
		diskLen = (await app.vault.adapter.read(file.path)).length;
	} catch {
		diskLen = -1;
	}
	const viewLen = typeof editors[0].getValue === 'function' ? editors[0].getValue().length : -1;
	traceWrite(app, 'vault.modify', file.path, 'view-vs-disk', {
		reason: 'modify',
		editorOpen: editors.length,
		bufferEqDisk: viewLen === diskLen,
		fileRunActive: fileRunIsActive(),
	});
}

/**
 * Register the modify listener before any sync run. The `setViewData` wrap is installed
 * only while the setting is on, and only logs a reload whose text is not the disk.
 */
export function installWriteTraceWatch(plugin: { app: App }): void {
	traceApp = plugin.app;
	if (watchInstalled) return;
	watchInstalled = true;
	const ref = plugin.app.vault.on('modify', file => { void logViewVsDisk(plugin.app, file); });
	(plugin as { registerEvent?: (eventRef: typeof ref) => void }).registerEvent?.(ref);
	if (!getSettings().debugWriteTrace) return;
	const proto = MarkdownView.prototype as unknown as {
		setViewData?: (data: string, clear: boolean) => void;
	};
	const orig = proto.setViewData;
	if (!orig || (orig as { __ttsTrace?: boolean }).__ttsTrace) return;
	const setViewData = orig;
	function wrapped(this: { file?: TFile }, data: string, clear: boolean) {
		if (getSettings().debugWriteTrace && traceApp && this?.file instanceof TFile) {
			const path = this.file.path;
			void traceApp.vault.adapter.read(path).then(disk => {
				traceWrite(traceApp, 'setViewData', path, 'setViewData', {
					reason: 'view-reload',
					bufferEqDisk: data === disk,
					fileRunActive: fileRunIsActive(),
					clear,
					newLines: data,
				});
			}).catch(() => undefined);
		}
		return setViewData.call(this, data, clear);
	}
	(wrapped as { __ttsTrace?: boolean }).__ttsTrace = true;
	proto.setViewData = wrapped;
}
