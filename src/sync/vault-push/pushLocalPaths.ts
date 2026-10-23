import type { App } from 'obsidian';
import { TFile } from 'obsidian';
import { editedSince } from '@/utils/editedSince';
import { isPathInPushScope } from '@/syncScope';

/** Active markdown leaf path when it may push to TickTick. */
export function activeMarkdownPathInPushScope(app: App): string | undefined {
	const file = app.workspace.getActiveFile?.() ?? app.workspace.activeEditor?.file;
	if (!(file instanceof TFile) || file.extension !== 'md') return undefined;
	if (!isPathInPushScope(file.path)) return undefined;
	return file.path;
}

/**
 * Files to run through pre-pull push (`checkFileForModifications` + comment sweep).
 * Includes mtime-edited paths and the active in-scope note so comment-only edits
 * on an open leaf still reach the Comments API when disk mtime did not move (BUG-COMMENT-ACTIVE-NOTE).
 *
 * TP-IDLE-MANUAL-SCOPE (#83): do **not** expand to every registered path on manual
 * sync — that doubled the vault comment sweep with `syncFiles`. Quiet Synchronize
 * sweeps only edited + active here; `syncFiles` covers the rest once.
 * `opts.manualSync` is accepted for callers but no longer changes the set.
 */
export function pathsForPrePullPush(
	app: App,
	registeredPaths: string[],
	since: number,
	_opts?: { manualSync?: boolean },
): string[] {
	const out = new Set(editedSince(app, registeredPaths, since));
	const active = activeMarkdownPathInPushScope(app);
	if (active && registeredPaths.includes(active)) out.add(active);
	return [...out];
}
