import type { App } from 'obsidian';
import { syncCachedRead } from '@/sync/vault-io/fileRunCache';
import { noteFilesScanned } from '@/sync/perf';

/**
 * First note path that contains each id, same result as `text.includes(id)` in vault order.
 * One pass builds the id→path map. A sync run may reuse that map until a file is written.
 */
export async function idsPresentInVault(app: App, ids: string[]): Promise<Map<string, string>> {
	const recalled = recallVaultIdIndex(ids);
	if (recalled) return recalled;
	const scan = createIdScan(ids);
	const gen = vaultIdIndexGeneration();
	if (!scan.done()) {
		for (const f of app.vault.getMarkdownFiles()) {
			const text = await syncCachedRead(app.vault, f);
			noteFilesScanned(1);
			if (scan.feed(f.path, text)) break;
		}
	}
	const found = scan.result();
	rememberVaultIdIndex(ids, found, gen);
	return found;
}

/** Same map as {@link idsPresentInVault} for texts already in memory. */
export function idsPresentInTexts(files: readonly { path: string; text: string }[], ids: readonly string[]): Map<string, string> {
	const scan = createIdScan(ids);
	if (!scan.done()) {
		for (const f of files) if (scan.feed(f.path, f.text)) break;
	}
	return scan.result();
}

interface IdScan {
	done(): boolean;
	feed(path: string, text: string): boolean;
	result(): Map<string, string>;
}

/**
 * Literals grouped by length. A pattern of one length cannot hide a shorter id,
 * and an exact literal match is the same hit `String.includes` would report.
 * Files must be fed in vault order; the first hit wins.
 */
export function createIdScan(ids: readonly string[]): IdScan {
	const unique: string[] = [];
	const seen = new Set<string>();
	for (const id of ids) {
		if (!id || seen.has(id)) continue;
		seen.add(id);
		unique.push(id);
	}
	const byLen = new Map<number, string[]>();
	for (const id of unique) {
		const list = byLen.get(id.length);
		if (list) list.push(id);
		else byLen.set(id.length, [id]);
	}
	const groups = [...byLen.values()].map(list => new RegExp(list.map(escapeRegExp).join('|'), 'g'));
	const found = new Map<string, string>();
	return {
		done: () => found.size === unique.length,
		result: () => found,
		feed(path: string, text: string): boolean {
			if (found.size === unique.length || !text) return found.size === unique.length;
			for (const re of groups) {
				re.lastIndex = 0;
				let match: RegExpExecArray | null;
				while ((match = re.exec(text))) {
					const id = match[0];
					if (id && !found.has(id)) found.set(id, path);
					// `includes` reports ids that start inside an earlier same-length hit.
					// A global regex would skip that span, so resume one character in.
					const next = match.index + 1;
					if (re.lastIndex < next) break;
					if (re.lastIndex > next) re.lastIndex = next;
				}
				if (found.size === unique.length) return true;
			}
			return found.size === unique.length;
		},
	};
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let indexLive = false;
let indexGen = 0;
let storedIndex: { gen: number; ids: Set<string>; found: Map<string, string> } | null = null;

/** Drop the per-sync id→path map. File writes call this so the next lookup cannot be stale. */
export function invalidateVaultIdIndex(): void {
	indexGen++;
	storedIndex = null;
}

export function openVaultIdIndex(): void {
	indexLive = true;
	invalidateVaultIdIndex();
}

export function closeVaultIdIndex(): void {
	indexLive = false;
	storedIndex = null;
}

export function vaultIdIndexGeneration(): number {
	return indexGen;
}

export function recallVaultIdIndex(ids: readonly string[]): Map<string, string> | undefined {
	if (!indexLive || !storedIndex || storedIndex.gen !== indexGen) return undefined;
	for (const id of ids) if (id && !storedIndex.ids.has(id)) return undefined;
	const out = new Map<string, string>();
	for (const id of ids) {
		if (!id) continue;
		const path = storedIndex.found.get(id);
		if (path) out.set(id, path);
	}
	return out;
}

export function rememberVaultIdIndex(ids: readonly string[], found: Map<string, string>, genAtStart: number): void {
	if (!indexLive || genAtStart !== indexGen) return;
	const idSet = new Set<string>();
	for (const id of ids) if (id) idSet.add(id);
	storedIndex = { gen: genAtStart, ids: idSet, found: new Map(found) };
}

const ID_RE = /%%\[ticktick_id:: ([0-9a-f]+)\]%%/;
/** Remove the TickTick id (and its TT link) from a task line, turning it into a new task. */
export function stripTaskId(line: string): string {
	const id = line.match(ID_RE)?.[1];
	if (!id) return line;
	return line.replace(ID_RE, '').replace(new RegExp(`\\s*\\[link\\]\\([^)]*${id}\\)`), '').replace(/[ \t]+$/, '');
}

/**
 * Duplicated task lines (same TickTick id twice): keep the occurrence in `owner(id)`'s file
 * (or the first one), strip the id from every other copy so it syncs as a new task.
 */
export function dedupeTaskIds(files: { path: string; text: string }[], owner: (id: string) => string | undefined) {
	const seen = new Map<string, string>(); // id -> path that keeps it
	for (const f of files) for (const m of f.text.matchAll(new RegExp(ID_RE, 'g'))) {
		const id = m[1];
		if (!seen.has(id)) seen.set(id, owner(id) && files.some(x => x.path === owner(id) && x.text.includes(id)) ? owner(id)! : f.path);
	}
	const changed: { path: string; text: string; ids: string[] }[] = [];
	for (const f of files) {
		const kept = new Set<string>(); const ids: string[] = [];
		const raw = f.text.split('\n'); const fenced = fencedLines(raw);
		const lines = raw.map((l, i) => {
			const id = l.match(ID_RE)?.[1];
			if (!id || fenced.has(i)) return l; // code-block copies are examples: never strip
			if (seen.get(id) === f.path && !kept.has(id)) { kept.add(id); return l; }
			ids.push(id); return stripTaskId(l);
		});
		if (ids.length) changed.push({ path: f.path, text: lines.join('\n'), ids });
	}
	return changed;
}

/** Line indexes inside fenced code blocks (``` or ~~~), fences included. Tasks there must never sync. */
export function fencedLines(lines: string[]): Set<number> {
	const out = new Set<number>(); let fence: string | null = null;
	lines.forEach((l, i) => {
		const m = l.match(/^\s*(?:>\s*)*(`{3,}|~{3,})/);
		if (fence) { out.add(i); if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null; }
		else if (m) { fence = m[1]; out.add(i); }
	});
	return out;
}
