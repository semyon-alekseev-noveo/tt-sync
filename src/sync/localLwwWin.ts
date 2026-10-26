/**
 * Tasks whose pull conflict resolved to the local body (RISK-PULL-WINS-LOCAL).
 * Vault reconcile reads this once, then rewrites a line whose hash does not match.
 * Bookkeeping `modifiedTime` vs a dirty flag is not decided here.
 */
const pending = new Set<string>();

export function clearLocalLwwWins(): void {
	pending.clear();
}

export function markLocalLwwWin(taskId: string): void {
	if (taskId) pending.add(taskId);
}

/** True once. A later reconcile in this process does not rewrite again. */
export function consumeLocalLwwWin(taskId: string): boolean {
	if (!taskId || !pending.has(taskId)) return false;
	pending.delete(taskId);
	return true;
}

/** Non-enumerable so Dexie does not store the hint. */
export function defineLocalLwwRewrite(task: object): void {
	Object.defineProperty(task, '__localLwwRewrite', {
		value: true,
		enumerable: false,
		configurable: true,
	});
}

export function isLocalLwwRewrite(task: object): boolean {
	return (task as { __localLwwRewrite?: boolean }).__localLwwRewrite === true;
}
