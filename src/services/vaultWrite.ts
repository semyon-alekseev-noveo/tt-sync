import { Notice, TFile, type App, type Editor } from 'obsidian';
import { TYPING_DEFER_MS, typedWithin } from '@/services/editorActivity';
import { traceWrite } from '@/services/writeTrace';
import { invalidateFileRun, syncRead } from '@/sync/fileRunCache';
import { notePluginWrite } from '@/utils/editedSince';
import log from '@/utils/logger';

export const OPEN_NOTE_DEFER_NOTICE = 'Open note will update when you pause typing.';

export interface LineSpan {
	start: number;
	oldCount: number;
	oldLines: string[];
	newLines: string[];
}

interface RangeChange {
	from: { line: number; ch: number };
	to: { line: number; ch: number };
	text: string;
}

export interface CommitResult {
	status: 'written' | 'deferred' | 'unchanged';
	skipped: number;
}

/** Write-ahead record for one note write. `commit` runs only after the text landed. */
export interface PendingNoteWrite {
	commit(): Promise<void>;
}

/**
 * Installed by the redo log. `prepare` appends the journal entry before the note changes.
 * A null result means "do not record" (no session, unchanged text).
 */
export interface NoteJournal {
	prepare(path: string, before: string, after: string): Promise<PendingNoteWrite | null>;
}

let noteJournal: NoteJournal | null = null;
let helperVaultWrites = 0;

export function setNoteJournal(journal: NoteJournal | null): void {
	noteJournal = journal;
}

/** True while `commitVaultText` is inside `vault.process`, so the vault hook does not journal that write twice. */
export function isHelperVaultWrite(): boolean {
	return helperVaultWrites > 0;
}

/**
 * Line-level diff of two note texts. Spans do not overlap and refer to `before`.
 * A note open in an editor never collapses to one whole-document span.
 */
export function lineSpans(before: string, after: string, opts?: { openEditor?: boolean }): LineSpan[] {
	if (before === after) return [];
	const a = before.split('\n');
	const b = after.split('\n');
	const n = a.length;
	const m = b.length;
	if (n * m > 1_500_000) {
		if (opts?.openEditor) return endsDiff(a, b);
		return [{ start: 0, oldCount: n, oldLines: a, newLines: b }];
	}
	const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
	for (let i = n - 1; i >= 0; i--) {
		const row = dp[i];
		const next = dp[i + 1];
		for (let j = m - 1; j >= 0; j--) {
			row[j] = a[i] === b[j] ? next[j + 1] + 1 : Math.max(next[j], row[j + 1]);
		}
	}
	const spans: LineSpan[] = [];
	let i = 0;
	let j = 0;
	let oldLines: string[] = [];
	let newLines: string[] = [];
	let start = 0;
	const flush = () => {
		if (!oldLines.length && !newLines.length) return;
		spans.push({ start, oldCount: oldLines.length, oldLines, newLines });
		oldLines = [];
		newLines = [];
	};
	while (i < n && j < m) {
		if (a[i] === b[j]) {
			flush();
			i++;
			j++;
		} else if (dp[i + 1][j] >= dp[i][j + 1]) {
			if (!oldLines.length && !newLines.length) start = i;
			oldLines.push(a[i]);
			i++;
		} else {
			if (!oldLines.length && !newLines.length) start = i;
			newLines.push(b[j]);
			j++;
		}
	}
	while (i < n) {
		if (!oldLines.length && !newLines.length) start = i;
		oldLines.push(a[i]);
		i++;
	}
	while (j < m) {
		if (!oldLines.length && !newLines.length) start = i;
		newLines.push(b[j]);
		j++;
	}
	flush();
	return spans;
}

/** One middle span between a shared prefix and a shared suffix. Used when the LCS table would be huge and an editor is open. */
function endsDiff(a: string[], b: string[]): LineSpan[] {
	let prefix = 0;
	const limit = Math.min(a.length, b.length);
	while (prefix < limit && a[prefix] === b[prefix]) prefix++;
	let aEnd = a.length;
	let bEnd = b.length;
	while (aEnd > prefix && bEnd > prefix && a[aEnd - 1] === b[bEnd - 1]) {
		aEnd--;
		bEnd--;
	}
	const oldLines = a.slice(prefix, aEnd);
	const newLines = b.slice(prefix, bEnd);
	if (!oldLines.length && !newLines.length) return [];
	return [{ start: prefix, oldCount: oldLines.length, oldLines, newLines }];
}

/**
 * Apply spans to `current`. A span is applied only when the lines at its index
 * still equal the planned old text. Other spans are skipped.
 */
export function applyLineSpans(current: string, spans: LineSpan[]): { text: string; applied: number; skipped: number } {
	const lines = current.split('\n');
	let applied = 0;
	let skipped = 0;
	const ordered = [...spans].sort((x, y) => y.start - x.start);
	for (const span of ordered) {
		const got = lines.slice(span.start, span.start + span.oldCount);
		const matches = got.length === span.oldCount && got.every((line, idx) => line === span.oldLines[idx]);
		if (!matches) {
			skipped++;
			continue;
		}
		lines.splice(span.start, span.oldCount, ...span.newLines);
		applied++;
	}
	return { text: lines.join('\n'), applied, skipped };
}

function editorOf(view: unknown, path: string): Editor | null {
	if (!view || typeof view !== 'object') return null;
	const v = view as { file?: { path?: string }; editor?: Editor };
	if (v.file?.path !== path || !v.editor?.getLine) return null;
	return v.editor;
}

/** Replace the whole buffer through a single range change (no `setValue`). */
function replaceEditorBuffer(editor: Editor, text: string): void {
	const lineCount = typeof editor.lineCount === 'function' ? editor.lineCount() : 0;
	const from = { line: 0, ch: 0 };
	const to =
		lineCount === 0
			? from
			: { line: lineCount - 1, ch: editor.getLine(lineCount - 1).length };
	const change = { from, to, text };
	if (typeof editor.transaction === 'function') editor.transaction({ changes: [change] });
	else editor.replaceRange(text, from, to);
}

/**
 * Obsidian sometimes shows an empty markdown buffer while the file on disk is intact.
 * Repair every open editor for the path so the user sees disk text and sync does not plan from `""`.
 */
export async function repairEmptyEditorFromDisk(app: App, file: TFile): Promise<boolean> {
	if (typedWithin(file.path, TYPING_DEFER_MS)) {
		return false;
	}
	let disk: string;
	try {
		disk = await app.vault.read(file);
	} catch {
		return false;
	}
	if (!disk) return false;
	let repaired = false;
	for (const editor of editorsForFile(app, file.path)) {
		if (bufferOf(editor) !== '') continue;
		log.info(`Repairing empty editor buffer for ${file.path} from disk (${disk.length} chars)`);
		replaceEditorBuffer(editor, disk);
		repaired = true;
	}
	return repaired;
}

/**
 * Editor buffer when a leaf shows `file`, unless the buffer is empty and disk is not — then disk wins for sync.
 * A hover or popout leaf can be the active editor for a different path.
 */
export async function readNoteForWrite(app: App, file: TFile): Promise<string> {
	const editors = editorsForFile(app, file.path);
	const editor = editorToPatch(editors);
	if (editor) {
		const editorText = bufferOf(editor);
		if (editorText !== '') return editorText;
		const diskText = await syncRead(app.vault, file);
		if (diskText !== '') {
			log.info(`Open note ${file.path}: empty editor buffer; using disk for sync read`);
			return diskText;
		}
		return editorText;
	}
	return await syncRead(app.vault, file);
}

/** Editors that currently show `path`, including a hover or popout leaf. */
export function editorsForFile(app: App, path: string): Editor[] {
	const found: Editor[] = [];
	const ws = app.workspace as App['workspace'] & {
		iterateAllLeaves?: (cb: (leaf: { view?: unknown }) => void) => void;
	};
	if (typeof ws?.iterateAllLeaves === 'function') {
		ws.iterateAllLeaves((leaf) => {
			const editor = editorOf(leaf?.view, path);
			if (editor && !found.includes(editor)) found.push(editor);
		});
	}
	const active = ws?.activeEditor;
	if (active?.file?.path === path && active.editor && !found.includes(active.editor)) {
		found.push(active.editor);
	}
	return found;
}

/** The focused editor, or the first one showing the file. One patch per file. */
function editorToPatch(editors: Editor[]): Editor | null {
	if (!editors.length) return null;
	return editors.find(editor => typeof editor.hasFocus === 'function' && editor.hasFocus()) ?? editors[0];
}

function caretLines(editor: Editor): { lo: number; hi: number } | null {
	if (typeof editor.hasFocus !== 'function' || !editor.hasFocus()) return null;
	let lo = Number.POSITIVE_INFINITY;
	let hi = -1;
	const take = (pos: { line?: number } | null | undefined) => {
		if (typeof pos?.line === 'number' && Number.isFinite(pos.line)) {
			lo = Math.min(lo, pos.line);
			hi = Math.max(hi, pos.line);
		}
	};
	if (typeof editor.getCursor === 'function') {
		take(editor.getCursor());
		try { take(editor.getCursor('from')); } catch { /* single-argument cursor */ }
		try { take(editor.getCursor('to')); } catch { /* single-argument cursor */ }
	}
	const selections = typeof editor.listSelections === 'function' ? editor.listSelections() : [];
	for (const sel of selections ?? []) {
		take(sel?.anchor);
		take(sel?.head);
	}
	if (!Number.isFinite(lo) || hi < 0) return null;
	return { lo, hi };
}

function spanOverlaps(span: LineSpan, range: { lo: number; hi: number }): boolean {
	const spanHi = span.oldCount === 0 ? span.start : span.start + span.oldCount - 1;
	return span.start <= range.hi && spanHi >= range.lo;
}

function spanChange(editor: Editor, span: LineSpan): RangeChange | null {
	const lineCount = typeof editor.lineCount === 'function' ? editor.lineCount() : Number.POSITIVE_INFINITY;
	if (span.start < 0 || span.start > lineCount) return null;
	if (span.oldCount > 0 && span.start + span.oldCount > lineCount) return null;
	for (let i = 0; i < span.oldCount; i++) {
		if (editor.getLine(span.start + i) !== span.oldLines[i]) return null;
	}
	const from = { line: span.start, ch: 0 };
	if (span.oldCount === 0) {
		const text = span.newLines.length ? `${span.newLines.join('\n')}\n` : '';
		return { from, to: from, text };
	}
	const last = span.start + span.oldCount - 1;
	if (span.newLines.length === 0) {
		const next = last + 1;
		if (next < lineCount) return { from, to: { line: next, ch: 0 }, text: '' };
		if (span.start > 0) {
			return {
				from: { line: span.start - 1, ch: editor.getLine(span.start - 1).length },
				to: { line: last, ch: editor.getLine(last).length },
				text: '',
			};
		}
		return { from, to: { line: last, ch: editor.getLine(last).length }, text: '' };
	}
	return {
		from,
		to: { line: last, ch: editor.getLine(last).length },
		text: span.newLines.join('\n'),
	};
}

function bufferOf(editor: Editor): string {
	if (typeof editor.getValue === 'function') return editor.getValue();
	const count = typeof editor.lineCount === 'function' ? editor.lineCount() : 0;
	const lines: string[] = [];
	for (let i = 0; i < count; i++) lines.push(editor.getLine(i));
	return lines.join('\n');
}

function textFrom(snapshot: string, next: string, spans: LineSpan[], data: string): { text: string; skipped: number } {
	if (data === snapshot) return { text: next, skipped: 0 };
	const recomputed = applyLineSpans(data, spans);
	return { text: recomputed.text, skipped: recomputed.skipped };
}

/** Apply matching spans from the bottom so earlier indexes stay valid. Returns how many spans landed. */
function applyEditorSpans(editors: Editor[], spans: LineSpan[]): { applied: number; skipped: number } {
	let applied = 0;
	let skipped = 0;
	const ordered = [...spans].sort((a, b) => b.start - a.start);
	for (const span of ordered) {
		const changes: { editor: Editor; change: RangeChange }[] = [];
		for (const editor of editors) {
			const change = spanChange(editor, span);
			if (change) changes.push({ editor, change });
		}
		if (!changes.length) {
			skipped++;
			continue;
		}
		applied++;
		for (const { editor, change } of changes) {
			if (typeof editor.transaction === 'function') editor.transaction({ changes: [change] });
			else editor.replaceRange(change.text, change.from, change.to);
		}
	}
	return { applied, skipped };
}

/**
 * Journal `before` → `after`, then apply only if the buffer is still `before`.
 * A miss does not commit the record. One retry covers a change during the journal append.
 */
async function patchOpenEditors(app: App, file: TFile, editors: Editor[], spans: LineSpan[], attempt = 0): Promise<CommitResult> {
	const before = bufferOf(editors[0]);
	const planned = applyLineSpans(before, spans);
	if (planned.applied === 0 || planned.text === before) {
		return { status: 'deferred', skipped: planned.skipped };
	}
	const pending = await noteJournal?.prepare(file.path, before, planned.text) ?? null;
	if (bufferOf(editors[0]) !== before) {
		if (attempt >= 1) return { status: 'deferred', skipped: planned.skipped };
		return patchOpenEditors(app, file, editors, spans, attempt + 1);
	}
	const { applied, skipped } = applyEditorSpans(editors, spans);
	if (applied === 0) return { status: 'deferred', skipped };
	if (bufferOf(editors[0]) === planned.text) {
		await pending?.commit();
		await syncDiskToMatchEditor(app, file, planned.text);
	}
	return { status: 'written', skipped };
}

/** After an open-note patch, align disk with the editor using the same span guard as a closed note. */
async function syncDiskToMatchEditor(app: App, file: TFile, editorText: string): Promise<void> {
	const disk = await app.vault.read(file);
	if (disk === editorText) return;
	await writeClosedNote(app, file, disk, editorText, lineSpans(disk, editorText));
}

/**
 * Write `next`, which was built from `snapshot`.
 * Closed file: `vault.process` writes only when the file is still the text that was journaled.
 * If that text moved, the same line spans are applied once to the fresh text, journaled before the write.
 * Open file: `editor.transaction` on the task spans whose current lines still match.
 * The redo journal records that patch before the transaction, with the buffer before and after.
 * Never replaces the whole editor buffer. A keystroke in the last two seconds defers the write and records nothing.
 * A patch that does not land leaves the journal entry uncommitted.
 */
function traceCommit(app: App, file: TFile, api: string, reason: string, spans: LineSpan[], editor?: Editor | null): void {
	const range = editor ? caretLines(editor) : null;
	traceWrite(app, 'commitVaultText', file.path, api, {
		reason,
		focus: typeof editor?.hasFocus === 'function' ? editor.hasFocus() : undefined,
		spans: spans.map(span => ({
			start: span.start,
			oldCount: span.oldCount,
			newCount: span.newLines.length,
			touchesCaret: !!(range && spanOverlaps(span, range)),
		})),
	});
}

export async function commitVaultText(app: App, file: TFile, snapshot: string, next: string): Promise<CommitResult> {
	if (editorsForFile(app, file.path).length) {
		await repairEmptyEditorFromDisk(app, file);
		if (!snapshot) {
			const live = await readNoteForWrite(app, file);
			if (live) snapshot = live;
		}
	}
	if (next === snapshot) return { status: 'unchanged', skipped: 0 };
	if (typedWithin(file.path, TYPING_DEFER_MS)) {
		new Notice(OPEN_NOTE_DEFER_NOTICE);
		log.info(`Deferring write of ${file.path}: the note was edited moments ago`);
		traceCommit(app, file, 'defer', 'typing', []);
		return { status: 'deferred', skipped: 0 };
	}
	const editors = editorsForFile(app, file.path);
	const editor = editorToPatch(editors);
	const spans = lineSpans(snapshot, next, { openEditor: !!editor });
	if (editor) {
		const range = caretLines(editor);
		const safe = range ? spans.filter(span => !spanOverlaps(span, range)) : spans;
		if (!safe.length) {
			log.info(`Deferring write of ${file.path}: a span covers the cursor`);
			traceCommit(app, file, 'defer', 'caret', spans, editor);
			return { status: 'deferred', skipped: spans.length };
		}
		traceCommit(app, file, 'editor.transaction', safe.length === spans.length ? 'editor' : 'caret', spans, editor);
		return patchOpenEditors(app, file, [editor], safe);
	}
	traceCommit(app, file, 'vault.process', 'closed', spans);
	return writeClosedNote(app, file, snapshot, next, spans);
}

function rememberClosedWrite(file: TFile, before: number | undefined): void {
	invalidateFileRun(file.path, true);
	const mtime = file.stat?.mtime;
	if (typeof mtime === 'number' && mtime !== before) notePluginWrite(file.path, mtime);
}

async function writeClosedNote(app: App, file: TFile, snapshot: string, next: string, spans: LineSpan[]): Promise<CommitResult> {
	const beforeMtime = file.stat?.mtime;
	const live = await app.vault.read(file);
	const first = textFrom(snapshot, next, spans, live);
	const pending = first.text === live ? null : await noteJournal?.prepare(file.path, live, first.text) ?? null;
	const drifted = await commitClosed(app, file, live, first.text, (data) => textFrom(snapshot, next, spans, data));
	if (drifted.wrote) {
		await pending?.commit();
		rememberClosedWrite(file, beforeMtime);
		return { status: 'written', skipped: first.skipped };
	}
	if (!drifted.again) return { status: 'deferred', skipped: first.skipped };
	const pendingAgain = await noteJournal?.prepare(file.path, drifted.again.before, drifted.again.after) ?? null;
	const second = await commitClosed(app, file, drifted.again.before, drifted.again.after, (data) => ({ text: data, skipped: 0 }));
	if (!second.wrote) return { status: 'deferred', skipped: drifted.again.skipped };
	await pendingAgain?.commit();
	rememberClosedWrite(file, beforeMtime);
	return { status: 'written', skipped: drifted.again.skipped };
}

/**
 * Write `after` only when the file is still `before`. Otherwise remember the one recompute and write nothing.
 * The vault hook does not journal this call; the caller already did, or will journal `again`.
 */
async function commitClosed(
	app: App,
	file: TFile,
	before: string,
	after: string,
	recompute: (data: string) => { text: string; skipped: number },
): Promise<{ wrote: boolean; again: { before: string; after: string; skipped: number } | null }> {
	let wrote = false;
	let again: { before: string; after: string; skipped: number } | null = null;
	helperVaultWrites++;
	try {
		await app.vault.process(file, (data) => {
			if (data === before) {
				if (after !== data) wrote = true;
				return after;
			}
			const next = recompute(data);
			if (next.text === data) return data;
			again = { before: data, after: next.text, skipped: next.skipped };
			return data;
		});
	} finally {
		helperVaultWrites--;
	}
	return { wrote, again };
}

/** Front matter goes through the helper so a raw `processFrontMatter` is not a second write path. */
export async function commitFrontMatter(app: App, file: TFile, fn: (frontmatter: Record<string, unknown>) => void): Promise<void> {
	traceWrite(app, 'commitFrontMatter', file.path, 'processFrontMatter', { reason: 'frontmatter' });
	await app.fileManager?.processFrontMatter(file, fn);
}
