import { isListTag, pickWinningStageTag, type ITagListMapping } from '@/listMapping';
import { tagForStatusChar, isStatusTag, type IStatusMapping } from '@/statusMapping';

export const warnedConflicts = new Set<string>();

/** foo/Bar baz -> foo-bar-baz (TickTick tag names cannot contain `/`). */
export const flatTagName = (raw: string) => raw.toLowerCase().replace(/[/s]+/g, '-').replace(/-+/g, '-');

type Proj = { id: string; name: string };

/**
 * Tags that lose a conflict: status tags disagreeing with the checkbox, and every
 * list-mapped stage except the DnD winner (AF-GTD-TAG-ADD). Callers should Notice
 * only status losses — stage exclusivity is expected after tag-tree DnD.
 */
export function abyssTagConflicts(
	tags: string[],
	ch: string | undefined,
	smap: IStatusMapping[] | undefined,
	lmap: ITagListMapping[] | undefined,
	projects?: Proj[],
	currentProjectId?: string,
): string[] {
	const want = tagForStatusChar(ch, smap)?.toLowerCase();
	const lost = tags.filter(t => isStatusTag(t, smap) && t.replace(/^#/, '').toLowerCase() !== want);
	const winner = pickWinningStageTag(tags, lmap, projects, currentProjectId)?.toLowerCase();
	const typeLost = tags.filter(t => isListTag(t, lmap) && t.replace(/^#/, '').toLowerCase() !== winner);
	return [...lost, ...typeLost];
}
