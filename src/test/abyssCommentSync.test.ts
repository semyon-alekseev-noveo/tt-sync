import { describe, expect, it, vi } from 'vitest';
import {
	abyssDescriptionToNote,
	extractAbyssCommentThreads,
	stripLegacyCommentsBlock,
} from '@/abyssFormat';
import { formatApiCommentAsAbyssLines, migrateLegacyCommentsInContent } from '@/abyssCommentSync';
import { getSettings } from '@/settings';

describe('abyssCommentSync', () => {
	it('splits description from comments for API push', () => {
		const lines = ['\t- > описание', '\t- 2026-10-19 18:00: vault comment'];
		expect(abyssDescriptionToNote(lines)).toBe('описание');
		const threads = extractAbyssCommentThreads(lines);
		expect(threads).toHaveLength(1);
		expect(threads[0].body).toBe('2026-10-19 18:00: vault comment');
	});

	it('formats API comment as Abyss line', () => {
		const lines = formatApiCommentAsAbyssLines(
			{ id: 'c1', title: 'hello\nworld', createdTime: '2026-10-19T18:05:00+07:00' },
			'\t',
		);
		expect(lines[0]).toContain('2026-10-19 18:05: hello');
		expect(lines[1]).toBe('\t  world');
	});

	it('migrates legacy Comments block from content', () => {
		const { description, legacyBodies } = migrateLegacyCommentsInContent(
			'desc\n\nComments:\n2026-10-14 09:00: old',
		);
		expect(description).toBe('desc');
		expect(legacyBodies.length).toBeGreaterThan(0);
		expect(stripLegacyCommentsBlock('a\n\nComments:\nb')).toBe('a');
	});

	it('syncAbyssCommentsViaApi defaults on in fork settings', () => {
		const s = getSettings() as { syncAbyssCommentsViaApi?: boolean };
		expect(s.syncAbyssCommentsViaApi).toBe(true);
	});
});
