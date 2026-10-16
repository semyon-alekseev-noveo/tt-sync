import { describe, expect, it } from 'vitest';
import {
	healSyncedLists, isListAllowed, isPathInFolders, lineListToText, migrateSyncedLists, normalizeSyncTag, parseLineList,
	pushScopeAllows, resolveProjectsList, resolveSyncedListIds, taskMatchesSyncLimit, unmatchedEntries,
} from '@/syncScope';

const lists = [
	{ id: 'i1', name: 'Inbox' },
	{ id: 'n1', name: 'nextAction' },
	{ id: 'k1', name: 'KB' },
];

describe('syncedLists allow-list', () => {
	it('empty or missing list allows nothing', () => {
		expect(resolveSyncedListIds([], lists).size).toBe(0);
		expect(resolveSyncedListIds(undefined, lists).size).toBe(0);
		expect(resolveSyncedListIds(['', '  '], lists).size).toBe(0);
	});

	it('matches by id or case-insensitive name', () => {
		expect([...resolveSyncedListIds(['nextaction', 'k1'], lists)].sort()).toEqual(['k1', 'n1']);
		expect(isListAllowed(['Inbox'], lists[0])).toBe(true);
		expect(isListAllowed(['Inbox'], lists[1])).toBe(false);
	});

	it('reports entries that match no list', () => {
		expect(unmatchedEntries(['Inbox', 'Typo'], lists)).toEqual(['Typo']);
	});

	it('follows a list renamed in TickTick', () => {
		const current = [{ id: 'n1', name: 'Next' }, lists[0]];
		expect(healSyncedLists(['nextAction', 'Inbox'], lists, current)).toEqual(['Next', 'Inbox']);
		expect(healSyncedLists(['Next', 'Inbox'], lists, current)).toBeUndefined();
		// entry for a list that vanished stays as is
		expect(healSyncedLists(['KB'], lists, current)).toBeUndefined();
	});

	it('migrates a single SyncProject when syncedLists is absent', () => {
		expect(migrateSyncedLists({ SyncProject: 'proj-1' }).syncedLists).toEqual(['proj-1']);
		expect(migrateSyncedLists({ SyncProject: '' }).syncedLists).toEqual([]);
		expect(migrateSyncedLists({}).syncedLists).toEqual([]);
	});

	it('keeps an existing syncedLists (even empty) untouched', () => {
		expect(migrateSyncedLists({ syncedLists: [], SyncProject: 'proj-1' }).syncedLists).toEqual([]);
		expect(migrateSyncedLists({ syncedLists: ['A'], SyncProject: 'proj-1' }).syncedLists).toEqual(['A']);
	});

	it('parses one entry per line', () => {
		expect(parseLineList(' a \n\nb\na\n')).toEqual(['a', 'b']);
		expect(lineListToText(['a', 'b'])).toBe('a\nb');
	});

	it('normalizes SyncTag like pull sync', () => {
		expect(normalizeSyncTag('TTS-Test')).toBe('tts-test');
		expect(normalizeSyncTag('type/next')).toBe('type-next');
		expect(normalizeSyncTag('')).toBeUndefined();
	});

	it('taskMatchesSyncLimit gates by list then tag/project', () => {
		const allowed = new Set(['p1']);
		expect(taskMatchesSyncLimit({ projectId: 'p2', tags: [] }, { allowedListIds: allowed })).toBe(false);
		expect(taskMatchesSyncLimit({ projectId: 'p1', tags: ['tts-test'] }, { allowedListIds: allowed, syncTag: 'tts-test' })).toBe(true);
		expect(taskMatchesSyncLimit({ projectId: 'p1', tags: ['other'] }, { allowedListIds: allowed, syncTag: 'tts-test' })).toBe(false);
	});

	it('resolveProjectsList prefers name over stale id', () => {
		const all = [
			{ id: 'live-projects', name: 'Projects' },
			{ id: 'tts-p', name: 'TTS-Projects' },
		];
		expect(resolveProjectsList(all, 'TTS-Projects', 'live-projects')?.id).toBe('tts-p');
		expect(resolveProjectsList(all, 'Projects', 'tts-p')?.id).toBe('live-projects');
	});
});

describe('syncScopeFolders push scope', () => {
	it('no folders = no restriction', () => {
		expect(pushScopeAllows('anything/x.md', [])).toBe(true);
		expect(pushScopeAllows('anything/x.md', undefined)).toBe(true);
		expect(pushScopeAllows('x.md', ['', '  '])).toBe(true);
	});

	it('prefix-matches whole folder names', () => {
		const f = ['00 Inbox/', '10 Projects'];
		expect(pushScopeAllows('00 Inbox/a.md', f)).toBe(true);
		expect(pushScopeAllows('10 Projects/sub/b.md', f)).toBe(true);
		expect(pushScopeAllows('00 Inboxer/a.md', f)).toBe(false);
		expect(pushScopeAllows('40 KB/a.md', f)).toBe(false);
		expect(pushScopeAllows('/00 Inbox/a.md', f)).toBe(true);
	});

	it('implicit folders (tasks folder, projects folder, hub file) always count', () => {
		const f = ['00 Inbox/'];
		expect(pushScopeAllows('30 Tasks/TickTick/Planned.md', f)).toBe(false);
		expect(pushScopeAllows('30 Tasks/TickTick/Planned.md', f, ['30 Tasks/TickTick'])).toBe(true);
		expect(pushScopeAllows('Hub/Tasks.md', f, ['Hub/Tasks.md'])).toBe(true);
		expect(pushScopeAllows('Hub/Tasks.md.bak', f, ['Hub/Tasks.md'])).toBe(false);
	});

	it('a single .md entry matches only that file; "/" matches the whole vault', () => {
		expect(isPathInFolders('a/b.md', ['a/b.md'])).toBe(true);
		expect(isPathInFolders('a/c.md', ['a/b.md'])).toBe(false);
		expect(isPathInFolders('any/thing.md', ['/'])).toBe(true);
	});
});
