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
	const desc: string[] = [];
	const comments: string[] = [];
	let base = -1;
	let last: 'd' | 'c' | '' = '';
	for (const raw of lines) {
		const w = indentWidth(raw);
		const t = raw.trim();
		if (base < 0 && isBullet(raw)) base = w;
		if (isBullet(raw) && w === base) {
			const body = t.slice(2);
			if (t === '- >' || body.startsWith('> ')) { desc.push(t === '- >' ? '' : body.slice(2)); last = 'd'; }
			else { comments.push(body); last = 'c'; }
		} else if (last === 'c') {
			comments.push('  ' + t); // continuation of a multi-line comment
		} else if (last === 'd') {
			desc[desc.length - 1] += '\n' + t;
		}
	}
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
