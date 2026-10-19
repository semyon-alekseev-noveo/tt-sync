import type { ITaskComment } from '@/api/types/TaskComment';
import type { TickTickRestAPI } from '@/services/TicktickRestAPI';
import {
	COMMENTS_HEADER,
	abyssDescriptionToNote,
	abyssLinesToNote,
	commentFingerprint,
	extractAbyssCommentThreads,
	stripLegacyCommentsBlock,
} from '@/abyssFormat';
import {
	commentMapId,
	deleteCommentMap,
	listCommentMapsForTask,
	upsertCommentMap,
} from '@/db/taskCommentMaps';
import { getSettings } from '@/settings';
import log from '@/utils/logger';

export function useAbyssCommentsApi(): boolean {
	const s = getSettings();
	return !!(s.syncNotes && s.abyssTasksFormat && s.syncAbyssCommentsViaApi);
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
	const maps = await listCommentMapsForTask(taskId);
	const mapByFp = new Map(maps.map(m => [m.fingerprint, m]));
	const mapByTtId = new Map(maps.map(m => [m.ticktickCommentId, m]));

	let changed = false;

	if (legacyContent?.includes(COMMENTS_HEADER)) {
		const { legacyBodies } = migrateLegacyCommentsInContent(legacyContent);
		for (const line of legacyBodies) {
			const body = line.replace(/^\s*-\s*/, '');
			const fp = commentFingerprint(body);
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

	const remote = await api.getTaskComments(projectId, taskId);
	const remoteIds = new Set(remote.map(c => c.id));

	for (const thread of threads) {
		const existing = mapByFp.get(thread.fingerprint);
		if (!existing) {
			const created = await api.addTaskComment(projectId, taskId, thread.body);
			if (created?.id) {
				await upsertCommentMap({
					id: commentMapId(taskId, thread.fingerprint),
					taskId,
					projectId,
					fingerprint: thread.fingerprint,
					ticktickCommentId: created.id,
					body: thread.body,
				});
				changed = true;
			}
			continue;
		}
		if (existing.body !== thread.body) {
			await api.deleteTaskComment(projectId, taskId, existing.ticktickCommentId);
			const created = await api.addTaskComment(projectId, taskId, thread.body);
			if (created?.id) {
				await deleteCommentMap(existing.id);
				await upsertCommentMap({
					id: commentMapId(taskId, thread.fingerprint),
					taskId,
					projectId,
					fingerprint: thread.fingerprint,
					ticktickCommentId: created.id,
					body: thread.body,
				});
				changed = true;
			}
		}
	}

	const localFps = new Set(threads.map(t => t.fingerprint));
	for (const m of maps) {
		if (!localFps.has(m.fingerprint)) {
			if (remoteIds.has(m.ticktickCommentId)) {
				await api.deleteTaskComment(projectId, taskId, m.ticktickCommentId);
			}
			await deleteCommentMap(m.id);
			changed = true;
		}
	}

	for (const c of remote) {
		if (!mapByTtId.has(c.id)) {
			const fp = commentFingerprint(c.title ?? '');
			if (!localFps.has(fp)) {
				// TickTick-only comment; map for pull stability
				await upsertCommentMap({
					id: commentMapId(taskId, fp),
					taskId,
					projectId,
					fingerprint: fp,
					ticktickCommentId: c.id,
					body: c.title ?? '',
				});
			}
		}
	}

	return changed;
}
