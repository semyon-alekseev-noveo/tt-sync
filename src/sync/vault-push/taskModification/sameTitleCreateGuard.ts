/**
 * BUG-TT-DUP-CREATE-ON-STRIP-SYNC — fail-closed before TickTick createTask.
 *
 * Unmarked vault lines that match live same-title tasks under the same parent
 * must reattach or skip — never invent a third TickTick id when history already
 * has orphans / a vault-linked keeper.
 */
import { normalizeRebindTitle, lineHasCheckbox } from '@/sync/rebindVault';

const MARKER_FULL = /%%\[\s*ticktick_id::\s*([A-Za-z0-9]+)\s*\]%%/;

export type SameTitleLiveTask = {
	id: string;
	title?: string | null;
	parentId?: string | null;
	projectId?: string | null;
	deleted?: number | null;
	status?: number | null;
};

export type SameTitleCreateDecision =
	| { action: 'create' }
	| { action: 'reattach'; taskId: string }
	| { action: 'skip'; reason: 'ambiguous-orphans' | 'already-linked-same-title' };

/** Locked 1A parent key (same as TT dedupe DoR): parentId else root list id. */
export function sameTitleParentKey(task: {
	parentId?: string | null;
	projectId?: string | null;
}): string | null {
	const parent = (task.parentId ?? '').trim();
	if (parent) return `parent:${parent}`;
	const project = (task.projectId ?? '').trim();
	if (project) return `root:${project}`;
	return null;
}

export function vaultHasMarkedSameTitleLine(
	lines: readonly string[],
	wantTitleKey: string,
	currentLineIndex?: number,
): boolean {
	for (let i = 0; i < lines.length; i++) {
		if (currentLineIndex === i) continue;
		const line = lines[i] ?? '';
		if (!lineHasCheckbox(line)) continue;
		if (normalizeRebindTitle(line) !== wantTitleKey) continue;
		if (MARKER_FULL.test(line)) return true;
	}
	return false;
}

function isOpenSameTitleTask(
	t: SameTitleLiveTask,
	wantTitleKey: string,
): boolean {
	const id = (t.id ?? '').trim();
	if (!id) return false;
	if (t.deleted && t.deleted !== 0) return false;
	if (t.status != null && t.status !== 0) return false;
	return normalizeRebindTitle(t.title ?? '') === wantTitleKey;
}

function orphanDecision(
	orphans: readonly SameTitleLiveTask[],
): SameTitleCreateDecision | null {
	if (orphans.length === 1) {
		return { action: 'reattach', taskId: orphans[0]!.id };
	}
	if (orphans.length > 1) {
		return { action: 'skip', reason: 'ambiguous-orphans' };
	}
	return null;
}

/**
 * Decide whether an unmarked in-scope line may create a TickTick task.
 *
 * `liveTasks` is file-scoped (Dexie rows for the note). Parent key prefers
 * 1A matches, then falls back to any same-title file orphan — strip→sync often
 * infers inbox/`root:` while historical peers stay under the project parent
 * (live fail 2026-11-04 09:36Z → `6aeafcb0…`).
 *
 * - Exactly one orphan (prefer parent-matched) → reattach.
 * - Multiple orphans → skip (ambiguous; no silent third TT).
 * - Zero orphans but vault already has a marked same-title sibling → skip.
 * - Otherwise → create.
 */
export function decideSameTitleCreate(opts: {
	wantTitle: string;
	wantParentKey: string | null;
	vaultText: string;
	vaultLines: readonly string[];
	currentLineIndex?: number;
	liveTasks: readonly SameTitleLiveTask[];
}): SameTitleCreateDecision {
	const wantTitleKey = normalizeRebindTitle(opts.wantTitle);
	if (!wantTitleKey) return { action: 'create' };

	const titlePeers = opts.liveTasks.filter(t => isOpenSameTitleTask(t, wantTitleKey));

	const parentPeers = titlePeers.filter(t => {
		const pk = sameTitleParentKey(t);
		if (opts.wantParentKey && pk && pk !== opts.wantParentKey) return false;
		if (opts.wantParentKey && !pk) return false;
		return true;
	});

	const parentOrphans = parentPeers.filter(t => !opts.vaultText.includes(t.id));
	const parentHit = orphanDecision(parentOrphans);
	if (parentHit) return parentHit;

	// File-scoped fallback: ignore parent mismatch (inbox inference vs project orphans).
	const titleOrphans = titlePeers.filter(t => !opts.vaultText.includes(t.id));
	const titleHit = orphanDecision(titleOrphans);
	if (titleHit) return titleHit;

	const hasMarkedSibling = vaultHasMarkedSameTitleLine(
		opts.vaultLines,
		wantTitleKey,
		opts.currentLineIndex,
	);
	const hasPresentPeer = titlePeers.some(t => opts.vaultText.includes(t.id));
	if (hasMarkedSibling || hasPresentPeer) {
		return { action: 'skip', reason: 'already-linked-same-title' };
	}

	return { action: 'create' };
}
