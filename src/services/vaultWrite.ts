import { Notice, TFile, type App, type Editor } from 'obsidian';
import { TYPING_DEFER_MS, typedWithin } from '@/services/editorActivity';
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

/** Line-level diff of two note texts. Spans do not overlap and refer to `before`. */
export function lineSpans(before: string, after: string): LineSpan[] {
	if (before === after) return [];
	const a = before.split('\n');
	const b = after.split('\n');
	const n = a.length;
	const m = b.length;
	if (n * m > 1_500_000) {
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

/**
 * Editor buffer only when that editor is showing `file`. Otherwise the file on disk.
 * A hover or popout leaf can be the active editor for a different path.
 */
export async function readNoteForWrite(app: App, file: TFile): Promise<string> {
	const active = app.workspace?.activeEditor;
	if (active?.editor && active.file?.path === file.path) {
		return active.editor.getValue();
	}
	return await app.vault.read(file);
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

/**
 * Write `next`, which was built from `snapshot`.
 * Closed file: `vault.process` writes only when the file is still `snapshot`;
 * otherwise the same line spans are applied once to the fresh text.
 * Open file: `editor.transaction` on the task spans whose current lines still match.
 * Never replaces the whole editor buffer. A keystroke in the last two seconds defers the write.
 */
export async function commitVaultText(app: App, file: TFile, snapshot: string, next: string): Promise<CommitResult> {
	if (next === snapshot) return { status: 'unchanged', skipped: 0 };
	if (typedWithin(file.path, TYPING_DEFER_MS)) {
		new Notice(OPEN_NOTE_DEFER_NOTICE);
		log.info(`Deferring write of ${file.path}: the note was edited moments ago`);
		return { status: 'deferred', skipped: 0 };
	}
	const spans = lineSpans(snapshot, next);
	const editors = editorsForFile(app, file.path);
	if (editors.length) {
		let applied = 0;
		let skipped = 0;
		for (const span of spans) {
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
		if (applied === 0) return { status: 'deferred', skipped };
		return { status: 'written', skipped };
	}
	let skipped = 0;
	let wrote = false;
	await app.vault.process(file, (data) => {
		if (data === snapshot) {
			wrote = true;
			return next;
		}
		const recomputed = applyLineSpans(data, spans);
		skipped = recomputed.skipped;
		if (recomputed.text === data) return data;
		wrote = true;
		return recomputed.text;
	});
	if (!wrote) return { status: 'deferred', skipped };
	return { status: 'written', skipped };
}
