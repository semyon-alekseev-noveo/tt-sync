// When the user changes tag/list/status mappings or the projects folder, migrate existing notes.
import { fencedLines } from '@/utils/vaultIdScan';

interface S {
	tagListMappings?: { tag: string; list: string; listId?: string }[];
	statusMappings?: { char: string; tag: string }[];
	tagMappings?: { obsidian: string; ticktick: string }[];
	projectsFolder?: string;
}
const n = (t: string) => t.replace(/^#/, '').trim();

/** AF-GTD-PREFIX: `type/next` → `gtd/next` (stage namespace clarity). Leaves under `type/` only. */
export function typeStageToGtd(tag: string): string | null {
	const t = n(tag);
	const m = /^type\/(.+)$/i.exec(t);
	return m ? `gtd/${m[1]}` : null;
}

/**
 * Rewrite `tagListMappings` / `tagMappings` LHS from `type/…` → `gtd/…`.
 * Caller persists settings and runs vault rename via `tagRenames` / `renameTagsInText`.
 */
export function migrateTypeStagePrefixToGtd(s: S): {
	changed: boolean;
	tagListMappings?: S['tagListMappings'];
	tagMappings?: S['tagMappings'];
	renames: Record<string, string>;
} {
	const renames: Record<string, string> = {};
	let changed = false;
	let tagListMappings = s.tagListMappings;
	if (tagListMappings?.length) {
		const next = tagListMappings.map(row => {
			const neu = typeStageToGtd(row.tag);
			if (!neu) return row;
			renames[n(row.tag)] = neu;
			changed = true;
			return { ...row, tag: neu };
		});
		if (changed) tagListMappings = next;
	}
	let tagMappings = s.tagMappings;
	if (tagMappings?.length) {
		let tmChanged = false;
		const next = tagMappings.map(row => {
			const neu = typeStageToGtd(row.obsidian);
			if (!neu) return row;
			renames[n(row.obsidian)] = neu;
			tmChanged = true;
			changed = true;
			return { ...row, obsidian: neu };
		});
		if (tmChanged) tagMappings = next;
	}
	return {
		changed,
		tagListMappings: changed ? tagListMappings : undefined,
		tagMappings: changed ? tagMappings : undefined,
		renames,
	};
}

/** old tag -> new tag for mapping rows whose target (list / status char / TT tag) stayed the same. */
export function tagRenames(prev: S, next: S): Record<string, string> {
	const out: Record<string, string> = {};
	const add = (a?: string, b?: string) => { if (a && b && n(a).toLowerCase() !== n(b).toLowerCase()) out[n(a)] = n(b); };
	for (const p of prev.tagListMappings ?? []) {
		const q = (next.tagListMappings ?? []).find(m => (p.listId && m.listId === p.listId) || m.list.toLowerCase() === p.list.toLowerCase());
		add(p.tag, q?.tag);
	}
	for (const p of prev.statusMappings ?? []) add(p.tag, (next.statusMappings ?? []).find(m => m.char === p.char)?.tag);
	for (const p of prev.tagMappings ?? []) add(p.obsidian, (next.tagMappings ?? []).find(m => m.ticktick.toLowerCase() === p.ticktick.toLowerCase())?.obsidian);
	// a tag that is still in use by another row in `next` must not be renamed away
	const live = new Set([...(next.tagListMappings ?? []).map(m => n(m.tag)), ...(next.statusMappings ?? []).map(m => n(m.tag)), ...(next.tagMappings ?? []).map(m => n(m.obsidian))].map(t => t.toLowerCase()));
	for (const k of Object.keys(out)) if (live.has(k.toLowerCase())) delete out[k];
	return out;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
/** Rewrite #old -> #new on synced task lines (ticktick_id present), never inside code blocks. */
export function renameTagsInText(text: string, renames: Record<string, string>): string {
	const keys = Object.keys(renames); if (!keys.length) return text;
	const lines = text.split('\n'); const fenced = fencedLines(lines);
	const re = new RegExp(`(^|\\s)#(${keys.map(esc).join('|')})(?=$|[\\s,.;:!?)\\]])`, 'giu');
	const lower = Object.fromEntries(keys.map(k => [k.toLowerCase(), renames[k]]));
	return lines.map((l, i) => fenced.has(i) || !l.includes('ticktick_id::') ? l : l.replace(re, (_m, pre, tag) => `${pre}#${lower[tag.toLowerCase()]}`)).join('\n');
}

export const folderOf = (s: S) => (s.projectsFolder ?? '10 Projects').replace(/^\/+|\/+$/g, '');
