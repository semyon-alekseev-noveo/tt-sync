import type { ITaskComment } from '@/api/types/TaskComment';
import type { AbyssCommentThread } from '@/abyssFormat';
import { commentFingerprint, extractAbyssCommentThreads } from '@/abyssFormat';
import type { TaskCommentMap } from '@/db/schema';
import {
	normalizedCommentKey,
	normalizedKeysFromRemote,
	normalizedKeysFromVaultLines,
	remoteCommentRef,
	vaultThreadRef,
} from '@/sync/comments/keys';

/** TickTick has normalized comment keys the vault lines do not (pull Comments API into the note). */
export function remoteCommentKeysAheadOfVault(
	taskLines: string[],
	remote: ReadonlyArray<{ title?: string }>,
): boolean {
	const local = new Set(normalizedKeysFromVaultLines(taskLines));
	return normalizedKeysFromRemote(remote).some(k => !local.has(k));
}

/** Vault has comment threads TickTick Comments API does not (push to TickTick). */
export function vaultCommentKeysAheadOfRemote(
	taskLines: string[],
	remote: ReadonlyArray<{ title?: string }>,
): boolean {
	const api = new Set(normalizedKeysFromRemote(remote));
	return normalizedKeysFromVaultLines(taskLines).some(k => !api.has(k));
}

/**
 * True when the vault has comment text that still needs a TickTick Comments API push.
 *
 * - Unmapped vault threads → true (need create).
 * - Empty GET + several mapped ids missing → true (BUG-COMMENT-STALE-MAPS / test-11-12).
 * - Empty GET + one mapped miss (any origin) → false (TP-COMMENT-TT-DELETE: wait for pull).
 *   Dexie `commentCount` is ignored here — it often stays >0 until the next task pull (#104).
 * - Partial GET + several mapped misses → true; one mapped miss → false.
 */
export function vaultHasUnpushedCommentThreads(
	taskLines: string[],
	remote: ReadonlyArray<{ title?: string }>,
	maps: readonly TaskCommentMap[],
	_remoteCommentCount?: number,
): boolean {
	const apiKeys = new Set(normalizedKeysFromRemote(remote));
	const remoteIds = new Set(remote.map(c => c.id).filter((id): id is string => !!id));
	const threads = extractAbyssCommentThreads(taskLines);
	const missingFromApi = threads.filter(t => !apiKeys.has(normalizedCommentKey(t.body)));
	if (missingFromApi.length === 0) return false;

	const mapForThread = (t: AbyssCommentThread) => {
		const key = normalizedCommentKey(t.body);
		return maps.find(m => {
			const mk = normalizedCommentKey(m.body);
			return mk === key || m.fingerprint === commentFingerprint(t.body);
		});
	};

	for (const t of missingFromApi) {
		const mapped = mapForThread(t);
		// No map / no TickTick id → vault still needs a create push.
		if (!mapped?.ticktickCommentId) return true;
	}

	// All missing threads are mapped. Count how many mapped ids are absent from the live GET.
	const mappedIdsGone = missingFromApi.filter(t => {
		const m = mapForThread(t)!;
		return !remoteIds.has(m.ticktickCommentId);
	}).length;

	if (mappedIdsGone === 0) return false;

	// STALE-MAPS: several mapped ids gone → re-push. Single mapped miss → TT delete, wait for pull.
	return mappedIdsGone > 1;
}

import type { CommentSyncMatch, CommentSyncPlan, RemoteCommentRef, VaultCommentThreadRef } from '@/sync/comments/types';

function keysOverlap(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
	for (const k of a) if (b.has(k)) return true;
	return false;
}

function toVaultRef(thread: AbyssCommentThread): VaultCommentThreadRef {
	const { contentKey, aliasKeys } = vaultThreadRef(thread);
	return { thread, contentKey, aliasKeys };
}

function toRemoteRef(comment: Pick<ITaskComment, 'id' | 'title'>): RemoteCommentRef {
	const { contentKey, aliasKeys } = remoteCommentRef(comment.title ?? '');
	return { comment, contentKey, aliasKeys };
}

/**
 * Plan vault ↔ TickTick comment sync for one task.
 * Identity: `ticktickCommentId` in map first; else normalized / alias key overlap.
 */
export function planCommentSync(
	taskLines: string[],
	remote: ReadonlyArray<Pick<ITaskComment, 'id' | 'title'>>,
	maps: TaskCommentMap[],
): CommentSyncPlan {
	const threads = extractAbyssCommentThreads(taskLines).map(toVaultRef);
	const remotes = remote.map(toRemoteRef);
	const mapByTtId = new Map(maps.map(m => [m.ticktickCommentId, m]));
	const usedVault = new Set<VaultCommentThreadRef>();
	const usedRemote = new Set<RemoteCommentRef>();
	const linked: CommentSyncMatch[] = [];

	for (const m of maps) {
		const r = remotes.find(x => x.comment.id === m.ticktickCommentId);
		if (!r) continue;
		const v = threads.find(t => keysOverlap(t.aliasKeys, aliasKeysForMap(m)));
		linked.push({ map: m, remote: r, vault: v });
		usedRemote.add(r);
		if (v) usedVault.add(v);
	}

	for (const v of threads) {
		if (usedVault.has(v)) continue;
		const r = remotes.find(x => !usedRemote.has(x) && keysOverlap(v.aliasKeys, x.aliasKeys));
		if (r) {
			linked.push({ vault: v, remote: r, map: mapByTtId.get(r.comment.id) });
			usedVault.add(v);
			usedRemote.add(r);
		}
	}

	const vaultOnly = threads.filter(t => !usedVault.has(t));
	const remoteOnly = remotes.filter(r => !usedRemote.has(r));
	const orphanMaps = maps.filter(m => {
		const hasRemote = remotes.some(r => r.comment.id === m.ticktickCommentId);
		const hasVault = threads.some(v => keysOverlap(v.aliasKeys, aliasKeysForMap(m)));
		return !hasRemote && !hasVault;
	});
	const mapWithoutVault = maps
		.filter(m => remotes.some(r => r.comment.id === m.ticktickCommentId))
		.filter(m => !threads.some(v => keysOverlap(v.aliasKeys, aliasKeysForMap(m))))
		.map(m => ({
			map: m,
			remote: remotes.find(r => r.comment.id === m.ticktickCommentId),
		}));

	return { linked, vaultOnly, remoteOnly, orphanMaps, mapWithoutVault };
}

function aliasKeysForMap(m: TaskCommentMap): ReadonlySet<string> {
	const keys = new Set<string>([m.fingerprint, normalizedCommentKey(m.body)]);
	const plain = normalizedCommentKey(m.body);
	if (plain) keys.add(plain);
	return keys;
}

/** True when vault and remote carry the same set of comments by normalized content keys. */
export function commentSetsEquivalentByNormalizedKey(
	taskLines: string[],
	remote: ReadonlyArray<{ title?: string }>,
): boolean {
	const local = normalizedKeysFromVaultLines(taskLines);
	const api = normalizedKeysFromRemote(remote);
	if (local.length !== api.length) return false;
	return local.every((k, i) => k === api[i]);
}
