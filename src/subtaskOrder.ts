// Subtask order sync: TickTick child sortOrder <-> line order under the parent.
import { fencedLines } from '@/utils/vaultIdScan';

const ID = /%%\[ticktick_id:: ([0-9a-f]+)\]%%/;
const TASK = /^\s*[-*+] \[.\]/;
const ind = (l: string) => (l.match(/^[\t ]*/)?.[0] ?? '').replace(/ {4}/g, '\t').length;

interface Block { id: string; start: number; end: number }
/** Direct child task blocks of every parent line, in file order (code blocks ignored). */
export function childBlocks(lines: string[]): Map<string, Block[]> {
	const fenced = fencedLines(lines); const out = new Map<string, Block[]>();
	const stack: { id: string; tabs: number }[] = [];
	for (let i = 0; i < lines.length; i++) {
		const l = lines[i];
		if (fenced.has(i) || !TASK.test(l)) continue;
		const id = l.match(ID)?.[1]; if (!id) continue;
		const t = ind(l);
		while (stack.length && stack[stack.length - 1].tabs >= t) stack.pop();
		const parent = stack[stack.length - 1];
		if (parent && t === parent.tabs + 1) {
			let end = i;
			for (let j = i + 1; j < lines.length; j++) { if (lines[j].trim() && ind(lines[j]) <= t) break; end = j; }
			while (end > i && !lines[end].trim()) end--;
			if (!out.has(parent.id)) out.set(parent.id, []);
			out.get(parent.id)!.push({ id, start: i, end });
		}
		stack.push({ id, tabs: t });
	}
	return out;
}

/** File order differs from TickTick order? -> new sortOrders that reproduce the file order. */
export function sortOrdersFromLines(order: string[], sortOrder: Record<string, number | undefined>): Record<string, number> {
	const known = order.filter(id => typeof sortOrder[id] === 'number');
	const sorted = [...known].sort((a, b) => sortOrder[a]! - sortOrder[b]!);
	if (known.length < 2 || known.every((id, i) => id === sorted[i])) return {};
	const out: Record<string, number> = {};
	known.forEach((id, i) => { out[id] = (i + 1) * 1099511627776; });
	return out;
}

/** Reorder child blocks under each parent to match TickTick sortOrder. Returns null if nothing moves. */
export function reorderLinesBySortOrder(lines: string[], sortOrder: Record<string, number | undefined>): string[] | null {
	let changed = false; let cur = lines;
	for (const [, blocks] of childBlocks(lines)) {
		if (blocks.some(b => typeof sortOrder[b.id] !== 'number') || blocks.length < 2) continue;
		// only contiguous sibling runs can be swapped safely
		if (blocks.some((b, i) => i && blocks[i - 1].end + 1 !== b.start)) continue;
		const want = [...blocks].sort((a, b) => sortOrder[a.id]! - sortOrder[b.id]!);
		if (want.every((b, i) => b.id === blocks[i].id)) continue;
		const start = blocks[0].start, end = blocks[blocks.length - 1].end;
		const body = want.flatMap(b => lines.slice(b.start, b.end + 1));
		cur = [...cur.slice(0, start), ...body, ...cur.slice(end + 1)]; changed = true;
		lines = cur; // positions of later parents stay valid: same length
	}
	return changed ? cur : null;
}
