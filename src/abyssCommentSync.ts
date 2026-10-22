import type { ITaskComment } from '@/api/types/TaskComment';
import type { TickTickRestAPI } from '@/services/TicktickRestAPI';
import {
	COMMENTS_HEADER,
	abyssDescriptionToNote,
	abyssLinesToNote,
	commentBodyWithoutStamp,
	commentFingerprint,
	extractAbyssCommentThreads,
	type AbyssCommentThread,
	normalizedCommentKey,
	stripLegacyCommentsBlock,
} from '@/abyssFormat';
import type { TaskCommentMap } from '@/db/schema';
import {
	commentMapId,
	deleteCommentMap,
	listCommentMapsForTask,
	upsertCommentMap,
} from '@/db/taskCommentMaps';
import { getSettings } from '@/settings';
import {
	commentSetsEquivalentByNormalizedKey,
	normalizedKeysFromVaultLines,
	planCommentSync,
	remoteCommentKeysAheadOfVault,
} from '@/sync/comments';
import { deletionConfirmMode } from '@/sync/massDeleteGuard';
import log from '@/utils/logger';

/** True when vault and TickTick comment sets differ by normalized content keys. */
export function apiCommentsDifferFromVault(taskLines: string[] | undefined, remote: { title?: string }[]): boolean {
	return !commentSetsEquivalentByNormalizedKey(taskLines ?? [], remote);
}

export function useAbyssCommentsApi(): boolean {
	const s = getSettings();
	return !!(s.syncNotes && s.abyssTasksFormat && s.syncAbyssCommentsViaApi);
}

function mapFingerprintForThread(thread: AbyssCommentThread): string {
	return normalizedCommentKey(thread.body) || thread.fingerprint;
}

function mapFingerprintForRemoteTitle(title: string): string {
	return normalizedCommentKey(title) || commentFingerprint(title);
}

/** True when a Dexie map still matches a vault comment thread (stamp vs plain TT title). */
export function vaultStillHasMappedComment(
	map: { fingerprint: string; body: string },
	threads: AbyssCommentThread[],
): boolean {
	const mapKey = normalizedCommentKey(map.body) || map.fingerprint;
	for (const t of threads) {
		if (mapFingerprintForThread(t) === mapKey) return true;
		if (commentFingerprint(t.body) === commentFingerprint(map.body)) return true;
		const plain = commentBodyWithoutStamp(t.body);
		if (map.body && (plain === map.body || normalizedCommentKey(plain) === mapKey)) return true;
	}
	return false;
}

export function formatApiCommentAsAbyssLines(comment: ITaskComment, indent: string): string[] {
	const body = (comment.title ?? '').replace(/\r/g, '');
	const lines = body.split('\n');
	const stamp = comment.createdTime ? formatVaultCommentStamp(comment.createdTime) : '';
	const plainFirst = commentBodyWithoutStamp(lines[0] ?? '');
	const bullet = plainFirst
		? (stamp ? `${stamp}: ${plainFirst}` : plainFirst)
		: stamp;
	const out = [`${indent}- ${bullet}`];
	for (let i = 1; i < lines.length; i++) {
		out.push(`${indent}  ${lines[i]}`);
	}
	return out;
}

function formatVaultCommentStamp(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function migrateLegacyCommentsInContent(content: string): { description: string; legacyBodies: string[] } {
	const stripped = stripLegacyCommentsBlock(content);
	const idx = content.indexOf(COMMENTS_HEADER);
	if (idx < 0) return { description: stripped, legacyBodies: [] };
	const block = content.slice(idx + COMMENTS_HEADER.length).trim();
	const legacyBodies = block ? block.split('\n').map(l => l.trim()).filter(Boolean) : [];
	return { description: stripped, legacyBodies };
}

export type AbyssCommentSyncOptions = {
	/** User removed all Abyss comment bullets (line hash changed, Dexie maps still present). */
	obsidianRemovedCommentBullets?: boolean;
};

/** Dexie maps that came from vault pushes (not TT-only `remote` origin). */
export function vaultHadSyncedCommentBullets(maps: readonly TaskCommentMap[]): boolean {
	return maps.some(m => m.origin !== 'remote');
}

/**
 * Wipe only when the push path saw a line-hash change that cleared Abyss bullets
 * (BUG-COMMENT-EMPTY-VAULT-WIPE). Maps alone must not imply user intent — a stale
 * empty vault read must not delete TickTick comments.
 */
function shouldWipeRemoteCommentsForEmptyVault(
	threads: AbyssCommentThread[],
	maps: readonly TaskCommentMap[],
	opts?: AbyssCommentSyncOptions,
): boolean {
	if (threads.length > 0 || maps.length === 0) return false;
	return opts?.obsidianRemovedCommentBullets === true;
}

function isVaultOriginCommentMap(m: TaskCommentMap): boolean {
	return m.origin !== 'remote';
}

/**
 * Push Abyss comment threads to TickTick Comments API; descriptions stay in task `content` via parser.
 */
export async function syncAbyssCommentsToTickTick(
	api: TickTickRestAPI | undefined,
	taskId: string,
	projectId: string,
	taskLines: string[],
	legacyContent?: string,
	opts?: AbyssCommentSyncOptions,
): Promise<boolean> {
	if (!api || !useAbyssCommentsApi() || !taskId || !projectId) return false;

	const threads = extractAbyssCommentThreads(taskLines);
	let maps = await listCommentMapsForTask(taskId);

	if (shouldWipeRemoteCommentsForEmptyVault(threads, maps, opts) && deletionConfirmMode() !== 'skip') {
		const remote = await api.getTaskComments(projectId, taskId);
		// BUG-COMMENT-GET-FAIL-OPEN: unknown remote state → no deletes.
		if (remote === null) {
			log.warn('Abyss comment wipe skipped: getTaskComments returned unknown state', taskId);
			return false;
		}
		const vaultOriginIds = new Set(
			maps.filter(isVaultOriginCommentMap).map(m => m.ticktickCommentId).filter(Boolean),
		);
		let changed = false;
		// BUG-COMMENT-EMPTY-VAULT-WIPE: delete only vault-pushed comments; keep TT-only.
		for (const c of remote) {
			if (!vaultOriginIds.has(c.id)) continue;
			if (await api.deleteTaskComment(projectId, taskId, c.id)) changed = true;
		}
		maps = await listCommentMapsForTask(taskId);
		for (const m of maps) {
			if (!isVaultOriginCommentMap(m)) continue;
			await deleteCommentMap(m.id);
			changed = true;
		}
		return changed;
	}
	const mapByFp = new Map(maps.map(m => [m.fingerprint, m]));

	let changed = false;

	if (legacyContent?.includes(COMMENTS_HEADER)) {
		const { legacyBodies } = migrateLegacyCommentsInContent(legacyContent);
		for (const line of legacyBodies) {
			const body = line.replace(/^\s*-\s*/, '');
			const fp = mapFingerprintForRemoteTitle(body);
			if (!mapByFp.has(fp) && body) {
				const created = await api.addTaskComment(projectId, taskId, body);
				if (created?.id) {
					await upsertCommentMap({
						id: commentMapId(taskId, fp),
						taskId,
						projectId,
						fingerprint: fp,
						ticktickCommentId: created.id,
						body,
						origin: 'vault',
					});
					changed = true;
				}
			}
		}
	}

	let remote = await api.getTaskComments(projectId, taskId);
	// BUG-COMMENT-GET-FAIL-OPEN: failed GET must not look like "no comments" → vaultOnly re-create.
	if (remote === null) {
		log.warn('Abyss comment push skipped: getTaskComments returned unknown state', taskId);
		return changed;
	}
	const remoteIds = new Set(remote.map(c => c.id));
	maps = await listCommentMapsForTask(taskId);

	const tickTickCommentTitle = (body: string) => {
		const plain = commentBodyWithoutStamp(body);
		return (plain || body).trim();
	};

	/** Prefer plain TT titles over vault-stamped twins when collapsing duplicates. */
	const preferRemoteComment = (a: { title?: string }, b: { title?: string }): number => {
		const aStamped = commentBodyWithoutStamp(a.title ?? '') !== (a.title ?? '').trim();
		const bStamped = commentBodyWithoutStamp(b.title ?? '') !== (b.title ?? '').trim();
		if (aStamped !== bStamped) return aStamped ? 1 : -1;
		return 0;
	};

	// BUG-COMMENT-DUP-STAMP: collapse stamped+plain (or race) pairs before planning push.
	if (remote.length > 1 && deletionConfirmMode() !== 'skip') {
		const byKey = new Map<string, typeof remote>();
		for (const c of remote) {
			const key = normalizedCommentKey(c.title ?? '');
			if (!key) continue;
			const group = byKey.get(key) ?? [];
			group.push(c);
			byKey.set(key, group);
		}
		let deduped = false;
		for (const group of byKey.values()) {
			if (group.length < 2) continue;
			const keep = [...group].sort(preferRemoteComment)[0];
			for (const extra of group) {
				if (extra.id === keep.id) continue;
				if (await api.deleteTaskComment(projectId, taskId, extra.id)) {
					changed = true;
					deduped = true;
				}
				const map = maps.find(m => m.ticktickCommentId === extra.id);
				if (map) await deleteCommentMap(map.id);
			}
		}
		if (deduped) {
			const refreshed = await api.getTaskComments(projectId, taskId);
			if (refreshed === null) {
				log.warn('Abyss comment push skipped after dedupe: getTaskComments unknown', taskId);
				return changed;
			}
			remote = refreshed;
			maps = await listCommentMapsForTask(taskId);
		}
	}

	const plan = planCommentSync(taskLines, remote, maps);

	for (const r of plan.remoteOnly) {
		const fp = mapFingerprintForRemoteTitle(r.comment.title ?? '');
		await upsertCommentMap({
			id: commentMapId(taskId, fp),
			taskId,
			projectId,
			fingerprint: fp,
			ticktickCommentId: r.comment.id,
			body: r.comment.title ?? '',
			origin: 'remote',
		});
		// Map-only bookkeeping must not count as a vault→TT push (pilot test-11-12 /
		// BUG-COMMENT-DISK-READ): do not set `changed` here.
	}

	const remoteKeysPresent = new Set(
		remote.map(c => normalizedCommentKey(c.title ?? '')).filter(k => k.length > 0),
	);

	for (const v of plan.vaultOnly) {
		const thread = v.thread;
		const fp = mapFingerprintForThread(thread);
		const key = normalizedCommentKey(thread.body);
		// Race / twin: key already on TickTick — map it, do not POST again.
		if (key && remoteKeysPresent.has(key)) {
			const existing = remote.find(c => normalizedCommentKey(c.title ?? '') === key);
			if (existing?.id) {
				await upsertCommentMap({
					id: commentMapId(taskId, fp),
					taskId,
					projectId,
					fingerprint: fp,
					ticktickCommentId: existing.id,
					body: thread.body,
					origin: 'vault',
				});
			}
			continue;
		}
		const created = await api.addTaskComment(projectId, taskId, tickTickCommentTitle(thread.body));
		if (created?.id) {
			await upsertCommentMap({
				id: commentMapId(taskId, fp),
				taskId,
				projectId,
				fingerprint: fp,
				ticktickCommentId: created.id,
				body: thread.body,
				origin: 'vault',
			});
			if (key) remoteKeysPresent.add(key);
			changed = true;
		}
	}

	for (const link of plan.linked) {
		if (!link.vault || !link.remote) continue;
		const vaultBody = link.vault.thread.body;
		const remoteTitle = link.remote.comment.title ?? '';
		if (normalizedCommentKey(vaultBody) === normalizedCommentKey(remoteTitle)) continue;
		if (vaultBody === remoteTitle) continue;
		const existing = link.map;
		if (!existing) continue;
		if (deletionConfirmMode() === 'skip') continue;
		await api.deleteTaskComment(projectId, taskId, existing.ticktickCommentId);
		const created = await api.addTaskComment(projectId, taskId, tickTickCommentTitle(vaultBody));
		if (created?.id) {
			const fp = mapFingerprintForThread(link.vault.thread);
			await deleteCommentMap(existing.id);
			await upsertCommentMap({
				id: commentMapId(taskId, fp),
				taskId,
				projectId,
				fingerprint: fp,
				ticktickCommentId: created.id,
				body: vaultBody,
				origin: 'vault',
			});
			changed = true;
		}
	}

	// Re-plan after creates so deletes use a fresh remote list (BUG-COMMENT-PUSH-STALE-REMOTE).
	const remoteAfterPush = await api.getTaskComments(projectId, taskId);
	if (remoteAfterPush === null) {
		log.warn('Abyss comment delete phase skipped: getTaskComments unknown after push', taskId);
		return changed;
	}
	remote = remoteAfterPush;
	remoteIds.clear();
	for (const c of remote) remoteIds.add(c.id);
	maps = await listCommentMapsForTask(taskId);
	const planAfterPush = planCommentSync(taskLines, remote, maps);

	const vaultKeys = new Set(normalizedKeysFromVaultLines(taskLines));
	// Never delete TickTick comments when GET returned an empty list — avoids mass wipe on
	// transient API failures or a partial vault read (BUG-COMMENT-NO-MASS-DELETE).
	// When TickTick has comment keys the vault lacks, pull must add bullets first (push runs
	// before pull); deleting here wiped TT-only comments (BUG-COMMENT-TT-AHEAD-NO-DELETE).
	if (
		remote.length > 0
		&& deletionConfirmMode() !== 'skip'
		&& !remoteCommentKeysAheadOfVault(taskLines, remote)
	) {
		for (const entry of planAfterPush.mapWithoutVault) {
			const m = entry.map;
			const r = entry.remote;
			if (!m || !r?.comment.id) continue;
			const mapKey = normalizedCommentKey(m.body) || normalizedCommentKey(m.fingerprint);
			if (mapKey && vaultKeys.has(mapKey)) continue;
			if (vaultStillHasMappedComment(m, threads)) continue;
			if (remoteIds.has(m.ticktickCommentId)) {
				await api.deleteTaskComment(projectId, taskId, m.ticktickCommentId);
			}
			await deleteCommentMap(m.id);
			changed = true;
		}
	}
	for (const m of planAfterPush.orphanMaps) {
		await deleteCommentMap(m.id);
		changed = true;
	}

	return changed;
}
