import { describe, expect, it, vi } from 'vitest';

const listMaps = vi.fn().mockResolvedValue([]);

vi.mock('@/db/taskCommentMaps', () => ({
	listCommentMapsForTask: (...args: unknown[]) => listMaps(...args),
	upsertCommentMap: vi.fn().mockResolvedValue(undefined),
	deleteCommentMap: vi.fn().mockResolvedValue(undefined),
	commentMapId: (taskId: string, fp: string) => `${taskId}:${fp}`,
}));
import {
	abyssDescriptionToNote,
	extractAbyssCommentThreads,
	stripLegacyCommentsBlock,
} from '@/abyssFormat';
import {
	formatApiCommentAsAbyssLines,
	migrateLegacyCommentsInContent,
	syncAbyssCommentsToTickTick,
} from '@/abyssCommentSync';
import type { TickTickRestAPI } from '@/services/TicktickRestAPI';
import { getSettings } from '@/settings';

describe('abyssCommentSync', () => {
	it('splits description from comments for API push', () => {
		const lines = ['\t- > описание', '\t- 2026-10-19 18:00: vault comment'];
		expect(abyssDescriptionToNote(lines)).toBe('описание');
		const threads = extractAbyssCommentThreads(lines);
		expect(threads).toHaveLength(1);
		expect(threads[0].body).toBe('2026-10-19 18:00: vault comment');
	});

	it('BUG-PULL-COMMENT-STALE: sibling comment bullets are separate threads', () => {
		const lines = [
			'\t- 2026-10-19 20:00: alpha',
			'\t  more',
			'\t- beta',
		];
		const threads = extractAbyssCommentThreads(lines);
		expect(threads.map(t => t.body)).toEqual(['2026-10-19 20:00: alpha\nmore', 'beta']);
		expect(threads.map(t => t.fingerprint)).toEqual(['2026-10-19 20:00: alpha more', 'beta']);
	});

	it('formats API comment as Abyss line', () => {
		const createdTime = '2026-10-19T18:05:00+07:00';
		const lines = formatApiCommentAsAbyssLines(
			{ id: 'c1', title: 'hello\nworld', createdTime },
			'\t',
		);
		// Stamp is local wall-clock of createdTime (CI is UTC; the owner machine may not be).
		const d = new Date(createdTime);
		const pad = (n: number) => String(n).padStart(2, '0');
		const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
		expect(lines[0]).toContain(`${stamp}: hello`);
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

	it('BUG-COMMENT-NO-TT-WIPE: does not delete TickTick comments when vault stamp differs from map body', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValueOnce([
			{
				id: 'task1:comment 1',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'tt-c1',
				body: 'comment 1',
			},
		]);
		const del = vi.fn();
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([{ id: 'tt-c1', title: 'comment 1' }]),
			addTaskComment: vi.fn(),
			deleteTaskComment: del,
		} as unknown as TickTickRestAPI;
		const lines = ['\t- 2026-10-21T11:14:22+07:00: comment 1'];
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', lines);
		expect(del).not.toHaveBeenCalled();
	});

	it('BUG-COMMENT-NO-TT-WIPE: preserves TickTick-only comments when vault has no comment bullets', async () => {
		listMaps.mockResolvedValueOnce([
			{
				id: 'task1:only on tt',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'only on tt',
				ticktickCommentId: 'tt-only',
				body: 'only on tt',
			},
		]);
		const del = vi.fn();
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([{ id: 'tt-only', title: 'only on tt' }]),
			addTaskComment: vi.fn(),
			deleteTaskComment: del,
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', ['\t- > description only']);
		expect(del).not.toHaveBeenCalled();
	});

	it('NOTE-C1: pushes comment threads via API (BUG-COMMENT-1)', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		const add = vi.fn().mockResolvedValue({ id: 'cmt1', title: 'hi' });
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([]),
			addTaskComment: add,
			deleteTaskComment: vi.fn().mockResolvedValue(true),
		} as unknown as TickTickRestAPI;
		const lines = ['\t- 2026-10-19 20:00: only comment changed'];
		const ok = await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', lines);
		expect(ok).toBe(true);
		expect(add).toHaveBeenCalledWith('proj1', 'task1', '2026-10-19 20:00: only comment changed');
	});
});
