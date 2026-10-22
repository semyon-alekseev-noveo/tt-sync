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
export interface ActiveFilePushPlan {
	push: boolean;
	skipLines: number[];
	/** The quiet period already elapsed, but a sync is running. Run the push when it ends. */
	retryAfterSync: boolean;
}

const deferredDuringSync = new Set<string>();
let releaseHook: ((paths: string[]) => void) | null = null;

export function planActiveFilePush(ctx: ActiveFilePushContext): ActiveFilePushPlan {
	if (!ctx.hasToken || !ctx.inScope || !ctx.isMarkdown) {
		return { push: false, skipLines: [], retryAfterSync: false };
	}
	if (ctx.syncRunning) {
		return { push: false, skipLines: [], retryAfterSync: true };
	}
	const skipLines: number[] = [];
	if (ctx.caretLine != null && ctx.caretIsTask && isUnfinishedCapture(ctx.caretTitle, ctx.caretRaw)) {
		skipLines.push(ctx.caretLine);
	}
	return { push: true, skipLines, retryAfterSync: false };
}

/**
 * BUG-COMMENT-ABYSS-VIEW: Abyss Tasks (and any non-markdown-editor writer) fires vault.modify
 * but not workspace editor-change. The debounced open-note push must still be scheduled.
 */
export function shouldNotifyPushOnVaultModify(ctx: {
	hasToken: boolean;
	isMarkdown: boolean;
	inScope: boolean;
}): boolean {
	return !!(ctx.hasToken && ctx.isMarkdown && ctx.inScope);
}

/** Remember a path whose 5-second push came due while a sync was running. */
export function deferActiveFilePush(filepath: string): void {
	if (filepath) deferredDuringSync.add(filepath);
}

export function setActiveFilePushRelease(hook: ((paths: string[]) => void) | null): void {
	releaseHook = hook;
}

/** After syncRunning is cleared. The hook pushes; callers without a hook get the paths back. */
export function releaseDeferredActiveFilePushes(): string[] {
	const paths = [...deferredDuringSync];
	deferredDuringSync.clear();
	if (paths.length && releaseHook) releaseHook(paths);
	return paths;
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
