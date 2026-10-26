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
	canSkipAbyssCommentNetwork,
	formatApiCommentAsAbyssLines,
	migrateLegacyCommentsInContent,
	syncAbyssCommentsToTickTick,
} from '@/abyssCommentSync';
import { upsertCommentMap } from '@/db/taskCommentMaps';
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

	it('BUG-COMMENT-PULL-DOUBLE-STAMP strips ISO prefix before vault stamp on pull', () => {
		const lines = formatApiCommentAsAbyssLines(
			{
				id: 'c1',
				title: '2026-10-21T12:09:07+07:00: comment 2',
				createdTime: '2026-10-21T07:46:14+0000',
			},
			'\t',
		);
		expect(lines[0]).not.toContain('T12:09:07');
		expect(lines[0]).toMatch(/comment 2$/);
		expect(lines[0]).toMatch(/^\t- \d{4}-\d{2}-\d{2} \d{2}:\d{2}: comment 2$/);
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

	it('TP-IDLE-ZERO-SWEEP: canSkip when commentCount matches and maps cover vault threads', () => {
		const lines = ['\t- 2026-10-21 21:22: comment 1'];
		const maps = [{
			id: 'task1:comment 1',
			taskId: 'task1',
			projectId: 'proj1',
			fingerprint: 'comment 1',
			ticktickCommentId: 'tt-c1',
			body: 'comment 1',
			origin: 'vault' as const,
		}];
		expect(canSkipAbyssCommentNetwork(lines, maps, 1)).toBe(true);
		expect(canSkipAbyssCommentNetwork(lines, maps, undefined)).toBe(false);
		expect(canSkipAbyssCommentNetwork(lines, maps, 2)).toBe(false);
		expect(canSkipAbyssCommentNetwork(lines, [], 1)).toBe(false);
		expect(canSkipAbyssCommentNetwork(lines, maps, 1, { obsidianRemovedCommentBullets: true })).toBe(false);
		// Slice 4: no Abyss bullets and no maps → no Comments GET on quiet sweep.
		expect(canSkipAbyssCommentNetwork([], [], undefined)).toBe(true);
		expect(canSkipAbyssCommentNetwork(['\t- > description only'], [], undefined)).toBe(true);
	});

	it('TP-IDLE-EMPTY-SWEEP: syncAbyssCommentsToTickTick skips GET when no threads and no maps', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValue([]);
		const getTaskComments = vi.fn().mockResolvedValue([]);
		const api = {
			getTaskComments,
			addTaskComment: vi.fn(),
			deleteTaskComment: vi.fn(),
		} as unknown as TickTickRestAPI;
		const ok = await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', ['\t- > description only']);
		expect(ok).toBe(false);
		expect(getTaskComments).not.toHaveBeenCalled();
	});

	it('TP-IDLE-ZERO-SWEEP: syncAbyssCommentsToTickTick skips getTaskComments when idle-safe', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValue([
			{
				id: 'task1:comment 1',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'tt-c1',
				body: 'comment 1',
				origin: 'vault',
			},
		]);
		const getTaskComments = vi.fn().mockResolvedValue([{ id: 'tt-c1', title: 'comment 1' }]);
		const api = {
			getTaskComments,
			addTaskComment: vi.fn(),
			deleteTaskComment: vi.fn(),
		} as unknown as TickTickRestAPI;
		const ok = await syncAbyssCommentsToTickTick(
			api,
			'task1',
			'proj1',
			['\t- 2026-10-21 21:22: comment 1'],
			undefined,
			{ remoteCommentCount: 1 },
		);
		expect(ok).toBe(false);
		expect(getTaskComments).not.toHaveBeenCalled();
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

	it('BUG-COMMENT-EMPTY-VAULT-WIPE: maps alone without hash flag must not wipe TT comments', async () => {
		listMaps.mockResolvedValue([
			{
				id: 'task1:c1',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'c1',
				body: 'comment 1',
				origin: 'vault',
			},
		]);
		const del = vi.fn().mockResolvedValue(true);
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([{ id: 'c1', title: 'comment 1' }]),
			addTaskComment: vi.fn(),
			deleteTaskComment: del,
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', ['\t- > description only']);
		expect(del).not.toHaveBeenCalled();
	});

	it('BUG-COMMENT-EMPTY-VAULT-WIPE: empty vault + vault-origin map + TT-only comment keeps TT-only', async () => {
		listMaps.mockResolvedValue([
			{
				id: 'task1:comment 1',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'c1',
				body: 'comment 1',
				origin: 'vault',
			},
			{
				id: 'task1:only on tt',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'only on tt',
				ticktickCommentId: 'tt-only',
				body: 'only on tt',
				origin: 'remote',
			},
		]);
		const del = vi.fn().mockResolvedValue(true);
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([
				{ id: 'c1', title: 'comment 1' },
				{ id: 'tt-only', title: 'only on tt' },
			]),
			addTaskComment: vi.fn(),
			deleteTaskComment: del,
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(
			api,
			'task1',
			'proj1',
			['\t- > description only'],
			undefined,
			{ obsidianRemovedCommentBullets: true },
		);
		expect(del).toHaveBeenCalledTimes(1);
		expect(del).toHaveBeenCalledWith('proj1', 'task1', 'c1');
		expect(del).not.toHaveBeenCalledWith('proj1', 'task1', 'tt-only');
	});

	it('BUG-COMMENT-VAULT-WIPE deletes vault-origin TT comments when vault bullets were removed with hash flag', async () => {
		listMaps.mockResolvedValue([
			{
				id: 'task1:comment 1',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'c1',
				body: 'comment 1',
			},
			{
				id: 'task1:comment 2',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 2',
				ticktickCommentId: 'c2',
				body: 'comment 2',
			},
		]);
		const del = vi.fn().mockResolvedValue(true);
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([
				{ id: 'c1', title: 'comment 1' },
				{ id: 'c2', title: 'comment 2' },
			]),
			addTaskComment: vi.fn(),
			deleteTaskComment: del,
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(
			api,
			'task1',
			'proj1',
			['\t- > description only'],
			undefined,
			{ obsidianRemovedCommentBullets: true },
		);
		expect(del).toHaveBeenCalledTimes(2);
		expect(del).toHaveBeenCalledWith('proj1', 'task1', 'c1');
		expect(del).toHaveBeenCalledWith('proj1', 'task1', 'c2');
	});

	it('BUG-COMMENT-GET-FAIL-OPEN: failed getTaskComments must not re-create mapped vault threads', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValue([
			{
				id: 'task1:comment 1',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'tt-1',
				body: 'comment 1',
				origin: 'vault',
			},
			{
				id: 'task1:comment 2',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 2',
				ticktickCommentId: 'tt-2',
				body: 'comment 2',
				origin: 'vault',
			},
		]);
		const add = vi.fn();
		const del = vi.fn();
		const api = {
			getTaskComments: vi.fn().mockResolvedValue(null),
			addTaskComment: add,
			deleteTaskComment: del,
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', [
			'\t- 2026-10-21 21:22: comment 1',
			'\t- 2026-10-21 21:22: comment 2',
		]);
		expect(add).not.toHaveBeenCalled();
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
				origin: 'remote',
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

	it('BUG-COMMENT-NO-MASS-DELETE: adding a third Abyss comment does not delete existing TT comments', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValueOnce([
			{
				id: 'task1:comment 1',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'tt-1',
				body: 'comment 1',
			},
			{
				id: 'task1:comment 2',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 2',
				ticktickCommentId: 'tt-2',
				body: 'comment 2',
			},
		]);
		const del = vi.fn();
		const add = vi.fn().mockResolvedValue({ id: 'tt-3', title: 'comment 3' });
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([
				{ id: 'tt-1', title: 'comment 1' },
				{ id: 'tt-2', title: 'comment 2' },
			]),
			addTaskComment: add,
			deleteTaskComment: del,
		} as unknown as TickTickRestAPI;
		const lines = [
			'\t- 2026-10-21T11:25:21+07:00: comment 1',
			'\t- 2026-10-21T12:09:07+07:00: comment 2',
			'\t- 2026-10-21T12:30:00+07:00: comment 3',
		];
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', lines);
		expect(del).not.toHaveBeenCalled();
		expect(add).toHaveBeenCalledTimes(1);
	});

	it('BUG-COMMENT-TT-AHEAD-NO-DELETE: TickTick-only comment is not deleted on push before pull', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		const del = vi.fn();
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([
				{ id: 'tt-1', title: 'comment 1' },
				{ id: 'tt-2', title: 'from ticktick app' },
			]),
			addTaskComment: vi.fn(),
			deleteTaskComment: del,
		} as unknown as TickTickRestAPI;
		listMaps.mockResolvedValue([
			{
				id: 'task1:comment 1',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'tt-1',
				body: 'comment 1',
			},
		]);
		const lines = ['\t- 2026-10-21T11:25:21+07:00: comment 1'];
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', lines);
		expect(del).not.toHaveBeenCalled();
	});

	it('BUG-COMMENT-NO-MASS-DELETE: empty GET must not delete mapped TT comments', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValueOnce([
			{
				id: 'task1:comment 1',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'comment 1',
				ticktickCommentId: 'tt-1',
				body: 'comment 1',
			},
		]);
		const del = vi.fn();
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([]),
			addTaskComment: vi.fn().mockResolvedValue({ id: 'tt-new', title: 'x' }),
			deleteTaskComment: del,
		} as unknown as TickTickRestAPI;
		const lines = ['\t- 2026-10-21T11:25:21+07:00: comment 1', '\t- brand new'];
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', lines);
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
		expect(add).toHaveBeenCalledWith('proj1', 'task1', 'only comment changed');
	});

	it('BUG-COMMENT-DUP-STAMP: does not POST when remote already has plain twin of vault stamp', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValue([]);
		const add = vi.fn();
		const del = vi.fn();
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([{ id: 'tt-plain', title: 'comment 1' }]),
			addTaskComment: add,
			deleteTaskComment: del,
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', ['\t- 2026-10-21 21:22: comment 1']);
		expect(add).not.toHaveBeenCalled();
	});

	it('BUG-COMMENT-DUP-STAMP: deletes stamped+plain remote pair keeping one by normalized key', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValue([]);
		const add = vi.fn();
		const del = vi.fn().mockResolvedValue(true);
		let remote = [
			{ id: 'tt-stamped', title: '2026-10-21 21:22: comment 1' },
			{ id: 'tt-plain', title: 'comment 1' },
		];
		const api = {
			getTaskComments: vi.fn(async () => remote),
			addTaskComment: add,
			deleteTaskComment: vi.fn(async (_p: string, _t: string, id: string) => {
				remote = remote.filter(c => c.id !== id);
				return del(_p, _t, id);
			}),
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', ['\t- 2026-10-21 21:22: comment 1']);
		expect(add).not.toHaveBeenCalled();
		expect(del).toHaveBeenCalledWith('proj1', 'task1', 'tt-stamped');
		expect(del).not.toHaveBeenCalledWith('proj1', 'task1', 'tt-plain');
		expect(remote).toEqual([{ id: 'tt-plain', title: 'comment 1' }]);
	});

	it('BUG-COMMENT-DUP-STAMP: content re-post uses plain title not vault stamp', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValue([
			{
				id: 'task1:updated',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'updated',
				ticktickCommentId: 'tt-old',
				body: 'updated',
				origin: 'vault',
			},
		]);
		const add = vi.fn().mockResolvedValue({ id: 'tt-new', title: 'updated' });
		const del = vi.fn().mockResolvedValue(true);
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([{ id: 'tt-old', title: 'stale other' }]),
			addTaskComment: add,
			deleteTaskComment: del,
		} as unknown as TickTickRestAPI;
		// Map id links remote; vault aliases overlap map ("updated") while remote title differs.
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', ['\t- 2026-10-21 21:22: updated']);
		expect(del).toHaveBeenCalledWith('proj1', 'task1', 'tt-old');
		expect(add).toHaveBeenCalledWith('proj1', 'task1', 'updated');
		expect(add.mock.calls.some((c: unknown[]) => String(c[2]).includes('2026-10-21'))).toBe(false);
	});

	it('BUG-COMMENT-DELETE-REPOST: syncAbyssCommentsToTickTick does not POST single mapped miss + empty GET', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValue([
			{
				id: 'task1:post104',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'post104-ttdelete',
				ticktickCommentId: 'c-deleted',
				body: 'post104-ttdelete',
				origin: 'vault',
			},
		]);
		const add = vi.fn().mockResolvedValue({ id: 'c-new', title: 'post104-ttdelete' });
		const getTaskComments = vi.fn().mockResolvedValue([]);
		const api = {
			getTaskComments,
			addTaskComment: add,
			deleteTaskComment: vi.fn(),
		} as unknown as TickTickRestAPI;
		const lines = ['\t- post104-ttdelete'];
		// Force network path: count 0 (after TT delete) so canSkip does not short-circuit.
		// Empty GET + one map → must not treat as vaultOnly create (live 2.0.86 re-POST).
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', lines, undefined, { remoteCommentCount: 0 });
		expect(getTaskComments).toHaveBeenCalled();
		expect(add).not.toHaveBeenCalled();
	});

	it('TP-COMMENT-TT-DELETE #104: API-seed key-match without taskCommentMap upserts the TickTick id and does not POST', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValue([]);
		const upsert = upsertCommentMap as unknown as ReturnType<typeof vi.fn>;
		upsert.mockClear();
		const add = vi.fn().mockResolvedValue({ id: 'c-repost', title: 'post288-ttdelete-seed' });
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([
				{ id: '432b67b390c34e8db8d29585', title: 'post288-ttdelete-seed' },
			]),
			addTaskComment: add,
			deleteTaskComment: vi.fn(),
		} as unknown as TickTickRestAPI;
		// Live 2.0.88 box: API POST seed + matching vault bullet, no Dexie row.
		// Equal-key link must remember the TickTick id. It must not create another comment.
		await syncAbyssCommentsToTickTick(
			api,
			'6adb91418f08640fc34e86f5',
			'inbox133906430',
			['\t- post288-ttdelete-seed'],
			undefined,
			{ remoteCommentCount: 1 },
		);
		expect(add).not.toHaveBeenCalled();
		expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
			taskId: '6adb91418f08640fc34e86f5',
			projectId: 'inbox133906430',
			ticktickCommentId: '432b67b390c34e8db8d29585',
			origin: 'remote',
		}));
	});

	it('TP-COMMENT-TT-DELETE #104: after that link, TT delete does not re-POST the vault bullet', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		const taskId = '6adb91418f08640fc34e86f5';
		const projectId = 'inbox133906430';
		const title = 'post288-ttdelete-seed';
		const lines = [`\t- ${title}`];
		listMaps.mockResolvedValue([]);
		const upsert = upsertCommentMap as unknown as ReturnType<typeof vi.fn>;
		upsert.mockClear();
		const add = vi.fn().mockResolvedValue({ id: '6adc431e0ab39382ed69db12', title });
		const getTaskComments = vi.fn()
			.mockResolvedValueOnce([{ id: '432b67b390c34e8db8d29585', title }])
			.mockResolvedValueOnce([{ id: '432b67b390c34e8db8d29585', title }]);
		const api = {
			getTaskComments,
			addTaskComment: add,
			deleteTaskComment: vi.fn(),
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(api, taskId, projectId, lines, undefined, { remoteCommentCount: 1 });
		expect(add).not.toHaveBeenCalled();
		const linked = upsert.mock.calls[0]?.[0] as { ticktickCommentId?: string } | undefined;
		expect(linked?.ticktickCommentId).toBe('432b67b390c34e8db8d29585');

		// API DELETE → []. Count 0 forces the network path (idle skip must not hide a re-POST).
		listMaps.mockResolvedValue([linked]);
		getTaskComments.mockReset();
		getTaskComments.mockResolvedValue([]);
		add.mockClear();
		await syncAbyssCommentsToTickTick(api, taskId, projectId, lines, undefined, { remoteCommentCount: 0 });
		expect(getTaskComments).toHaveBeenCalled();
		expect(add).not.toHaveBeenCalled();
	});

	it('GAP-COMMENT-EDIT: one vault-origin key change updates the TickTick comment in place', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		const previous = {
			id: 'task1:old text',
			taskId: 'task1',
			projectId: 'proj1',
			fingerprint: 'old text',
			ticktickCommentId: 'tt-keep',
			body: 'old text',
			origin: 'vault' as const,
		};
		listMaps.mockResolvedValue([previous]);
		const upsert = upsertCommentMap as unknown as ReturnType<typeof vi.fn>;
		upsert.mockClear();
		upsert.mockImplementation(async (row: unknown) => {
			listMaps.mockResolvedValue([row]);
		});
		let remote = [{ id: 'tt-keep', title: 'old text' }];
		const update = vi.fn(async () => {
			remote = [{ id: 'tt-keep', title: 'new text' }];
			return { id: 'tt-keep', title: 'new text' };
		});
		const add = vi.fn();
		const del = vi.fn().mockResolvedValue(true);
		const api = {
			getTaskComments: vi.fn(async () => remote),
			addTaskComment: add,
			deleteTaskComment: del,
			updateTaskComment: update,
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', ['\t- new text']);
		expect(update).toHaveBeenCalledWith('proj1', 'task1', 'tt-keep', 'new text');
		expect(add).not.toHaveBeenCalled();
		expect(del).not.toHaveBeenCalled();
		expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
			ticktickCommentId: 'tt-keep',
			body: 'new text',
			origin: 'vault',
		}));
		upsert.mockReset();
		upsert.mockResolvedValue(undefined);
	});

	it('GAP-COMMENT-EDIT: linked map whose remote title differs uses PUT and keeps the comment id', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValue([
			{
				id: 'task1:updated',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'updated',
				ticktickCommentId: 'tt-old',
				body: 'updated',
				origin: 'vault',
			},
		]);
		const upsert = upsertCommentMap as unknown as ReturnType<typeof vi.fn>;
		upsert.mockClear();
		let remote = [{ id: 'tt-old', title: 'stale other' }];
		const update = vi.fn(async () => {
			remote = [{ id: 'tt-old', title: 'updated' }];
			return { id: 'tt-old', title: 'updated' };
		});
		const add = vi.fn();
		const del = vi.fn().mockResolvedValue(true);
		const api = {
			getTaskComments: vi.fn(async () => remote),
			addTaskComment: add,
			deleteTaskComment: del,
			updateTaskComment: update,
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', ['\t- 2026-10-21 21:22: updated']);
		expect(update).toHaveBeenCalledWith('proj1', 'task1', 'tt-old', 'updated');
		expect(add).not.toHaveBeenCalled();
		expect(del).not.toHaveBeenCalled();
	});

	it('GAP-COMMENT-EDIT: failed PUT falls back to delete+add', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValue([
			{
				id: 'task1:updated',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'updated',
				ticktickCommentId: 'tt-old',
				body: 'updated',
				origin: 'vault',
			},
		]);
		const add = vi.fn().mockResolvedValue({ id: 'tt-new', title: 'updated' });
		const del = vi.fn().mockResolvedValue(true);
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([{ id: 'tt-old', title: 'stale other' }]),
			addTaskComment: add,
			deleteTaskComment: del,
			updateTaskComment: vi.fn().mockResolvedValue(null),
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', ['\t- 2026-10-21 21:22: updated']);
		expect(del).toHaveBeenCalledWith('proj1', 'task1', 'tt-old');
		expect(add).toHaveBeenCalledWith('proj1', 'task1', 'updated');
	});

	it('GAP-COMMENT-EDIT: a remote-origin comment is not overwritten by a new vault bullet', async () => {
		const S = getSettings() as Record<string, unknown>;
		Object.assign(S, { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		listMaps.mockResolvedValue([
			{
				id: 'task1:from phone',
				taskId: 'task1',
				projectId: 'proj1',
				fingerprint: 'from phone',
				ticktickCommentId: 'tt-phone',
				body: 'from phone',
				origin: 'remote',
			},
		]);
		const update = vi.fn();
		const add = vi.fn().mockResolvedValue({ id: 'tt-new', title: 'vault only' });
		const del = vi.fn().mockResolvedValue(true);
		const api = {
			getTaskComments: vi.fn().mockResolvedValue([{ id: 'tt-phone', title: 'from phone' }]),
			addTaskComment: add,
			deleteTaskComment: del,
			updateTaskComment: update,
		} as unknown as TickTickRestAPI;
		await syncAbyssCommentsToTickTick(api, 'task1', 'proj1', ['\t- vault only']);
		expect(update).not.toHaveBeenCalled();
		expect(del).not.toHaveBeenCalled();
		expect(add).toHaveBeenCalledWith('proj1', 'task1', 'vault only');
	});
});
