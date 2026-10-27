// Abyss checkbox symbol → TickTick list (settings.statusListMappings).
// Distinct from statusMappings (char → TT tag). When this table is non-empty and
// abyssTasksFormat is on, the checkbox symbol is source of truth for list
// placement; #gtd/* (tagListMappings) must not move the list.
export interface IStatusListMapping { char: string; list: string; listId?: string }

interface P { id: string; name: string }

const n = (s: string) => s.replace(/^#/, '').trim().toLowerCase();
const listId = (list: string, projects: P[]) =>
	projects.find(p => p.id === list)?.id ?? projects.find(p => n(p.name) === n(list))?.id;

/** Complete / cancel — not list moves. */
export function isTerminalStatusChar(ch: string | undefined): boolean {
	return ch === 'x' || ch === 'X' || ch === '-';
}

export function isStatusListMapActive(map: IStatusListMapping[] | undefined): boolean {
	return !!map?.length;
}

/** Push: checkbox char → TickTick project id. Undefined for terminal / unmapped. */
export function listForStatusChar(
	ch: string | undefined,
	map: IStatusListMapping[] | undefined,
	projects: P[],
): string | undefined {
	if (ch === undefined || isTerminalStatusChar(ch) || !map?.length) return undefined;
	const m = map.find(e => e.char === ch);
	if (!m) return undefined;
	return (m.listId && projects.some(p => p.id === m.listId)) ? m.listId : listId(m.list, projects);
}

/** Pull: TickTick list → checkbox char (open stages only). */
export function charForList(
	projectId: string,
	map: IStatusListMapping[] | undefined,
	projects: P[],
): string | undefined {
	if (!map?.length || !projectId) return undefined;
	const m = map.find(e => e.listId === projectId || listId(e.list, projects) === projectId);
	return m?.char;
}

/** Remember list ids; refresh names after TickTick renames. */
export function healStatusListMappings(
	map: IStatusListMapping[] | undefined,
	projects: P[],
): IStatusListMapping[] | undefined {
	if (!map?.length || !projects.length) return undefined;
	let changed = false;
	const out = map.map(m => {
		const byId = m.listId ? projects.find(p => p.id === m.listId) : undefined;
		if (byId) {
			if (byId.name !== m.list) { changed = true; return { ...m, list: byId.name }; }
			return m;
		}
		const id = listId(m.list, projects);
		if (id && id !== m.listId) { changed = true; return { ...m, listId: id }; }
		return m;
	});
	return changed ? out : undefined;
}

/**
 * Pull checkbox when status→list is SoT.
 * Completed → x; cancelled status tag → -; else list→char; else space.
 */
export function restoreStatusFromList(
	status: number,
	tags: string[] | undefined,
	projectId: string,
	map: IStatusListMapping[] | undefined,
	projects: P[],
	isCancelledTag: (tag: string) => boolean,
): { char: string; tags: string[] } {
	const rest = (tags ?? []).filter(t => !isCancelledTag(t));
	if (status > 0) return { char: 'x', tags: rest };
	if ((tags ?? []).some(isCancelledTag)) return { char: '-', tags: rest };
	const fromList = charForList(projectId, map, projects);
	return { char: fromList ?? ' ', tags: rest };
}

export function parseStatusListText(text: string): IStatusListMapping[] {
	return text.split('\n').map(l => l.match(/^\s*(.)\s*=\s*(\S+)\s*$/)).filter(Boolean)
		.map(m => ({ char: (m as RegExpMatchArray)[1], list: (m as RegExpMatchArray)[2].trim() }));
}

export const statusListToText = (m: IStatusListMapping[] | undefined) =>
	(m ?? []).map(e => `${e.char} = ${e.list}`).join('\n');
