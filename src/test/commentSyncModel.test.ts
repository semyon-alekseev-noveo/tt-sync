/**
 * Wiring gaps: legacy helpers must adopt src/sync/comments (see docs/COMMENT_SYNC_MODEL.md).
 */
import { describe, expect, it } from 'vitest';
import { apiCommentsDifferFromVault } from '@/abyssCommentSync';
import { commentSetsEquivalentByNormalizedKey } from '@/sync/comments';

describe('BUG-COMMENT-KEY-EQUIV wiring', () => {
	const vaultLines = ['\t- 2026-10-21T11:14:22+07:00: hello'];
	const remote = [{ title: 'hello' }];

	it('normalized model treats stamped vault and plain TT as equivalent', () => {
		expect(commentSetsEquivalentByNormalizedKey(vaultLines, remote)).toBe(true);
	});

	it('apiCommentsDifferFromVault uses normalized keys', () => {
		expect(apiCommentsDifferFromVault(vaultLines, remote)).toBe(false);
	});
});
