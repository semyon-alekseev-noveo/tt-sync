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
 */
export function pathsForPrePullPush(app: App, registeredPaths: string[], since: number): string[] {
	const out = new Set(editedSince(app, registeredPaths, since));
	const active = activeMarkdownPathInPushScope(app);
	if (active && registeredPaths.includes(active)) out.add(active);
	return [...out];
}
