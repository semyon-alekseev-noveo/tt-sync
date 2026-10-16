import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, type ITickTickSyncSettings } from '@/settings';
import {
	hydrateSettingsFromDisk,
	preserveGtdFromDisk,
} from '@/settingsMerge';

describe('preserveGtdFromDisk', () => {
	it('keeps non-empty syncedLists and tagListMappings from disk when memory is empty', () => {
		const memory = { ...DEFAULT_SETTINGS } as ITickTickSyncSettings;
		const disk = {
			syncedLists: ['TTS-Inbox', 'TTS-nextAction'],
			tagListMappings: [{ tag: 'type/next', list: 'TTS-nextAction' }],
			syncScopeFolders: ['00 Inbox/'],
			TickTickTasksFilePath: '30 Tasks/TickTick',
			projectSchemeEnabled: true,
		};
		const out = preserveGtdFromDisk(memory, disk);
		expect(out.syncedLists).toEqual(disk.syncedLists);
		expect(out.tagListMappings).toEqual(disk.tagListMappings);
		expect(out.syncScopeFolders).toEqual(disk.syncScopeFolders);
		expect(out.TickTickTasksFilePath).toBe('30 Tasks/TickTick');
		expect(out.projectSchemeEnabled).toBe(true);
	});

	it('restores from migrationSnapshot when arrays on disk were already wiped', () => {
		const memory = { ...DEFAULT_SETTINGS } as ITickTickSyncSettings;
		const disk = {
			syncedLists: [],
			tagListMappings: [],
			migrationSnapshot: {
				syncedLists: ['A'],
				tagListMappings: [{ tag: 'type/next', list: 'B' }],
			},
		};
		const out = preserveGtdFromDisk(memory, disk);
		expect(out.syncedLists).toEqual(['A']);
		expect(out.tagListMappings).toEqual([{ tag: 'type/next', list: 'B' }]);
	});
});

describe('hydrateSettingsFromDisk', () => {
	it('loads GTD from disk but keeps new login token from memory', () => {
		const disk = {
			syncedLists: ['Work'],
			tagListMappings: [{ tag: 'type/next', list: 'next' }],
			token: 'old-token',
			inboxID: 'old-inbox',
		};
		const memory = {
			...DEFAULT_SETTINGS,
			token: 'new-token',
			inboxID: 'new-inbox',
			inboxName: 'Inbox',
			checkPoint: 0,
		} as ITickTickSyncSettings;
		const out = hydrateSettingsFromDisk(memory, disk);
		expect(out.syncedLists).toEqual(['Work']);
		expect(out.tagListMappings).toEqual(disk.tagListMappings);
		expect(out.token).toBe('new-token');
		expect(out.inboxID).toBe('new-inbox');
	});
});
