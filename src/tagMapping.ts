// Explicit Obsidian tag <-> TickTick tag mapping table (settings.tagMappings).
export interface ITagMapping { obsidian: string; ticktick: string }

const norm = (t: string) => t.replace(/^#/, '').trim().toLowerCase();

/** Obsidian tag (without #) -> TickTick tag name, or undefined if unmapped. */
export function mapObsidianTag(tag: string, map: ITagMapping[] | undefined): string | undefined {
	const m = map?.find(e => e.obsidian && norm(e.obsidian) === norm(tag));
	return m ? m.ticktick.replace(/^#/, '').trim() : undefined;
}

/** TickTick tag name -> Obsidian tag (without #), or undefined if unmapped. */
export function mapTickTickTag(tag: string, map: ITagMapping[] | undefined): string | undefined {
	const m = map?.find(e => e.ticktick && norm(e.ticktick) === norm(tag));
	return m ? m.obsidian.replace(/^#/, '').trim() : undefined;
}

/** Parse settings textarea: one `obsidian/tag = ticktick-tag` per line. */
export function parseTagMappingText(text: string): ITagMapping[] {
	return text.split('\n').map(l => l.split('=')).filter(p => p.length === 2 && p[0].trim() && p[1].trim())
		.map(([o, t]) => ({ obsidian: o.trim().replace(/^#/, ''), ticktick: t.trim().replace(/^#/, '') }));
}
export function tagMappingToText(map: ITagMapping[] | undefined): string {
	return (map ?? []).map(m => `${m.obsidian} = ${m.ticktick}`).join('\n');
}
