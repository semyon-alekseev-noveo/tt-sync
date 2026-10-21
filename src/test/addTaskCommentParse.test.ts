import { describe, expect, it } from 'vitest';
import { parseTaskCommentFromApiResponse } from '@/api/index';

describe('parseTaskCommentFromApiResponse', () => {
	it('unwraps { ok, result }', () => {
		expect(parseTaskCommentFromApiResponse(
			{ ok: true, result: { id: 'abc', title: 'hello' } },
			'fallback',
		)).toEqual({ id: 'abc', title: 'hello' });
	});

	it('accepts a bare comment object', () => {
		expect(parseTaskCommentFromApiResponse({ id: 'x', title: 'y' }, 'fallback'))
			.toEqual({ id: 'x', title: 'y' });
	});

	it('unwraps { data }', () => {
		expect(parseTaskCommentFromApiResponse({ data: { id: 'd1' } }, 'plain'))
			.toEqual({ id: 'd1', title: 'plain' });
	});

	it('unwraps result without ok', () => {
		expect(parseTaskCommentFromApiResponse({ result: { id: 'r1', title: 't' } }, 'fb'))
			.toEqual({ id: 'r1', title: 't' });
	});

	it('returns null when id is missing', () => {
		expect(parseTaskCommentFromApiResponse({ ok: true, result: { title: 'no-id' } }, 'fb')).toBeNull();
	});
});
