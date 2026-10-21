import { describe, expect, it } from 'vitest';
import { buildAddTaskCommentBody, parseTaskCommentFromApiResponse } from '@/api/index';

/**
 * BUG-COMMENT-API-POST-500 — TickTick v2 POST /comment rejects `{ title }` /
 * `{ title, content }` with HTTP 500 `unknown_exception`. The web client sends a
 * client-generated id plus task/project fields (see dida-cli web-api.md). A 200
 * with an empty body still means the client id is the new comment id.
 */
describe('BUG-COMMENT-API-POST-500', () => {
	it('buildAddTaskCommentBody includes webapp create fields (not title-only)', () => {
		const body = buildAddTaskCommentBody('proj-1', 'task-1', 'hello comment');
		expect(body.title).toBe('hello comment');
		expect(body.taskId).toBe('task-1');
		expect(body.projectId).toBe('proj-1');
		expect(typeof body.id).toBe('string');
		expect(String(body.id).length).toBe(24);
		expect(typeof body.createdTime).toBe('string');
		expect(body.isNew).toBe(true);
		expect(body.mentions).toEqual([]);
		expect(body.userProfile).toEqual({ isMyself: true });
		// Must not be the broken minimal payload that causes HTTP 500.
		expect(body).not.toHaveProperty('content');
		expect(Object.keys(body).sort()).toEqual(
			['createdTime', 'id', 'isNew', 'mentions', 'projectId', 'taskId', 'title', 'userProfile'].sort(),
		);
	});

	it('clips title to 1024 chars', () => {
		const long = 'x'.repeat(2000);
		const body = buildAddTaskCommentBody('p', 't', long);
		expect(String(body.title).length).toBe(1024);
	});

	it('empty 200 body falls back to client id for Dexie maps', () => {
		const body = buildAddTaskCommentBody('proj-1', 'task-1', 'vault line');
		const parsed = parseTaskCommentFromApiResponse({}, String(body.title));
		expect(parsed).toBeNull();
		// Caller uses client id when parse fails after a successful POST:
		const fallback = { id: String(body.id), title: String(body.title) };
		expect(fallback.id).toMatch(/^[a-f0-9]{24}$/);
		expect(fallback.title).toBe('vault line');
	});
});
