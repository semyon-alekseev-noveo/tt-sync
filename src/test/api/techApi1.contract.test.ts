import { describe, expect, it, vi } from 'vitest';
import * as obsidian from 'obsidian';
import { buildAddTaskCommentBody, buildUpdateTaskCommentBody, Tick } from '@/api';
import { API_ENDPOINTS } from '@/api/utils/get-api-endpoints';

/**
 * TECH-API-1 — cheap contract smoke for the unofficial web-session client.
 * No network: path strings and known POST body keys must stay stable so TT
 * regressions show up as test failures before a silent sync break.
 */
describe('TECH-API-1 API endpoint contract', () => {
	it('TECH-API-1 keeps critical session path strings', () => {
		expect(API_ENDPOINTS.signInEndPoint).toBe('user/signon?wc=true&remember=true');
		expect(API_ENDPOINTS.allTasksEndPoint).toBe('batch/check/');
		expect(API_ENDPOINTS.allProjectGroupsEndPoint).toBe('batch/check/');
		expect(API_ENDPOINTS.updateTaskEndPoint).toBe('batch/task');
		expect(API_ENDPOINTS.TaskEndPoint).toBe('task');
		expect(API_ENDPOINTS.allProjectsEndPoint).toBe('projects');
		expect(API_ENDPOINTS.userStatus).toBe('user/status');
	});

	it('TECH-API-1 comment paths match project/task layout', () => {
		const projectId = 'projA';
		const taskId = 'taskB';
		const commentId = 'c1';
		expect(API_ENDPOINTS.taskComments(projectId, taskId)).toBe(
			`project/${projectId}/task/${taskId}/comments`,
		);
		expect(API_ENDPOINTS.taskComment(projectId, taskId)).toBe(
			`project/${projectId}/task/${taskId}/comment`,
		);
		expect(API_ENDPOINTS.taskCommentDelete(projectId, taskId, commentId)).toBe(
			`project/${projectId}/task/${taskId}/comment/${commentId}`,
		);
	});

	it('TECH-API-1 buildAddTaskCommentBody keeps web-client required keys', () => {
		const body = buildAddTaskCommentBody('p1', 't1', 'hello');
		expect(body).toMatchObject({
			taskId: 't1',
			projectId: 'p1',
			title: 'hello',
			mentions: [],
		});
		expect(typeof body.id).toBe('string');
		expect(String(body.id).length).toBeGreaterThan(0);
		expect(typeof body.createdTime).toBe('string');
		expect(body.userProfile).toEqual({ isMyself: true });
	});

	it('GAP-COMMENT-EDIT buildUpdateTaskCommentBody is title-only and clips at 1024', () => {
		expect(buildUpdateTaskCommentBody('hello')).toEqual({ title: 'hello' });
		expect(String(buildUpdateTaskCommentBody('x'.repeat(2000)).title).length).toBe(1024);
		expect(buildUpdateTaskCommentBody('hello')).not.toHaveProperty('isNew');
		expect(buildUpdateTaskCommentBody('hello')).not.toHaveProperty('id');
	});

	it('GAP-COMMENT-EDIT updateTaskComment PUTs the existing comment path', async () => {
		const requestUrl = vi.spyOn(obsidian, 'requestUrl').mockResolvedValue({
			status: 200,
			headers: {},
			json: {},
			text: '',
		} as never);
		const tick = new Tick({ token: 't', baseUrl: 'ticktick.com', checkPoint: 1 });
		const updated = await tick.updateTaskComment('proj', 'task', 'cid', 'new text');
		expect(updated).toEqual({ id: 'cid', title: 'new text' });
		const arg = requestUrl.mock.calls[0]?.[0] as { method?: string; url?: string; body?: string };
		expect(arg.method).toBe('PUT');
		expect(arg.url).toBe('https://api.ticktick.com/api/v2/project/proj/task/task/comment/cid');
		expect(JSON.parse(String(arg.body))).toEqual({ title: 'new text' });
		requestUrl.mockRestore();
	});
});
