/**
 * TickTick web-session comment helpers (#66 / TECH-API-1).
 * Extracted from api/index — behavior unchanged.
 */
import ObjectID from 'bson-objectid';
import type { ITaskComment } from './types/TaskComment';
import log from '@/utils/logger';

/**
 * Web-session POST `/comment` body. TickTick returns HTTP 500 `unknown_exception`
 * for `{ title }` / `{ title, content }` alone; the web client sends a client id
 * plus task/project ids (dida-cli web-api.md). See BUG-COMMENT-API-POST-500.
 */
/**
 * PUT `/comment/{id}` body. dida-cli's live comment update sends `{ title }` only
 * (web-api.md). Do not reuse the POST create shape: that generates a new id and `isNew: true`.
 */
export function buildUpdateTaskCommentBody(title: string): Record<string, unknown> {
	return { title: title.slice(0, 1024) };
}

export function buildAddTaskCommentBody(projectId: string, taskId: string, title: string): Record<string, unknown> {
	const clipped = title.slice(0, 1024);
	return {
		id: ObjectID().toHexString(),
		createdTime: new Date().toISOString().replace('Z', '+0000'),
		taskId,
		projectId,
		title: clipped,
		userProfile: { isMyself: true },
		mentions: [],
		isNew: true,
	};
}

/** Unwrap TickTick POST /comment JSON into `{ id, title? }` or null when the id is missing. */
export function parseTaskCommentFromApiResponse(response: unknown, fallbackTitle: string): ITaskComment | null {
	if (!response || typeof response !== 'object') return null;
	const raw = response as Record<string, unknown>;
	const pick = (v: unknown): ITaskComment | null => {
		if (!v || typeof v !== 'object') return null;
		const o = v as Record<string, unknown>;
		const rawId = o.id ?? o.commentId;
		const id = typeof rawId === 'string' ? rawId : (typeof rawId === 'number' ? String(rawId) : '');
		if (!id.length) return null;
		const t = o.title;
		return { id, title: typeof t === 'string' ? t : fallbackTitle };
	};
	if (raw.ok === true && raw.result) {
		const fromResult = pick(raw.result);
		if (fromResult) return fromResult;
	}
	const direct = pick(raw);
	if (direct) return direct;
	if (raw.data) {
		const fromData = pick(raw.data);
		if (fromData) return fromData;
	}
	if (raw.result && raw.ok !== false) {
		const fromLoose = pick(raw.result);
		if (fromLoose) return fromLoose;
	}
	log.warn('Add Task Comment: response had no comment id', raw);
	return null;
}
