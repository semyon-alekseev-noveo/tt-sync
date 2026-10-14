// Abyss custom checkbox statuses <-> TickTick tags (settings.statusMappings).
export interface IStatusMapping { char: string; tag: string }
export const DEFAULT_STATUS_MAPPINGS: IStatusMapping[] = [
	{ char: '/', tag: 'status/in-progress' },
	{ char: '-', tag: 'status/cancelled' },
];

const n = (s: string) => s.replace(/^#/, '').trim().toLowerCase();
/** All spellings TickTick may return for a nested tag: full, hyphenated, child name. */
function variants(tag: string): string[] {
	const t = n(tag);
	return [t, t.replace(/\//g, '-'), t.split('/').pop() as string];
}

export function checkboxChar(line: string): string | undefined {
	return line.match(/^[\s>]*[-*+] \[(.)\]/)?.[1];
}

export function tagForStatusChar(ch: string | undefined, map: IStatusMapping[] | undefined): string | undefined {
	return ch === undefined ? undefined : map?.find(m => m.char === ch)?.tag.replace(/^#/, '');
}

export function isStatusTag(tag: string, map: IStatusMapping[] | undefined): IStatusMapping | undefined {
	return map?.find(m => variants(m.tag).includes(n(tag)));
}

/** Pull: choose checkbox char from TickTick status + tags, return tags with status tags removed. */
export function restoreStatus(status: number, tags: string[] | undefined, map: IStatusMapping[] | undefined) {
	let ch = status > 0 ? 'x' : ' ';
	const rest: string[] = [];
	for (const t of tags ?? []) {
		const m = isStatusTag(t, map);
		if (m) { if (status === 0) ch = m.char; } else rest.push(t);
	}
	return { char: ch, tags: rest };
}

export function parseStatusMappingText(text: string): IStatusMapping[] {
	return text.split('\n').map(l => l.match(/^\s*(.)\s*=\s*(\S+)\s*$/)).filter(Boolean)
		.map(m => ({ char: (m as RegExpMatchArray)[1], tag: (m as RegExpMatchArray)[2].replace(/^#/, '') }));
}
export const statusMappingToText = (m: IStatusMapping[] | undefined) => (m ?? []).map(e => `${e.char} = ${e.tag}`).join('\n');
