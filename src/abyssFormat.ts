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

/** Description text only (no `Comments:` block) for TickTick `content` when using Comments API. */
export function abyssDescriptionToNote(lines: string[]): string {
	const kinds = classifyChildren(lines);
	const desc: string[] = [];
	let last: ChildKind = 'keep';
	lines.forEach((raw, i) => {
		const k = kinds[i];
		const t = raw.trim();
		if (k === 'desc') desc.push(t === '- >' ? '' : t.slice(4));
		else if (k === 'cont' && last === 'desc') desc[desc.length - 1] += '\n' + t;
		if (k !== 'cont') last = k;
	});
	return desc.join('\n');
}

export function stripLegacyCommentsBlock(note: string): string {
	if (!note) return '';
	const idx = note.indexOf(COMMENTS_HEADER);
	if (idx < 0) return note;
	return note.slice(0, idx).replace(/\n+$/, '');
}

export type AbyssCommentThread = { fingerprint: string; body: string; lines: string[] };

/** One Abyss comment thread (bullet + continuations) for API sync. */
export function extractAbyssCommentThreads(taskLines: string[]): AbyssCommentThread[] {
	const kinds = classifyChildren(taskLines);
	const threads: AbyssCommentThread[] = [];
	let current: string[] = [];
	const flush = () => {
		if (!current.length) return;
		const body = current
			.map(l => l.trim())
			.map(l => (l.startsWith('- ') ? l.slice(2) : l))
			.join('\n')
			.replace(/^\s+/, '');
		threads.push({ fingerprint: commentFingerprint(body), body, lines: [...current] });
		current = [];
	};
	for (let i = 0; i < taskLines.length; i++) {
		const k = kinds[i];
		if (k === 'comment') {
			// Each sibling bullet is its own thread. Continuations stay attached below.
			if (current.length) flush();
			current.push(taskLines[i]);
		} else if (k === 'cont' && current.length > 0) {
			current.push(taskLines[i]);
		} else {
			flush();
		}
	}
	flush();
	return threads;
}

export function commentFingerprint(body: string): string {
	return body.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Drop leading `YYYY-MM-DD` / ISO stamp before the comment text (vault line or map body). */
export function commentBodyWithoutStamp(body: string): string {
	return body
		.trim()
		.replace(/^(\d{4}-\d{2}-\d{2}(?:[T ][\d:+. -]+(?:[+-]\d{2}:\d{2})?)?):\s*/, '')
		.trim();
}

export function normalizedCommentKey(body: string): string {
	return commentFingerprint(commentBodyWithoutStamp(body));
}

export function commentFingerprintsForThread(thread: AbyssCommentThread): string[] {
	const fps = new Set<string>([thread.fingerprint, commentFingerprint(thread.body)]);
	const plain = normalizedCommentKey(thread.body);
	if (plain) fps.add(plain);
	return [...fps];
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
/** `- 2026-10-14 12:58: text` -> Date (local time) or undefined. */
export function commentStamp(line: string): Date | undefined {
	const m = line.trim().match(/^- (\d{4})-(\d{2})-(\d{2})(?: (\d{1,2}):(\d{2}))?/);
	return m ? new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0)) : undefined;
}

/**
 * Comment bodies TickTick already knew (`taskCommentMaps.body`) and the bodies it has now.
 * A vault comment in `knownBodies` but not in `apiBodies` was deleted in TickTick.
 * A vault comment with no map entry is new locally and is kept. This does not use `base`.
 */
export interface TickTickCommentSync {
	knownBodies: readonly string[];
	apiBodies: readonly string[];
	/** TickTick task `commentCount` when comments were fetched; omit only when the API list was not loaded. */
	remoteCommentCount?: number;
}

/** Line indexes of vault comment threads deleted in TickTick since the previous sync. */
function commentLinesDeletedInTickTick(oldChild: string[], generatedComments: string[], ticktick: TickTickCommentSync): Set<number> {
	const known = new Set(ticktick.knownBodies.map(normalizedCommentKey).filter(fp => fp.length > 0));
	const skip = new Set<number>();
	if (!known.size) return skip;
	const api = new Set(ticktick.apiBodies.map(normalizedCommentKey).filter(fp => fp.length > 0));
	// Empty API without a loaded count is ambiguous (failed fetch) — BUG-COMMENT-MERGE-NO-STRIP /
	// BUG-COMMENT-GET-FAIL-OPEN. A numeric count (even stale >0) with a successful empty GET still
	// means TT deleted those known bodies (TP-COMMENT-TT-DELETE / H2).
	if (!api.size && typeof ticktick.remoteCommentCount !== 'number') return skip;
	const generated = new Set(extractAbyssCommentThreads(generatedComments).map(t => normalizedCommentKey(t.body)));
	const kinds = classifyChildren(oldChild);
	let buf: string[] = [];
	let idx: number[] = [];
	const flush = () => {
		if (!buf.length) return;
		const body = buf
			.map(l => l.trim())
			.map(l => (l.startsWith('- ') ? l.slice(2) : l))
			.join('\n')
			.replace(/^\s+/, '');
		const fp = normalizedCommentKey(body);
		if (known.has(fp) && !api.has(fp) && !generated.has(fp)) idx.forEach(i => skip.add(i));
		buf = [];
		idx = [];
	};
	for (let i = 0; i < oldChild.length; i++) {
		const k = kinds[i];
		if (k === 'comment') {
			flush();
			buf.push(oldChild[i]);
			idx.push(i);
		} else if (k === 'cont' && buf.length) {
			buf.push(oldChild[i]);
			idx.push(i);
		} else {
			flush();
		}
	}
	flush();
	return skip;
}

function descBody(line: string): string {
	const t = line.trim();
	if (t === '- >') return '';
	if (t.startsWith('- > ')) return t.slice(4);
	return t.replace(/^- /, '');
}

/**
 * `base` = note text last synced with TickTick (legacy `Comments:` block only). Comments API deletions use `ticktick`, not `base`.
 * A description or comment that is in the vault and not in the generated block or the last synced base is an unpushed local edit.
 * Those lines stay. A generated comment the vault no longer has is not put back beside that edit.
 */
export function mergeAbyssBlock(newText: string, oldChild: string[], base?: string, ticktick?: TickTickCommentSync): string {
	const [head, ...gen] = newText.split('\n');
	const genKinds = classifyChildren(gen);
	const pick = (k: ChildKind[]) => gen.filter((_, i) => k.includes(genKinds[i]));
	const oldKinds = classifyChildren(oldChild);
	const kept = oldChild.filter((_, i) => oldKinds[i] === 'keep');
	const genDescs = gen.filter((_, i) => genKinds[i] === 'desc');
	const localDescs = oldChild.filter((_, i) => oldKinds[i] === 'desc');
	const commentsIdx = base?.indexOf(COMMENTS_HEADER) ?? -1;
	const baseDesc = base === undefined ? undefined : (commentsIdx >= 0 ? base.slice(0, commentsIdx) : base);
	const genDescBodies = new Set(genDescs.map(descBody));
	const unpushedDesc = localDescs.some(line => {
		const body = descBody(line);
		if (genDescBodies.has(body)) return false;
		if (baseDesc !== undefined && body.length > 0 && baseDesc.includes(body)) return false;
		return body.length > 0 || baseDesc === undefined;
	});
	const descs = unpushedDesc ? localDescs : genDescs;
	const comments: string[] = [];
	gen.forEach((l, i) => {
		if (genKinds[i] === 'comment' || (genKinds[i] === 'cont' && comments.length)) comments.push(l);
	});
	// Keep a local thread the generated block does not already show.
	// Comments API: drop a thread that taskCommentMaps knew and the current API list does not.
	// Legacy notes: drop a thread whose body sat under `Comments:` in `base` and is gone from the new block.
	// A missing base, an empty map, or a description-only base must not wipe vault bullets.
	const deletedInTickTick = ticktick ? commentLinesDeletedInTickTick(oldChild, comments, ticktick) : null;
	const syncedBodies = !ticktick && base !== undefined && commentsIdx >= 0 ? base.slice(commentsIdx + COMMENTS_HEADER.length) : '';
	const localThreads = extractAbyssCommentThreads(oldChild);
	const genThreads = extractAbyssCommentThreads(comments);
	const localFps = new Set(localThreads.map(t => t.fingerprint));
	const genFps = new Set(genThreads.map(t => t.fingerprint));
	const knownFps = new Set((ticktick?.knownBodies ?? []).map(commentFingerprint).filter(fp => fp.length > 0));
	const bodyDeletedInNote = (body: string) => syncedBodies.length > 0 && syncedBodies.includes(body);
	const unpushedLocalComment = localThreads.some(thread => {
		if (!thread.fingerprint || genFps.has(thread.fingerprint)) return false;
		if (knownFps.has(thread.fingerprint)) return false;
		if (bodyDeletedInNote(thread.body)) return false;
		return true;
	});
	if (unpushedLocalComment) {
		const drop = new Set(genThreads.filter(thread =>
			!localFps.has(thread.fingerprint)
			&& (knownFps.has(thread.fingerprint) || bodyDeletedInNote(thread.body)),
		).map(thread => thread.fingerprint));
		if (drop.size) {
			comments.length = 0;
			for (const thread of genThreads) if (!drop.has(thread.fingerprint)) comments.push(...thread.lines);
		}
	}
	// Exact line match plus normalized keys so pull does not keep wall-clock + ISO twins
	// (BUG-COMMENT-VAULT-DUP-KEY).
	const have = new Set(comments.map(l => l.trim()));
	const haveKeys = new Set(
		extractAbyssCommentThreads(comments).map(t => normalizedCommentKey(t.body)).filter(k => k.length > 0),
	);
	let carry = false;
	oldChild.forEach((l, i) => {
		if (oldKinds[i] === 'comment') {
			const body = l.trim().slice(2);
			const key = normalizedCommentKey(body);
			const deletedInNote = syncedBodies.length > 0 && syncedBodies.includes(body);
			const deletedOnServer = deletedInTickTick?.has(i) ?? false;
			const keyAlreadyPresent = key.length > 0 && haveKeys.has(key);
			carry = !have.has(l.trim()) && !keyAlreadyPresent && !deletedInNote && !deletedOnServer;
		} else if (oldKinds[i] !== 'cont') carry = false;
		if (carry && (oldKinds[i] === 'comment' || oldKinds[i] === 'cont') && !deletedInTickTick?.has(i)) {
			comments.push(l);
			if (oldKinds[i] === 'comment') {
				const key = normalizedCommentKey(l.trim().slice(2));
				if (key) haveKeys.add(key);
			}
		}
	});
	const collapsedComments = collapseAbyssCommentLinesByKey(comments);
	const tidy = (l: string) => l.replace(/[ \t]+$/, '').replace(/ {2,}%%/, ' %%');
	return [head, ...[...descs, ...pick(['item']), ...kept, ...collapsedComments].map(tidy)].join('\n');
}

/** Prefer wall-clock stamp over ISO stamp when collapsing twin Abyss comment bullets. */
function preferCommentThread(a: AbyssCommentThread, b: AbyssCommentThread): number {
	const iso = (body: string) => /^\d{4}-\d{2}-\d{2}T/.test(body.trim());
	const wall = (body: string) => /^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}/.test(body.trim());
	const aIso = iso(a.body);
	const bIso = iso(b.body);
	if (aIso !== bIso) return aIso ? 1 : -1;
	const aWall = wall(a.body);
	const bWall = wall(b.body);
	if (aWall !== bWall) return aWall ? -1 : 1;
	return 0;
}

/**
 * Rewrite Abyss child lines collapsing comment twins by `normalizedCommentKey`.
 * Non-comment children stay; comment threads are collapsed in place at the first comment.
 */
export function rewriteAbyssChildrenCollapsingCommentKeys(childLines: string[]): string[] {
	const kinds = classifyChildren(childLines);
	const commentIdx = new Set<number>();
	let inComment = false;
	for (let i = 0; i < childLines.length; i++) {
		const k = kinds[i];
		if (k === 'comment') {
			inComment = true;
			commentIdx.add(i);
		} else if (k === 'cont' && inComment) {
			commentIdx.add(i);
		} else {
			inComment = false;
		}
	}
	if (commentIdx.size === 0) return childLines;
	const collapsed = collapseAbyssCommentLinesByKey(childLines.filter((_, i) => commentIdx.has(i)));
	const out: string[] = [];
	let inserted = false;
	for (let i = 0; i < childLines.length; i++) {
		if (commentIdx.has(i)) {
			if (!inserted) {
				out.push(...collapsed);
				inserted = true;
			}
			continue;
		}
		out.push(childLines[i]);
	}
	return out;
}

/**
 * One Abyss comment bullet per `normalizedCommentKey` (BUG-COMMENT-VAULT-DUP-KEY).
 * Prefers wall-clock stamp over ISO stamp twins.
 */
export function collapseAbyssCommentLinesByKey(lines: string[]): string[] {
	const threads = extractAbyssCommentThreads(lines);
	if (threads.length <= 1) return lines;
	const byKey = new Map<string, AbyssCommentThread[]>();
	const order: string[] = [];
	const noKey: AbyssCommentThread[] = [];
	for (const t of threads) {
		const key = normalizedCommentKey(t.body);
		if (!key) {
			noKey.push(t);
			continue;
		}
		const group = byKey.get(key);
		if (!group) {
			byKey.set(key, [t]);
			order.push(key);
		} else {
			group.push(t);
		}
	}
	const out: string[] = [];
	for (const key of order) {
		const group = byKey.get(key)!;
		const keep = [...group].sort(preferCommentThread)[0];
		out.push(...keep.lines);
	}
	for (const t of noKey) out.push(...t.lines);
	return out;
}
