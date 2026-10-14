// Abyss tag -> TickTick list (settings.tagListMappings), e.g. type/next = nextAction.
// Push: first mapped tag on the line decides the list (beats file default); the tag is
// not sent as a TickTick tag (the list represents it). Pull: the task's list re-creates
// the tag and drops other mapped tags, so moving lists in TickTick rewrites the type tag.
export interface ITagListMapping { tag: string; list: string }
interface P { id: string; name: string }
const n = (s: string) => s.replace(/^#/, '').trim().toLowerCase();
const listId = (list: string, projects: P[]) =>
	projects.find(p => p.id === list)?.id ?? projects.find(p => n(p.name) === n(list))?.id;

export function isListTag(tag: string, map: ITagListMapping[] | undefined) {
	return !!map?.some(m => n(m.tag) === n(tag) || n(m.tag).replace(/\//g, '-') === n(tag));
}

export function listForTags(tags: string[], map: ITagListMapping[] | undefined, projects: P[]): string | undefined {
	for (const t of tags) {
		const m = map?.find(e => n(e.tag) === n(t));
		if (m) { const id = listId(m.list, projects); if (id) return id; }
	}
	return undefined;
}

export function tagForList(projectId: string, map: ITagListMapping[] | undefined, projects: P[]): string | undefined {
	return map?.find(e => listId(e.list, projects) === projectId)?.tag.replace(/^#/, '');
}

export function parseTagListText(text: string): ITagListMapping[] {
	return text.split('\n').map(l => l.split('=')).filter(p => p.length === 2 && p[0].trim() && p[1].trim())
		.map(([a, b]) => ({ tag: a.trim().replace(/^#/, ''), list: b.trim() }));
}
export const tagListToText = (m: ITagListMapping[] | undefined) => (m ?? []).map(e => `${e.tag} = ${e.list}`).join('\n');
