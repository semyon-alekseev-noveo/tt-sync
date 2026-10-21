import { describe, expect, it } from 'vitest';
import { commentSetsEquivalentByNormalizedKey, planCommentSync } from '@/sync/comments';

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

	it('commentSetsEquivalentByNormalizedKey ignores stamp mismatch', () => {
		const lines = ['\t- 2026-10-21T11:14:22+07:00: a', '\t- b'];
		const remote = [{ title: 'a' }, { title: 'b' }];
		expect(commentSetsEquivalentByNormalizedKey(lines, remote)).toBe(true);
	});
});
