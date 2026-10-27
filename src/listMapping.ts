// Abyss tag -> TickTick list (settings.tagListMappings), e.g. type/next = nextAction.
// Push: when several stage tags appear (Abyss tag-tree DnD adds without removing), the
// winner is the stage whose list ≠ the task's current TickTick/Dexie list — that is the
// DnD destination. Abyss may sort tags on the line, so "last on the line" is not reliable.
// Fallback: last mapped stage on the line. The stage tag is not sent as a TickTick tag
// (the list represents it). Pull: the task's list re-creates the tag and drops other
// mapped tags, so moving lists in TickTick rewrites the type tag.
export interface ITagListMapping { tag: string; list: string; listId?: string }
interface P { id: string; name: string }
const n = (s: string) => s.replace(/^#/, '').trim().toLowerCase();
const listId = (list: string, projects: P[]) =>
	projects.find(p => p.id === list)?.id ?? projects.find(p => n(p.name) === n(list))?.id;

export function isListTag(tag: string, map: ITagListMapping[] | undefined) {
	return !!map?.some(m => n(m.tag) === n(tag) || n(m.tag).replace(/\//g, '-') === n(tag));
}

/** Remember list ids so a list renamed in TickTick keeps its mapping; refresh names to the current ones. */
export function healTagListMappings(map: ITagListMapping[] | undefined, projects: P[]): ITagListMapping[] | undefined {
	if (!map?.length || !projects.length) return undefined;
	let changed = false;
	const out = map.map(m => {
		const byId = m.listId ? projects.find(p => p.id === m.listId) : undefined;
		if (byId) { if (byId.name !== m.list) { changed = true; return { ...m, list: byId.name }; } return m; }
		const id = listId(m.list, projects);
		if (id && id !== m.listId) { changed = true; return { ...m, listId: id }; }
		return m;
	});
	return changed ? out : undefined;
}

/** Stage tags on the line in appearance order. */
export function stageTagsOnLine(tags: string[] | undefined, map: ITagListMapping[] | undefined): string[] {
	if (!tags?.length || !map?.length) return [];
	const out: string[] = [];
	for (const t of tags) {
		if (isListTag(t, map)) out.push(t.replace(/^#/, ''));
	}
	return out;
}

/** Last list-mapped tag on the line (fallback when current list is unknown). */
export function pickLastStageTag(tags: string[] | undefined, map: ITagListMapping[] | undefined): string | undefined {
	const stages = stageTagsOnLine(tags, map);
	return stages.length ? stages[stages.length - 1] : undefined;
}

function projectIdForStage(stage: string, map: ITagListMapping[], projects: P[]): string | undefined {
	const m = map.find(e => n(e.tag) === n(stage));
	if (!m) return undefined;
	return (m.listId && projects.some(p => p.id === m.listId)) ? m.listId : listId(m.list, projects);
}

/**
 * AF-GTD-TAG-ADD: prefer a stage tag that routes to a list other than `currentProjectId`
 * (the DnD destination). Among those, last on the line. Else last stage on the line.
 */
export function pickWinningStageTag(
	tags: string[] | undefined,
	map: ITagListMapping[] | undefined,
	projects?: P[],
	currentProjectId?: string,
): string | undefined {
	const stages = stageTagsOnLine(tags, map);
	if (!stages.length) return undefined;
	if (stages.length === 1) return stages[0];
	if (currentProjectId && projects?.length && map?.length) {
		const movers = stages.filter(stage => {
			const id = projectIdForStage(stage, map, projects);
			return !!id && id !== currentProjectId;
		});
		if (movers.length) return movers[movers.length - 1];
	}
	return stages[stages.length - 1];
}

export function listForTags(
	tags: string[],
	map: ITagListMapping[] | undefined,
	projects: P[],
	currentProjectId?: string,
): string | undefined {
	const stage = pickWinningStageTag(tags, map, projects, currentProjectId);
	if (!stage || !map?.length) return undefined;
	return projectIdForStage(stage, map, projects);
}

/** True when more than one tagListMappings tag appears on the line (needs vault rewrite). */
export function hasMultipleStageTags(tags: string[] | undefined, map: ITagListMapping[] | undefined): boolean {
	return stageTagsOnLine(tags, map).length > 1;
}

/** Hash-unchanged lines can still need a stage list move / exclusive rewrite (AF-GTD-TAG-ADD). */
export function stageNeedsPushDespiteHash(
	tags: string[] | undefined,
	map: ITagListMapping[] | undefined,
	lineProjectId: string | undefined,
	savedProjectId: string | undefined,
): boolean {
	return hasMultipleStageTags(tags, map)
		|| !!(lineProjectId && savedProjectId && lineProjectId !== savedProjectId);
}

/**
 * Keep only the winning stage tag on the markdown line; leave other tags / order intact.
 * Avoids full convertTaskToLine reshuffles that confuse Abyss tag chips.
 */
const escStage = (tag: string) => tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\//g, "\\/");

/** Drop every tagListMappings stage tag (status->list SoT; #gtd no longer on the line). */
export function stripAllStageTags(line: string, map: ITagListMapping[] | undefined): string {
	if (!map?.length) return line;
	let out = line;
	for (const m of map) {
		const tag = m.tag.replace(/^#/, "");
		const re = new RegExp(`(\\s)#${escStage(tag)}(?![\\w/-])`, "gi");
		out = out.replace(re, "");
	}
	return out.replace(/ {2,}/g, " ");
}

export function rewriteLineExclusiveStage(
	line: string,
	map: ITagListMapping[] | undefined,
	winner: string,
): string {
	if (!map?.length) return line;
	const win = winner.replace(/^#/, '');
	const esc = (tag: string) => tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/');
	let out = line;
	let insertAt = -1;
	for (const m of map) {
		const tag = m.tag.replace(/^#/, '');
		const re = new RegExp(`(\\s)#${esc(tag)}(?![\\w/-])`, 'gi');
		out = out.replace(re, (match, _sp, offset: number) => {
			if (insertAt < 0) insertAt = offset;
			return '';
		});
	}
	if (!new RegExp(`#${esc(win)}(?![\\w/-])`, 'i').test(out)) {
		const insert = ` #${win}`;
		const idAt = out.search(/\s*%%\[ticktick_id::/);
		if (idAt >= 0) out = out.slice(0, idAt) + insert + out.slice(idAt);
		else if (insertAt >= 0) out = out.slice(0, insertAt) + insert + out.slice(insertAt);
		else out = out.trimEnd() + insert;
	}
	return out.replace(/ {2,}/g, ' ');
}

export function tagForList(projectId: string, map: ITagListMapping[] | undefined, projects: P[]): string | undefined {
	return map?.find(e => e.listId === projectId || listId(e.list, projects) === projectId)?.tag.replace(/^#/, '');
}

const flat = (s: string) => n(s).replace(/\//g, '-');

/** Tag mode: Obsidian stage tag → TickTick tag (right-hand side, `/` flattened). */
export function tickTickTagForStage(obsTag: string, map: ITagListMapping[] | undefined): string | undefined {
	const m = map?.find(e => n(e.tag) === n(obsTag));
	return m ? flat(m.list) : undefined;
}

/** Tag mode: TickTick stage tag → Obsidian tag (left-hand side). */
export function obsidianTagForStageTag(ttTag: string, map: ITagListMapping[] | undefined): string | undefined {
	const want = flat(ttTag);
	return map?.find(e => flat(e.list) === want)?.tag.replace(/^#/, '');
}

/**
 * Tags to keep on a task after it sits on `projectId`.
 * In list mode, a stage tag for a different list is dropped. `#inbox` is dropped
 * once the task is no longer on the default inbox list.
 */
export function tagsForCurrentList(
	tags: string[] | undefined,
	projectId: string,
	map: ITagListMapping[] | undefined,
	opts: { defaultProjectId?: string; via?: 'list' | 'tag' },
): string[] {
	const keep = map?.find(m => m.listId === projectId)?.tag;
	return (tags ?? []).filter(t => {
		if (t.toLowerCase() === 'inbox' && opts.defaultProjectId && projectId !== opts.defaultProjectId) return false;
		if ((opts.via ?? 'list') === 'list' && map?.length && isStageToken(t, map)) {
			// A list with no stage row (a project list) keeps the tag.
			if (!keep) return true;
			return n(t) === n(keep) || flat(t) === flat(keep);
		}
		return true;
	});
}

/** Either side of a GTD stage row (Obsidian tag or TickTick tag/list name). */
export function isStageToken(tag: string | undefined, map: ITagListMapping[] | undefined): boolean {
	if (!tag) return false;
	return isListTag(tag, map) || !!obsidianTagForStageTag(tag, map);
}

export function parseTagListText(text: string): ITagListMapping[] {
	return text.split('\n').map(l => l.split('=')).filter(p => p.length === 2 && p[0].trim() && p[1].trim())
		.map(([a, b]) => ({ tag: a.trim().replace(/^#/, ''), list: b.trim() }));
// (ids are re-learned by healTagListMappings on the next sync)
}
export const tagListToText = (m: ITagListMapping[] | undefined) => (m ?? []).map(e => `${e.tag} = ${e.list}`).join('\n');
