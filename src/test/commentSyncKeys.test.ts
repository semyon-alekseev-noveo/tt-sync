import { describe, expect, it } from 'vitest';
import {
	normalizedCommentKey,
	normalizedKeysFromVaultLines,
	vaultHasDuplicateCommentKeys,
} from '@/sync/comments';

describe('comment sync keys', () => {
	it('normalizedCommentKey strips ISO stamp and matches plain TickTick title', () => {
		expect(normalizedCommentKey('2026-10-21T11:14:22+07:00: hello')).toBe('hello');
		expect(normalizedCommentKey('hello')).toBe('hello');
	});

	it('normalizedCommentKey strips Abyss wall-clock stamp', () => {
		expect(normalizedCommentKey('2026-10-14 12:58: gate')).toBe('gate');
	});

	it('vault lines with different stamps but same text share one normalized key', () => {
		const a = normalizedKeysFromVaultLines(['\t- 2026-10-21T11:14:22+07:00: same']);
		const b = normalizedKeysFromVaultLines(['\t- 2026-10-14 12:00: same']);
		expect(a).toEqual(['same']);
		expect(b).toEqual(['same']);
	});

	it('BUG-COMMENT-VAULT-DUP-KEY: vaultHasDuplicateCommentKeys detects wall-clock + ISO twins', () => {
		expect(vaultHasDuplicateCommentKeys([
			'\t- 2026-10-21 21:22: comment 1',
			'\t- 2026-10-21T21:11:41+07:00: comment 1',
		])).toBe(true);
		expect(vaultHasDuplicateCommentKeys([
			'\t- 2026-10-21 21:22: comment 1',
			'\t- 2026-10-21 21:15: коммент 2',
		])).toBe(false);
	});
});
