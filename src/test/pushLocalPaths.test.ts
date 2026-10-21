import { describe, it, expect, beforeEach } from 'vitest';
import { TFile } from 'obsidian';
import { pathsForPrePullPush } from '@/sync/vault-push/pushLocalPaths';
import { clearPluginWritesForTests, notePluginWrite } from '@/utils/editedSince';
import { getSettings } from '@/settings';

describe('BUG-COMMENT-ACTIVE-NOTE pathsForPrePullPush', () => {
	beforeEach(() => {
		clearPluginWritesForTests();
		Object.assign(getSettings() as Record<string, unknown>, {
			syncScopeFolders: ['00 Inbox/'],
		});
	});

	it('includes the active in-scope note even when mtime is not after since', () => {
		const path = '00 Inbox/2026-10-21.md';
		const file = Object.assign(new TFile(), {
			path,
			extension: 'md',
			stat: { mtime: 1000 },
		});
		const app = {
			vault: { getAbstractFileByPath: (p: string) => (p === path ? file : null) },
			workspace: {
				getActiveFile: () => file,
				activeEditor: { file },
			},
		};
		const since = 5000;
		const paths = pathsForPrePullPush(app as never, [path, '00 Inbox/other.md'], since);
		expect(paths).toEqual([path]);
	});

	it('manual sync includes every registered in-scope path', () => {
		const a = '00 Inbox/a.md';
		const b = '00 Inbox/b.md';
		const outScope = '20 Archive/x.md';
		const fileA = Object.assign(new TFile(), { path: a, extension: 'md', stat: { mtime: 100 } });
		const app = {
			vault: {
				getAbstractFileByPath: (p: string) => (p === a ? fileA : null),
			},
			workspace: { getActiveFile: () => null, activeEditor: undefined },
		};
		const paths = pathsForPrePullPush(app as never, [a, b, outScope], 999_999, { manualSync: true });
		expect(paths).toContain(a);
		expect(paths).toContain(b);
		expect(paths).not.toContain(outScope);
	});

	it('does not include active note when mtime qualifies it as a plugin-only write', () => {
		const path = '00 Inbox/2026-10-21.md';
		notePluginWrite(path, 9000);
		const file = Object.assign(new TFile(), {
			path,
			extension: 'md',
			stat: { mtime: 8000 },
		});
		const app = {
			vault: { getAbstractFileByPath: (p: string) => (p === path ? file : null) },
			workspace: { getActiveFile: () => file, activeEditor: { file } },
		};
		// Active file still included for comment sweep (mtime gate is bypassed for active leaf).
		const paths = pathsForPrePullPush(app as never, [path], 100);
		expect(paths).toContain(path);
	});
});
