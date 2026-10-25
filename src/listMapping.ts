// Abyss tag -> TickTick list (settings.tagListMappings), e.g. type/next = nextAction.
// Push: **last** mapped stage tag on the line decides the list (AF-GTD-TAG-ADD / Option A —
// Abyss tag-tree DnD appends the new stage; rightmost/last wins). The stage tag is not
// sent as a TickTick tag (the list represents it). Pull: the task's list re-creates the
// tag and drops other mapped tags, so moving lists in TickTick rewrites the type tag.
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

/** Last list-mapped tag on the line (Abyss DnD append order). */
export function pickLastStageTag(tags: string[] | undefined, map: ITagListMapping[] | undefined): string | undefined {
	if (!tags?.length || !map?.length) return undefined;
	let last: string | undefined;
	for (const t of tags) {
		if (isListTag(t, map)) last = t.replace(/^#/, '');
	}
	return last;
}

export function listForTags(tags: string[], map: ITagListMapping[] | undefined, projects: P[]): string | undefined {
	const stage = pickLastStageTag(tags, map);
	if (!stage) return undefined;
	const m = map?.find(e => n(e.tag) === n(stage));
	if (!m) return undefined;
	const id = (m.listId && projects.some(p => p.id === m.listId)) ? m.listId : listId(m.list, projects);
	return id;
}

/** True when more than one tagListMappings tag appears on the line (needs vault rewrite). */
export function hasMultipleStageTags(tags: string[] | undefined, map: ITagListMapping[] | undefined): boolean {
	if (!tags?.length || !map?.length) return false;
	let nStage = 0;
	for (const t of tags) {
		if (isListTag(t, map) && ++nStage > 1) return true;
	}
	return false;
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
