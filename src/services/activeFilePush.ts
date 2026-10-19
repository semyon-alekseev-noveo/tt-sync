import { isUnfinishedCapture } from '@/projectScheme';

/** Quiet period before an open note is pushed. Short enough to feel responsive, long enough to avoid a half-typed `%%`. */
export const ACTIVE_FILE_PUSH_DEBOUNCE_MS = 5000;

export interface ActiveFilePushContext {
	hasToken: boolean;
	syncRunning: boolean;
	inScope: boolean;
	isMarkdown: boolean;
	caretLine: number | null;
	caretIsTask: boolean;
	caretTitle: string;
	caretRaw: string;
}

/**
 * Whether a debounced push of the active file is safe, and which lines to leave alone.
 * The caret line is skipped only while it is still an unfinished capture. Other lines
 * (including a parent whose comment child just changed) are pushed.
 */
export function planActiveFilePush(ctx: ActiveFilePushContext): { push: boolean; skipLines: number[] } {
	if (!ctx.hasToken || ctx.syncRunning || !ctx.inScope || !ctx.isMarkdown) {
		return { push: false, skipLines: [] };
	}
	const skipLines: number[] = [];
	if (ctx.caretLine != null && ctx.caretIsTask && isUnfinishedCapture(ctx.caretTitle, ctx.caretRaw)) {
		skipLines.push(ctx.caretLine);
	}
	return { push: true, skipLines };
}

/** One timer per note. A new keystroke resets it. */
export function createActiveFilePushScheduler(opts: {
	debounceMs: number;
	push: (filepath: string) => void;
}): { notify: (filepath: string) => void; dispose: () => void } {
	let timer: ReturnType<typeof setTimeout> | undefined;
	return {
		notify(filepath: string) {
			if (timer !== undefined) clearTimeout(timer);
			timer = setTimeout(() => {
				timer = undefined;
				opts.push(filepath);
			}, opts.debounceMs);
		},
		dispose() {
			if (timer !== undefined) clearTimeout(timer);
			timer = undefined;
		},
	};
}
