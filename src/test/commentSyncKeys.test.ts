import { describe, expect, it } from 'vitest';
import { normalizedCommentKey, normalizedKeysFromVaultLines } from '@/sync/comments';

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
});
