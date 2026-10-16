// GTD sync scope (pure helpers + thin settings wrappers).
// - syncedLists: TickTick lists (name or id) that are pulled / get list files. Empty = none.
// - syncScopeFolders: vault folders that may push to TickTick. Empty = no restriction.
import { getDefaultFolder, getSettings } from '@/settings';

export interface ListRef { id: string; name: string }

const lc = (s: string) => s.trim().toLowerCase();

/** One entry per line, trimmed, blanks and duplicates dropped. */
export function parseLineList(text: string): string[] {
	const out: string[] = [];
	for (const raw of text.split('\n')) {
		const v = raw.trim();
		if (v && !out.includes(v)) out.push(v);
	}
	return out;
}
export const lineListToText = (list: string[] | undefined) => (list ?? []).join('\n');

/** Lowercase SyncTag with `/` → `-`, matching pull sync (`syncModule` / vault coordinator). */
export function normalizeSyncTag(raw?: string | null): string | undefined {
	const t = (raw ?? '').trim();
	if (!t) return undefined;
	let syncTag = t.toLowerCase();
	if (syncTag.includes('/')) syncTag = syncTag.replace(/\//g, '-');
	return syncTag;
}

export interface TaskSyncLimitOptions {
	syncTag?: string;
	syncProject?: string;
	andOr?: number;
	allowedListIds?: Set<string>;
}

/** Same gate as vault pull: allow-listed list, then optional SyncTag / SyncProject. */
export function taskMatchesSyncLimit(
	task: { projectId?: string; tags?: string[] | null },
	opts: TaskSyncLimitOptions,
): boolean {
	const { syncTag, syncProject, andOr, allowedListIds } = opts;
	if (allowedListIds && !allowedListIds.has(task.projectId ?? '')) return false;
	if (!syncTag && !syncProject) return true;
	const tags = task.tags ?? [];
	const hasTag = syncTag ? tags.some(t => t.toLowerCase() === syncTag) : false;
	const hasProject = syncProject ? task.projectId === syncProject : false;
	if (syncTag && syncProject) {
		return andOr === 1 ? (hasTag && hasProject) : (hasTag || hasProject);
	}
	return hasTag || hasProject;
}

/** Project-scheme list: name wins over a stale `projectsListId` (e.g. live Projects vs TTS-Projects). */
export function resolveProjectsList(
	lists: ListRef[],
	projectsListName: string | undefined,
	projectsListId?: string,
): ListRef | undefined {
	const name = (projectsListName || 'Projects').toLowerCase();
	const byName = lists.find(l => l.name.toLowerCase() === name);
	if (byName) return byName;
	if (projectsListId) return lists.find(l => l.id === projectsListId);
	return undefined;
}

/** Is this list (by id or case-insensitive name) in the allow-list? */
export function isListAllowed(entries: string[] | undefined, list: ListRef): boolean {
	return (entries ?? []).some(e => {
		const x = (e ?? '').trim();
		return !!x && (x === list.id || lc(x) === lc(list.name));
	});
}

/** Ids of all known lists that are allow-listed. Empty entries -> empty set (sync nothing). */
export function resolveSyncedListIds(entries: string[] | undefined, lists: ListRef[]): Set<string> {
	return new Set(lists.filter(l => isListAllowed(entries, l)).map(l => l.id));
}

/** Allow-list entries that match no known list (typo / renamed list). */
export function unmatchedEntries(entries: string[] | undefined, lists: ListRef[]): string[] {
	return (entries ?? []).filter(e => e?.trim() && !lists.some(l => isListAllowed([e], l)));
}

/** A list renamed in TickTick keeps its allow-list entry: swap the old name for the new one (undefined = no change). */
export function healSyncedLists(entries: string[] | undefined, cached: ListRef[], current: ListRef[]): string[] | undefined {
	let changed = false;
	const out = (entries ?? []).map(e => {
		if (current.some(l => isListAllowed([e], l))) return e;
		const old = cached.find(l => isListAllowed([e], l));
		const now = old && current.find(l => l.id === old.id);
		if (now && now.name !== e) { changed = true; return now.name; }
		return e;
	});
	return changed ? out : undefined;
}

/** Back-compat: no `syncedLists` yet but a single `SyncProject` -> that list is the allow-list. */
export function migrateSyncedLists<T extends { syncedLists?: unknown; SyncProject?: unknown }>(data: T): T {
	if (Array.isArray(data.syncedLists)) return data;
	const legacy = typeof data.SyncProject === 'string' ? data.SyncProject.trim() : '';
	return { ...data, syncedLists: legacy ? [legacy] : [] };
}

const normFolder = (f: string) => {
	const t = f.trim().replace(/^\/+/, '');
	return !t || /\.md$/i.test(t) || t.endsWith('/') ? t : t + '/';
};

/** Is `path` under one of `folders` (prefix match on whole folder names; `x.md` entries match exactly)? */
export function isPathInFolders(path: string, folders: string[]): boolean {
	const p = path.replace(/^\/+/, '');
	return folders.some(f => {
		const t = f.trim();
		if (t === '/') return true; // whole vault
		const n = normFolder(f);
		return !!n && (/\.md$/i.test(n) ? p === n : p.startsWith(n));
	});
}

/** Push scope: no configured folders = unrestricted; otherwise the folders plus `implicit` ones. */
export function pushScopeAllows(path: string, folders: string[] | undefined, implicit: string[] = []): boolean {
	const cfg = (folders ?? []).filter(f => f && f.trim());
	if (!cfg.length) return true;
	return isPathInFolders(path, [...cfg, ...implicit.filter(Boolean)]);
}

/** Plugin-managed places that must keep syncing even if the user did not list them. */
export function implicitScopeFolders(): string[] {
	const s = getSettings();
	const out: string[] = [];
	const tasks = getDefaultFolder();
	if (tasks) out.push(tasks);
	if (s.projectSchemeEnabled && s.projectsFolder?.trim()) out.push(s.projectsFolder.trim());
	if (s.newTasksFile?.trim()) out.push(s.newTasksFile.trim());
	return out;
}

/** May a line in this vault file be pushed to TickTick (create / update / complete / delete)? */
export function isPathInPushScope(path: string | undefined | null): boolean {
	if (!path) return true;
	return pushScopeAllows(path, getSettings().syncScopeFolders, implicitScopeFolders());
}

/** Non-empty `syncScopeFolders` — Step 4 applies only when push scope is explicit (pilot). */
export function hasConfiguredPushScope(): boolean {
	return (getSettings().syncScopeFolders ?? []).some(f => !!f?.trim());
}

/** Abyss-first (Step 4): tasks in push scope sync without #ticktick on every line. */
export function scopePushWithoutMarker(): boolean {
	return !!getSettings().abyssTasksFormat && hasConfiguredPushScope();
}
