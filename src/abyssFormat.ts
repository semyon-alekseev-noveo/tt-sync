// Abyss Tasks format helpers (pure, no Obsidian deps).
// Abyss (src/parser/SubItemParser.ts) accepts any indent deeper than the task
// (tab = 4 cols) and writes child lines with the vault's indent unit
// (`useTab` → '\t', else 4 spaces; nativeTaskIndentation.ts).
//   `- > text`          description → TickTick note body
//   `- stamp: text`     comment (continuation lines: prefix + 2 spaces) → after COMMENTS_HEADER
export const COMMENTS_HEADER = 'Comments:';

export function indentWidth(line: string): number {
	return ((line.match(/^[\t ]*/) ?? [''])[0]).replace(/\t/g, '    ').length;
}

const isCheckbox = (s: string) => /^[-*+] \[.\]/.test(s.trimStart());
const isBullet = (s: string) => /^- /.test(s.trimStart()) || s.trim() === '- >';

/** Child line of the task that belongs to the Abyss note block (description/comment/continuation). */
export function isAbyssNoteLine(line: string, taskLine: string): boolean {
	if (line.trim() === '' || isCheckbox(line)) return false;
	return indentWidth(line) > indentWidth(taskLine);
}

/** Abyss child lines (contiguous, only direct-level bullets + their continuations) -> TickTick note text. */
export function abyssLinesToNote(lines: string[]): string {
	const kinds = classifyChildren(lines);
	const desc: string[] = [];
	const comments: string[] = [];
	let last: ChildKind = 'keep';
	lines.forEach((raw, i) => {
		const k = kinds[i];
		const t = raw.trim();
		if (k === 'desc') desc.push(t === '- >' ? '' : t.slice(4));
		else if (k === 'comment') comments.push(t.slice(2));
		else if (k === 'cont' && last === 'comment') comments.push('  ' + t);
		else if (k === 'cont' && last === 'desc') desc[desc.length - 1] += '\n' + t;
		if (k !== 'cont') last = k;
	});
	let note = desc.join('\n');
	if (comments.length) note += (note ? '\n\n' : '') + COMMENTS_HEADER + '\n' + comments.join('\n');
	return note;
}

/** TickTick note text -> Abyss child lines. `ind` = full indent of child lines. */
export function noteToAbyssLines(note: string, ind: string): string[] {
	const lines = note.replace(/\r/g, '').split('\n');
	while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
	const hIdx = lines.indexOf(COMMENTS_HEADER);
	let desc = hIdx >= 0 ? lines.slice(0, hIdx) : lines;
	const comments = hIdx >= 0 ? lines.slice(hIdx + 1) : [];
	while (desc.length && desc[desc.length - 1].trim() === '') desc = desc.slice(0, -1);
	const out = desc.map(l => (l.length ? `${ind}- > ${l}` : `${ind}- >`));
	for (const c of comments) {
		if (!c.trim().length) continue;
		out.push(c.startsWith('  ') ? `${ind}  ${c.slice(2)}` : `${ind}- ${c}`);
	}
	return out;
}

export function childIndent(numTabs: number, style: 'tab' | 'spaces' | undefined): string {
	const unit = style === 'spaces' ? '    ' : '\t';
	return unit.repeat(numTabs + 1);
}

// ---- child block classification (step 3) ----
export type ChildKind = 'desc' | 'comment' | 'cont' | 'item' | 'keep';
const TT_ID = /%%\[ticktick_id::/;
const ITEM_ID = /%%(?!\[ticktick_id::\s)[a-f0-9]{24}%%/;

/** End index (inclusive) of the Abyss child region of the task at taskIdx. */
export function abyssRegionEnd(lines: string[], taskIdx: number): number {
	const w = indentWidth(lines[taskIdx]);
	let j = taskIdx + 1;
	while (j < lines.length && lines[j].trim() !== '' && indentWidth(lines[j]) > w && !TT_ID.test(lines[j])) j++;
	return j - 1;
}

/** Classify each child line. Base level = shallowest indent in the region. */
export function classifyChildren(lines: string[]): ChildKind[] {
	if (!lines.length) return [];
	const base = Math.min(...lines.map(indentWidth));
	let owner: ChildKind = 'keep';
	return lines.map(l => {
		const t = l.trim();
		if (indentWidth(l) === base) {
			if (isCheckbox(l)) owner = ITEM_ID.test(l) ? 'item' : 'keep';
			else if (t === '- >' || t.startsWith('- > ')) owner = 'desc';
			else if (t.startsWith('- ')) owner = 'comment';
			else owner = 'keep';
			return owner;
		}
		// deeper / continuation line
		if (owner === 'comment' || owner === 'desc') return 'cont';
		return owner === 'item' ? 'keep' : owner; // children of subtasks/items are preserved
	});
}

/**
 * Merge a freshly generated block (task line + generated `- >`/comment/item lines)
 * with the old child region: canonical order = task, descriptions, checklist items,
 * preserved lines (subtasks & their children, original order), comments.
 */
export function mergeAbyssBlock(newText: string, oldChild: string[]): string {
	const [head, ...gen] = newText.split('\n');
	const genKinds = classifyChildren(gen);
	const pick = (k: ChildKind[]) => gen.filter((_, i) => k.includes(genKinds[i]));
	const oldKinds = classifyChildren(oldChild);
	const kept = oldChild.filter((_, i) => oldKinds[i] === 'keep');
	const descs = gen.filter((_, i) => genKinds[i] === 'desc');
	const comments: string[] = [];
	gen.forEach((l, i) => {
		if (genKinds[i] === 'comment' || (genKinds[i] === 'cont' && comments.length)) comments.push(l);
	});
	const tidy = (l: string) => l.replace(/[ \t]+$/, '').replace(/ {2,}%%/, ' %%');
	return [head, ...[...descs, ...pick(['item']), ...kept, ...comments].map(tidy)].join('\n');
}
