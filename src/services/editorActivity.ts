/** Last editor-change time per note path. Used to defer a vault write while the user is typing. */
const lastTypedAt = new Map<string, number>();

export const TYPING_DEFER_MS = 2000;

export function noteEditorActivity(path: string, now = Date.now()): void {
	if (!path) return;
	lastTypedAt.set(path, now);
}

export function clearEditorActivity(path?: string): void {
	if (path) lastTypedAt.delete(path);
	else lastTypedAt.clear();
}

/** True when this note received an editor change within `withinMs`. */
export function typedWithin(path: string, withinMs = TYPING_DEFER_MS, now = Date.now()): boolean {
	const at = lastTypedAt.get(path);
	return at != null && now - at < withinMs;
}
