// Pilot project scheme (pure helpers).
// Obsidian project = note with frontmatter tag `system/project` (default folder `10 Projects/`),
// frontmatter `ticktick_id` = id of its TickTick parent task (list `Projects`, tags project+obsidian).
// Project tasks = inline tasks in the project note + in notes whose frontmatter `project:` links to it.
export const PROJECT_NOTE_TAG = 'system/project';
export const ACTIVE_ZONE = 'Active Zone';
export const STATUS_ACTIVE = '🟢 In Progress';
export const STATUS_DONE = '✅ Done';

export function fmTags(fm: Record<string, unknown> | undefined): string[] {
	const t = fm?.tags;
	const arr = Array.isArray(t) ? t : typeof t === 'string' ? t.split(/[,\s]+/) : [];
	return arr.map(x => String(x).replace(/^#/, '').trim().toLowerCase()).filter(Boolean);
}

export function isProjectNote(path: string, fm: Record<string, unknown> | undefined, folder: string): boolean {
	const f = folder.replace(/^\/+/, '');
	if (f && !path.startsWith(f.endsWith('/') ? f : f + '/')) return false;
	return fmTags(fm).includes(PROJECT_NOTE_TAG);
}

/** `"[[10 Projects/Foo|Foo]]"` / `[[Foo]]` / `Foo` -> `10 Projects/Foo` / `Foo`. */
export function linkTarget(v: unknown): string | undefined {
	const s = Array.isArray(v) ? v[0] : v;
	if (typeof s !== 'string' || !s.trim()) return undefined;
	const m = s.match(/\[\[([^\]|#]+)/);
	return (m ? m[1] : s).trim();
}

/** Pick the project note a `project:` link means when Obsidian resolves it to a non-project note
 * (e.g. a same-named note elsewhere). Matches by basename / path suffix among project notes. */
export function pickProjectNote(target: string, projectPaths: string[]): string | undefined {
	const t = target.replace(/\.md$/i, '').toLowerCase();
	const hits = projectPaths.filter(p => {
		const x = p.replace(/\.md$/i, '').toLowerCase();
		return x === t || x.endsWith('/' + t);
	});
	return hits.length === 1 ? hits[0] : undefined;
}

/** A task line whose title is empty after stripping tags/markers must not be sent to TickTick. */
export const isBlankTitle = (title: string | undefined | null) => !stripFileLinks(title ?? '').replace(/#[^\s#]+/g, '').trim();

export function isDoneStatus(s: unknown): boolean {
	return typeof s === 'string' && /done|✅|заверш|выполн/i.test(s);
}

/** Remove Obsidian file links ([file](obsidian://open?...)) the plugin appends to TickTick titles. */
export function stripFileLinks(t: string): string {
	return t.replace(/\s*\[[^\]]*\]\(obsidian:\/\/[^)]*\)/g, '').trim();
}

export function sanitizeTitle(t: string): string {
	return t.replace(/\[[^\]]*\]\(obsidian:\/\/[^)]*\)/g, '').replace(/[\\/:*?"<>|#^[\]]/g, '-').replace(/\s+/g, ' ').trim();
}

const pad = (n: number) => String(n).padStart(2, '0');
export function noteId(d: Date) {
	return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** Built-in project MOC template (no Templater). */
export function renderProjectNote(o: { title: string; ticktickId: string; note?: string; done?: boolean; now: Date }): string {
	const d = o.now;
	const created = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
	return [
		'---',
		`id: "${noteId(d)}"`,
		`created: ${created}`,
		`status: ${o.done ? STATUS_DONE : STATUS_ACTIVE}`,
		'kind: system',
		'type: Note',
		'areas: []',
		'topic: ',
		'meta: ',
		'tags:',
		'  - system/moc',
		'  - system/project',
		`ticktick_id: ${o.ticktickId}`,
		'---',
		`# ${o.title}`,
		'',
		'## Overview',
		(o.note ?? '').trim(),
		'',
		'## Основные разделы',
		'',
		`## ${ACTIVE_ZONE}`,
		'',
		'## Источники и связанные заметки',
		'',
		'> [!info] Metadata',
		'> Source:: TickTick',
		'',
	].join('\n');
}

/** Line index at which to insert a new task inside `## Active Zone` (end of section). -1 if no section. */
export function activeZoneInsertLine(lines: string[], heading = ACTIVE_ZONE): number {
	const h = lines.findIndex(l => /^#{1,6}\s/.test(l) && l.replace(/^#+\s*/, '').trim().toLowerCase() === heading.toLowerCase());
	if (h < 0) return -1;
	let end = lines.length;
	for (let i = h + 1; i < lines.length; i++) if (/^#{1,6}\s/.test(lines[i])) { end = i; break; }
	let ins = end;
	while (ins - 1 > h && lines[ins - 1].trim() === '') ins--;
	return ins;
}

export interface NoteSide { path: string; title: string; id?: string; done: boolean }
export interface ParentSide { id: string; title: string; done: boolean; content?: string }
export interface Snap { noteDone: boolean; ttDone: boolean; title?: string }

/** Title sync for a linked project: who renamed since the last snapshot? Obsidian wins a tie. */
export function planTitle(noteTitle: string, ttTitle: string, last: string | undefined): { to: 'tt' | 'note'; title: string } | undefined {
	if (noteTitle === ttTitle) return undefined;
	if (last !== undefined && noteTitle === last) return { to: 'note', title: ttTitle }; // renamed in TickTick
	return { to: 'tt', title: noteTitle }; // renamed in Obsidian (or unknown history)
}
export type Action =
	| { type: 'createParent'; note: NoteSide }
	| { type: 'createNote'; parent: ParentSide }
	| { type: 'setParentDone'; id: string; done: boolean }
	| { type: 'setNoteDone'; path: string; done: boolean };

/** Decide project-level sync actions. Status: side that changed since snapshot wins; note wins ties. */
export function planProjects(notes: NoteSide[], parents: ParentSide[], snap: Record<string, Snap>): Action[] {
	const acts: Action[] = [];
	const byId = new Map(parents.map(p => [p.id, p]));
	const known = new Set(notes.filter(n => n.id).map(n => n.id as string));
	for (const n of notes) {
		if (!n.id) { acts.push({ type: 'createParent', note: n }); continue; }
		const p = byId.get(n.id);
		if (!p || n.done === p.done) continue;
		const s = snap[n.id];
		const noteChanged = !s || s.noteDone !== n.done;
		const ttChanged = !!s && s.ttDone !== p.done;
		if (noteChanged || !ttChanged) acts.push({ type: 'setParentDone', id: n.id, done: n.done });
		else acts.push({ type: 'setNoteDone', path: n.path, done: p.done });
	}
	for (const p of parents) if (!known.has(p.id) && !p.done) acts.push({ type: 'createNote', parent: p });
	return acts;
}
