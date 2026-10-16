import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '@/settings';
import { mergeSettingsWithDefaults } from '@/settingsMerge';

describe('mergeSettingsWithDefaults', () => {
	it('keeps user GTD fields over defaults', () => {
		const onDisk = {
			syncedLists: ['TTS-Inbox', 'TTS-nextAction'],
			syncScopeFolders: ['00 Inbox/'],
			tagListMappings: [{ tag: 'type/next', list: 'TTS-nextAction' }],
			projectTemplatePath: '60 templates/MOC.md',
			token: 'secret-token',
			username: 'u',
			password: 'p',
		};
		const merged = mergeSettingsWithDefaults(onDisk);
		expect(merged.syncedLists).toEqual(onDisk.syncedLists);
		expect(merged.syncScopeFolders).toEqual(onDisk.syncScopeFolders);
		expect(merged.tagListMappings).toEqual(onDisk.tagListMappings);
		expect(merged.projectTemplatePath).toBe(onDisk.projectTemplatePath);
		expect(merged.token).toBe('secret-token');
		expect(merged.username).toBe('u');
		expect(merged.password).toBe('p');
	});

	it('fills missing keys from DEFAULT_SETTINGS', () => {
		const merged = mergeSettingsWithDefaults({ token: 't' });
		expect(merged.baseURL).toBe(DEFAULT_SETTINGS.baseURL);
		expect(merged.syncedLists).toEqual([]);
		expect(merged.token).toBe('t');
	});

	it('does not drop non-empty GTD arrays when merging defaults', () => {
		const merged = mergeSettingsWithDefaults({
			token: 't',
			syncedLists: ['TTS-Inbox'],
			tagListMappings: [{ tag: 'type/next', list: 'TTS-nextAction' }],
		});
		expect(merged.syncedLists).toEqual(['TTS-Inbox']);
		expect(merged.tagListMappings).toHaveLength(1);
	});

	it('migrates legacy SyncProject into syncedLists when absent', () => {
		const merged = mergeSettingsWithDefaults({ SyncProject: 'Work' });
		expect(merged.syncedLists).toEqual(['Work']);
	});
});
