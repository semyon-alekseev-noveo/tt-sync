import type { ITaskComment } from '@/api/types/TaskComment';
import type { AbyssCommentThread } from '@/abyssFormat';
import { extractAbyssCommentThreads } from '@/abyssFormat';
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
