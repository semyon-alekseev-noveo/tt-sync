import { isListTag, type ITagListMapping } from '@/listMapping';
import { tagForStatusChar, isStatusTag, type IStatusMapping } from '@/statusMapping';

export const warnedConflicts = new Set<string>();

/** foo/Bar baz -> foo-bar-baz (TickTick tag names cannot contain `/`). */
export const flatTagName = (raw: string) => raw.toLowerCase().replace(/[/s]+/g, '-').replace(/-+/g, '-');

/** Tags that lose a conflict: status tags disagreeing with the checkbox, and every list-mapped tag except the last (AF-GTD-TAG-ADD). */
export function abyssTagConflicts(tags: string[], ch: string | undefined, smap: IStatusMapping[] | undefined, lmap: ITagListMapping[] | undefined): string[] {
	const want = tagForStatusChar(ch, smap)?.toLowerCase();
	const lost = tags.filter(t => isStatusTag(t, smap) && t.replace(/^#/, '').toLowerCase() !== want);
	const typeTags = tags.filter(t => isListTag(t, lmap));
	return [...lost, ...typeTags.slice(0, -1)];
}
