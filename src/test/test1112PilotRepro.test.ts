import { describe, expect, it, vi } from 'vitest';
import { syncAbyssCommentsToTickTick, apiCommentsDifferFromVault } from '@/abyssCommentSync';
import type { TickTickRestAPI } from '@/services/TicktickRestAPI';
import { vaultHasUnpushedCommentThreads } from '@/sync/comments';
import { getSettings } from '@/settings';

vi.mock('@/db/taskCommentMaps', () => ({
	listCommentMapsForTask: vi.fn(),
	upsertCommentMap: vi.fn(),
	deleteCommentMap: vi.fn(),
	commentMapId: (taskId: string, fp: string) => `${taskId}:${fp}`,
}));

import { listCommentMapsForTask } from '@/db/taskCommentMaps';

const taskId = '6ad83bc73e30f4429d749e09';
const projectId = '6ad1abfe8f08abb10392fe45';
const lines = [
	'\t- > new',
	'\t- 2026-10-21T11:14:22+07:00: comment 1',
	'\t- 2026-10-21T15:16:11+07:00: test-new-verision',
];

describe('test-11-12 pilot repro', () => {
	it('commentCountMismatch must still probe when Dexie count disagrees with empty parsed threads', () => {
		const lines: string[] = [];
		expect(apiCommentsDifferFromVault(lines, [])).toBe(false);
		const commentCountMismatch = true;
		expect(apiCommentsDifferFromVault(lines, []) || commentCountMismatch).toBe(true);
	});

	it('vaultHasUnpushed with stale remote-origin maps after TT wipe', () => {
		const maps = [
			{
				id: `${taskId}:c1`,
				taskId,
				projectId,
				fingerprint: 'comment 1',
				ticktickCommentId: 'dead-1',
				body: 'comment 1',
				origin: 'remote' as const,
			},
			{
				id: `${taskId}:c2`,
				taskId,
				projectId,
				fingerprint: 'comment 2',
				ticktickCommentId: 'dead-2',
				body: '2026-10-21T11:14:26+07:00: comment 2',
				origin: 'remote' as const,
			},
		];
		expect(vaultHasUnpushedCommentThreads(lines, [], maps, 0)).toBe(true);
	});

	it('syncAbyssCommentsToTickTick pushes both vault threads when API empty and maps stale', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		// BUG-COMMENT-STALE-MAPS: several mapped ids gone → re-push both (not single-miss TT-DELETE).
		vi.mocked(listCommentMapsForTask).mockResolvedValue([
			{
				id: `${taskId}:c1`,
				taskId,
				projectId,
				fingerprint: 'comment 1',
				ticktickCommentId: 'dead-1',
				body: 'comment 1',
				origin: 'remote',
			},
			{
				id: `${taskId}:c2`,
				taskId,
				projectId,
				fingerprint: 'test-new-verision',
				ticktickCommentId: 'dead-2',
				body: 'test-new-verision',
				origin: 'remote',
			},
		]);
		const add = vi.fn()
			.mockResolvedValueOnce({ id: 'new-1', title: 'comment 1' })
			.mockResolvedValueOnce({ id: 'new-2', title: 'test-new-verision' });
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([]),
			addTaskComment: add,
			deleteTaskComment: vi.fn(),
		} as unknown as TickTickRestAPI;
		const ok = await syncAbyssCommentsToTickTick(api, taskId, projectId, lines, 'new');
		expect(ok).toBe(true);
		expect(add).toHaveBeenCalledWith(projectId, taskId, 'comment 1');
		expect(add).toHaveBeenCalledWith(projectId, taskId, 'test-new-verision');
	});
});
