// Injected TickTick tags for Abyss-style grouping (source note + project MOC).
// Stripped on pull so they are not duplicated as Obsidian #tags on the line.

export const NOTE_CTX_PREFIX = 'note/';
export const PROJ_CTX_PREFIX = 'proj/';

/** Slug safe for TickTick tags (lowercase, hyphens, letters/numbers). */
export function slugForContextTag(name: string): string {
	return name
		.replace(/\.md$/i, '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^\p{L}\p{N}_-]/gu, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 80);
}

export function noteContextTagFromPath(filePath: string): string | undefined {
	if (!filePath?.trim()) return undefined;
	const base = filePath.split('/').pop() ?? '';
	const slug = slugForContextTag(base);
	return slug ? `${NOTE_CTX_PREFIX}${slug}` : undefined;
}

export function projectContextTagFromPath(projectNotePath: string): string | undefined {
	if (!projectNotePath?.trim()) return undefined;
	const base = projectNotePath.split('/').pop() ?? '';
	const slug = slugForContextTag(base);
	return slug ? `${PROJ_CTX_PREFIX}${slug}` : undefined;
}

export function isInjectedContextTag(tag: string): boolean {
	const t = tag.toLowerCase().replace(/^#/, '');
	return t.startsWith(NOTE_CTX_PREFIX) || t.startsWith(PROJ_CTX_PREFIX);
}

/** Vault line tags that mirror injected TT context tags (`#note/foo` or flattened `#note-foo`). */
export function isVaultContextTagMirror(raw: string): boolean {
	const t = raw.toLowerCase().replace(/^#/, '');
	if (isInjectedContextTag(t)) return true;
	const flat = t.replace(/\//g, '-');
	return flat.startsWith('note-') || flat.startsWith('proj-');
}

export function dedupeTags(tags: string[]): string[] {
	const out: string[] = [];
	for (const tag of tags) {
		const low = tag.toLowerCase();
		if (!out.some(x => x.toLowerCase() === low)) out.push(tag);
	}
	return out;
}

export function appendContextTags(
	tags: string[],
	opts: { filePath: string; projectNotePath?: string },
): string[] {
	const out = dedupeTags(stripInjectedContextTags(tags));
	const add = (tag: string | undefined) => {
		if (!tag) return;
		const low = tag.toLowerCase();
		if (!out.some(t => t.toLowerCase() === low)) out.push(tag);
	};
	const note = noteContextTagFromPath(opts.filePath);
	add(note);
	if (opts.projectNotePath) {
		const proj = projectContextTagFromPath(opts.projectNotePath);
		const noteSlug = note?.slice(NOTE_CTX_PREFIX.length);
		const projSlug = proj?.slice(PROJ_CTX_PREFIX.length);
		if (proj && projSlug !== noteSlug) add(proj);
	}
	return out;
}

export function stripInjectedContextTags(tags: string[] | undefined): string[] {
	return (tags ?? []).filter(t => !isVaultContextTagMirror(t));
}
