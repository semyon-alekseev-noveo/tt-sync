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
	const firstBody = lines[0] ?? '';
	const bullet = stamp && !firstBody.startsWith(stamp) ? `${stamp}: ${firstBody}` : firstBody || stamp;
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

/**
 * Push Abyss comment threads to TickTick Comments API; descriptions stay in task `content` via parser.
 */
export async function syncAbyssCommentsToTickTick(
	api: TickTickRestAPI | undefined,
	taskId: string,
	projectId: string,
	taskLines: string[],
	legacyContent?: string,
): Promise<boolean> {
	if (!api || !useAbyssCommentsApi() || !taskId || !projectId) return false;

	const threads = extractAbyssCommentThreads(taskLines);
	let maps = await listCommentMapsForTask(taskId);
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
					});
					changed = true;
				}
			}
		}
	}

	let remote = await api.getTaskComments(projectId, taskId);
	const remoteIds = new Set(remote.map(c => c.id));
	maps = await listCommentMapsForTask(taskId);
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
		});
		changed = true;
	}

	const tickTickCommentTitle = (body: string) => {
		const plain = commentBodyWithoutStamp(body);
		return (plain || body).trim();
	};

	for (const v of plan.vaultOnly) {
		const thread = v.thread;
		const fp = mapFingerprintForThread(thread);
		const created = await api.addTaskComment(projectId, taskId, tickTickCommentTitle(thread.body));
		if (created?.id) {
			await upsertCommentMap({
				id: commentMapId(taskId, fp),
				taskId,
				projectId,
				fingerprint: fp,
				ticktickCommentId: created.id,
				body: thread.body,
			});
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
		const created = await api.addTaskComment(projectId, taskId, vaultBody);
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
			});
			changed = true;
		}
	}

	// Re-plan after creates so deletes use a fresh remote list (BUG-COMMENT-PUSH-STALE-REMOTE).
	remote = await api.getTaskComments(projectId, taskId);
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
