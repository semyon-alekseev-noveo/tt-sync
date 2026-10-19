// Pilot project scheme (pure helpers).
import { type TaskSyncLimitOptions, taskMatchesSyncLimit } from '@/syncScope';
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

/** CASE-P6: a task line must not reuse the project parent's TickTick id (parent lives in frontmatter). */
export function isProjectParentDuplicateLine(
	path: string,
	fm: Record<string, unknown> | undefined,
	folder: string,
	lineTaskId: string,
): boolean {
	if (!lineTaskId?.trim() || !fm?.ticktick_id) return false;
	if (!isProjectNote(path, fm, folder)) return false;
	return String(fm.ticktick_id).trim() === lineTaskId.trim();
}

/** Remove checkbox lines that duplicate the project parent id (in-place filter). */
export function stripProjectParentDuplicateLines(
	lines: string[],
	parentTaskId: string,
	isTaskLine: (line: string) => boolean,
	lineTaskId: (line: string) => string | null,
): string[] {
	if (!parentTaskId) return lines;
	return lines.filter(line => {
		if (!isTaskLine(line)) return true;
		const id = lineTaskId(line);
		return id !== parentTaskId;
	});
}

/**
 * Hoist all synced child task lines into `## Active Zone` (flat), drop parent-id duplicate lines.
 * Fixes P6 + tasks parked under Metadata / wrong list nesting after legacy sync or reset.
 */
export function repairProjectNoteTasks(
	lines: string[],
	parentTaskId: string,
	isTaskLine: (line: string) => boolean,
	lineTaskId: (line: string) => string | null,
): string[] {
	if (!parentTaskId) return lines;
	const seen = new Set<string>();
	const childLines: string[] = [];
	const body: string[] = [];
	for (const line of lines) {
		if (!isTaskLine(line)) {
			body.push(line);
			continue;
		}
		const id = lineTaskId(line);
		if (!id) {
			body.push(line);
			continue;
		}
		if (id === parentTaskId) continue;
		if (seen.has(id)) continue;
		seen.add(id);
		childLines.push(line.replace(/^\t+/, ''));
	}
	if (!childLines.length) {
		return stripProjectParentDuplicateLines(lines, parentTaskId, isTaskLine, lineTaskId);
	}
	let out = body;
	if (activeZoneInsertLine(out) < 0) {
		while (out.length && out[out.length - 1].trim() === '') out.pop();
		out = [...out, '', `## ${ACTIVE_ZONE}`, ''];
	}
	const ins = activeZoneInsertLine(out);
	out = [...out];
	out.splice(ins, 0, ...childLines);
	return out;
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

/** Root task of the Projects list: it is a project, whether or not it carries the `project` tag. */
export function isListRoot(t: { projectId?: string; parentId?: string | null }, listId: string): boolean {
	if (!listId || t.projectId !== listId) return false;
	return !t.parentId;
}

/** Root parent in the scheme Projects list that passes syncedLists + SyncTag/SyncProject limits. */
export function isSchemeParentTask(
	t: { projectId?: string; parentId?: string | null; tags?: string[] | null },
	listId: string,
	limit: TaskSyncLimitOptions,
): boolean {
	return isListRoot(t, listId) && taskMatchesSyncLimit(t, limit);
}

const PLACEHOLDER_ACTIVE_ZONE = /^- \[[ xX]\] \d+\s*$/;

/** Drop template filler checkboxes (`- [ ] 1` …) under ## Active Zone. */
export function stripActiveZonePlaceholders(lines: string[], heading = ACTIVE_ZONE): string[] {
	const h = lines.findIndex(l => /^#{1,6}\s/.test(l) && l.replace(/^#+\s*/, '').trim().toLowerCase() === heading.toLowerCase());
	if (h < 0) return lines;
	let end = lines.length;
	for (let i = h + 1; i < lines.length; i++) if (/^#{1,6}\s/.test(lines[i])) { end = i; break; }
	return [
		...lines.slice(0, h + 1),
		...lines.slice(h + 1, end).filter(l => !PLACEHOLDER_ACTIVE_ZONE.test(l.trim())),
		...lines.slice(end),
	];
}

/** A task line whose title is empty after stripping tags/markers must not be sent to TickTick. */
export const isBlankTitle = (title: string | undefined | null) => !stripFileLinks(title ?? '').replace(/#[^\s#]+/g, '').trim();

/** A line the user is still typing: bare `%` / `%%`, or an unclosed `%%` comment. */
export function isUnfinishedCapture(title: string | undefined | null, rawLine?: string): boolean {
	if (isBlankTitle(title)) return true;
	const t = stripFileLinks(title ?? '').replace(/#[^\s#]+/g, '').trim();
	if (/^%+$/.test(t)) return true;
	const markers = rawLine ? (rawLine.match(/%%/g)?.length ?? 0) : 0;
	return markers % 2 === 1;
}

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
		'  - ticktick',
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

/** Minimal Templater date format (YYYY MM DD HH mm ss) for `tp.date.now("...")`. */
function fmtDate(fmt: string, d: Date): string {
	return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, t => ({
		YYYY: String(d.getFullYear()), MM: pad(d.getMonth() + 1), DD: pad(d.getDate()),
		HH: pad(d.getHours()), mm: pad(d.getMinutes()), ss: pad(d.getSeconds()),
	}[t] as string));
}

/**
 * Render a user project-note template without Templater: `<%* ... %>` code blocks (prompts, ifs)
 * are dropped, `<% expr %>` is filled for title / id / dates / status and left empty otherwise,
 * `{{title}}` / `{{ticktick_id}}` are substituted. The result is then forced to be a valid project
 * note (tags system/project + ticktick, ticktick_id, status, `## Active Zone`).
 */
export function renderProjectTemplate(tpl: string, o: { title: string; ticktickId: string; note?: string; done?: boolean; now: Date }): string {
	const status = o.done ? STATUS_DONE : STATUS_ACTIVE;
	let t = tpl.replace(/\r\n/g, '\n');
	// conditional blocks: condition unknown without Templater -> skip the whole block
	t = t.replace(/<%\*\s*if\b[^%]*?\{\s*-?%>[\s\S]*?<%\*\s*\}\s*-?%>/g, '');
	// remaining code blocks (prompts, assignments); `-%>` also eats the following newline
	t = t.replace(/<%\*[\s\S]*?(-%>\n?|%>)/g, '');
	t = t.replace(/<%[-_]?\s*([\s\S]*?)\s*[-_]?%>/g, (_m, expr: string) => {
		const e = expr.trim();
		const d = e.match(/tp\.(?:date\.now|file\.creation_date)\(\s*["']([^"']*)["']/);
		if (d) return fmtDate(d[1], o.now);
		if (/tp\.date\.now\(\s*\)|tp\.file\.creation_date\(\s*\)/.test(e)) return fmtDate('YYYY-MM-DD', o.now);
		if (/^tp\.file\.title$|^newTitle$|^title$/.test(e)) return o.title;
		if (e === 'id') return noteId(o.now);
		if (e === 'status') return status;
		return '';
	});
	t = t.replace(/\{\{\s*title\s*\}\}/g, o.title).replace(/\{\{\s*ticktick_id\s*\}\}/g, o.ticktickId);
	return ensureProjectNote(t, o);
}

/** Make sure `text` is a project note: frontmatter keys/tags, `## Active Zone`, TickTick note in Overview. */
export function ensureProjectNote(text: string, o: { title: string; ticktickId: string; note?: string; done?: boolean; now: Date }): string {
	let lines = text.replace(/^\s+/, '').split('\n');
	let end = -1;
	if (lines[0]?.trim() === '---') end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
	if (end < 0) { lines = ['---', '---', ...lines]; end = 1; }
	// stripped template blocks leave blank lines / empty `[[]]` links behind
	const fm = lines.slice(1, end).filter(l => l.trim()).map(l => l.replace(/:\s*\[\[\]\]\s*$/, ': []'));
	const keyAt = (k: string) => fm.findIndex(l => new RegExp(`^${k}\\s*:`).test(l));
	// ticktick_id
	const idAt = keyAt('ticktick_id');
	if (idAt >= 0) fm[idAt] = `ticktick_id: ${o.ticktickId}`; else fm.push(`ticktick_id: ${o.ticktickId}`);
	// status
	const stAt = keyAt('status');
	const stVal = stAt >= 0 ? fm[stAt].replace(/^status\s*:/, '').trim() : '';
	if (stAt < 0) fm.push(`status: ${o.done ? STATUS_DONE : STATUS_ACTIVE}`);
	else if (!stVal || (o.done && !isDoneStatus(stVal))) fm[stAt] = `status: ${o.done ? STATUS_DONE : STATUS_ACTIVE}`;
	// tags
	const need = [PROJECT_NOTE_TAG, 'ticktick'];
	const tgAt = keyAt('tags');
	if (tgAt < 0) {
		fm.push('tags:', ...need.map(x => `  - ${x}`));
	} else {
		const inline = fm[tgAt].replace(/^tags\s*:/, '').trim();
		if (inline) {
			const cur = inline.replace(/^\[|\]$/g, '').split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean);
			fm.splice(tgAt, 1, 'tags:', ...[...cur, ...need.filter(x => !cur.includes(x))].map(x => `  - ${x}`));
		} else {
			let last = tgAt;
			const cur: string[] = [];
			for (let i = tgAt + 1; i < fm.length && (/^\s*-\s/.test(fm[i]) || fm[i].trim() === ''); i++) {
				if (/^\s*-\s/.test(fm[i])) { last = i; cur.push(fm[i].replace(/^\s*-\s*/, '').trim().replace(/^#/, '')); }
			}
			fm.splice(last + 1, 0, ...need.filter(x => !cur.includes(x)).map(x => `  - ${x}`));
		}
	}
	let body = lines.slice(end + 1);
	if (!body.some(l => l.trim())) body = [`# ${o.title}`, ''];
	const note = (o.note ?? '').trim();
	if (note) {
		const ov = body.findIndex(l => /^#{1,6}\s+overview\s*$/i.test(l.trim()));
		if (ov >= 0) body.splice(ov + 1, 0, note);
	}
	if (activeZoneInsertLine(body) < 0) {
		while (body.length && body[body.length - 1].trim() === '') body.pop();
		body.push('', `## ${ACTIVE_ZONE}`, '');
	}
	body = stripActiveZonePlaceholders(body);
	return ['---', ...fm, '---', ...body].join('\n');
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
