// Abyss Tasks format helpers (pure, no Obsidian deps).
// Under a task (indent = task tabs + 1 tab):
//   `- > text`  -> description line  -> TickTick note body
//   `- text`    -> comment line      -> appended to note after COMMENTS_HEADER
export const COMMENTS_HEADER = 'Comments:';
const ABYSS_LINE = /^\s*- (?!\[.\])(.*)$/;

export function isAbyssNoteLine(line: string, taskTabs: number): boolean {
	const tabs = (line.match(/^\t*/) ?? [''])[0].length;
	const rest = line.slice(tabs);
	return tabs === taskTabs + 1 && ABYSS_LINE.test(rest) && !/^- \[.\]/.test(rest);
}

/** Abyss child lines -> TickTick note text. */
export function abyssLinesToNote(lines: string[]): string {
	const desc: string[] = [];
	const comments: string[] = [];
	for (const raw of lines) {
		const m = raw.trim().match(/^- (.*)$/);
		if (!m) continue;
		const body = m[1];
		if (body === '>' || body.startsWith('> ')) desc.push(body.slice(2));
		else comments.push(body);
	}
	let note = desc.join('\n');
	if (comments.length) note += (note ? '\n\n' : '') + COMMENTS_HEADER + '\n' + comments.join('\n');
	return note;
}

/** TickTick note text -> Abyss child lines (without leading newline). */
export function noteToAbyssLines(note: string, taskTabs: number): string[] {
	const ind = '\t'.repeat(taskTabs + 1);
	const lines = note.replace(/\r/g, '').split('\n');
	while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
	const hIdx = lines.indexOf(COMMENTS_HEADER);
	let desc = hIdx >= 0 ? lines.slice(0, hIdx) : lines;
	const comments = hIdx >= 0 ? lines.slice(hIdx + 1) : [];
	while (desc.length && desc[desc.length - 1].trim() === '') desc = desc.slice(0, -1);
	const out = desc.map(l => (l.length ? `${ind}- > ${l}` : `${ind}- >`));
	for (const c of comments) if (c.trim().length) out.push(`${ind}- ${c}`);
	return out;
}
