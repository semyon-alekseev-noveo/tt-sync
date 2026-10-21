import { describe, expect, it } from 'vitest';
import {
	commentSetsEquivalentByNormalizedKey,
	planCommentSync,
	vaultHasUnpushedCommentThreads,
} from '@/sync/comments';

describe('planCommentSync', () => {
	const taskId = 'task1';
	const projectId = 'proj1';

	it('links vault stamp thread to plain TickTick title by normalized key', () => {
		const lines = ['\t- 2026-10-21T11:14:22+07:00: hello'];
		const remote = [{ id: 'c1', title: 'hello' }];
		const plan = planCommentSync(lines, remote, []);
		expect(plan.linked).toHaveLength(1);
		expect(plan.vaultOnly).toHaveLength(0);
		expect(plan.remoteOnly).toHaveLength(0);
	});

	it('keeps TickTick-only remote when vault has no comment bullets', () => {
		const plan = planCommentSync(['\t- > description only'], [{ id: 'c1', title: 'tt only' }], [
			{
				id: `${taskId}:tt only`,
				taskId,
				projectId,
				fingerprint: 'tt only',
				ticktickCommentId: 'c1',
				body: 'tt only',
			},
		]);
		expect(plan.linked).toHaveLength(1);
		expect(plan.linked[0].vault).toBeUndefined();
		expect(plan.remoteOnly).toHaveLength(0);
	});

	it('vaultHasUnpushedCommentThreads is false when mapped vault thread was deleted on TickTick', () => {
		const body = '2026-10-20 12:00: deleted-in-ticktick';
		const lines = [`\t- ${body}`];
		expect(vaultHasUnpushedCommentThreads(lines, [], [{
			id: 't1:x',
			taskId: 't1',
			projectId: 'p1',
			fingerprint: body,
			ticktickCommentId: 'c-old',
			body,
		}], 0)).toBe(false);
		expect(vaultHasUnpushedCommentThreads(lines, [], [], 0)).toBe(true);
	});

	it('vaultHasUnpushedCommentThreads is true when several mapped threads are missing after mass TT wipe', () => {
		const lines = [
			'\t- 2026-10-21T11:25:21+07:00: comment 1',
			'\t- 2026-10-21T12:09:07+07:00: comment 2',
		];
		const maps = [
			{
				id: 't1:c1',
				taskId: 't1',
				projectId: 'p1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'dead-1',
				body: 'comment 1',
			},
			{
				id: 't1:c2',
				taskId: 't1',
				projectId: 'p1',
				fingerprint: 'comment 2',
				ticktickCommentId: 'dead-2',
				body: 'comment 2',
			},
		];
		expect(vaultHasUnpushedCommentThreads(lines, [], maps, 0)).toBe(true);
	});

	it('vaultHasUnpushedCommentThreads is true when several mapped threads are missing but TT still has others', () => {
		const lines = [
			'\t- 2026-10-21T11:25:21+07:00: comment 1',
			'\t- 2026-10-21T12:09:07+07:00: comment 2',
			'\t- 2026-10-21T13:58:06+07:00: comment 3',
		];
		const maps = [
			{
				id: 't1:c1',
				taskId: 't1',
				projectId: 'p1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'c1',
				body: 'comment 1',
			},
			{
				id: 't1:c2',
				taskId: 't1',
				projectId: 'p1',
				fingerprint: 'comment 2',
				ticktickCommentId: 'dead-2',
				body: 'comment 2',
			},
			{
				id: 't1:c3',
				taskId: 't1',
				projectId: 'p1',
				fingerprint: 'comment 3',
				ticktickCommentId: 'dead-3',
				body: 'comment 3',
			},
		];
		expect(vaultHasUnpushedCommentThreads(lines, [{ id: 'c1', title: 'comment 1' }], maps, 1)).toBe(true);
	});

	it('vaultHasUnpushedCommentThreads is false when one mapped thread is missing but TT still has others', () => {
		const lines = [
			'\t- 2026-10-21T11:25:21+07:00: kept',
			'\t- 2026-10-21T12:09:07+07:00: deleted-in-tt',
		];
		const maps = [
			{
				id: 't1:kept',
				taskId: 't1',
				projectId: 'p1',
				fingerprint: 'kept',
				ticktickCommentId: 'c-kept',
				body: 'kept',
			},
			{
				id: 't1:gone',
				taskId: 't1',
				projectId: 'p1',
				fingerprint: 'deleted-in-tt',
				ticktickCommentId: 'c-gone',
				body: 'deleted-in-tt',
			},
		];
		expect(vaultHasUnpushedCommentThreads(lines, [{ title: 'kept' }], maps, 1)).toBe(false);
	});

	it('commentSetsEquivalentByNormalizedKey ignores stamp mismatch', () => {
		const lines = ['\t- 2026-10-21T11:14:22+07:00: a', '\t- b'];
		const remote = [{ title: 'a' }, { title: 'b' }];
		expect(commentSetsEquivalentByNormalizedKey(lines, remote)).toBe(true);
	});
});
