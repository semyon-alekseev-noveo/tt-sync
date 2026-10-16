import { describe, expect, it } from 'vitest';
import { applyLogin, loginPatch } from '@/loginSettings';
import { DEFAULT_SETTINGS, type ITickTickSyncSettings } from '@/settings';

const saved = {
	...DEFAULT_SETTINGS,
	syncedLists: ['Work', 'nextAction'],
	syncScopeFolders: ['00 Inbox/'],
	tagListMappings: [{ tag: 'type/next', list: 'nextAction' }],
	projectTemplatePath: '60 templates/MOC.md',
	projectsFolder: '20 Projects',
	newTasksFile: '30 Tasks/Tasks.md',
} as ITickTickSyncSettings;

describe('login settings merge', () => {
	it('only touches token, inbox and checkpoint', () => {
		expect(Object.keys(loginPatch({ inboxId: 'i1', token: 't' })).sort()).toEqual(['checkPoint', 'inboxID', 'inboxName', 'token']);
	});

	it('keeps GTD settings after a successful login', () => {
		const out = applyLogin(saved, { inboxId: 'i1', token: 't' });
		expect(out.token).toBe('t');
		for (const k of ['syncedLists', 'syncScopeFolders', 'tagListMappings', 'projectTemplatePath', 'projectsFolder', 'newTasksFile'] as const) {
			expect(out[k]).toEqual(saved[k]);
		}
	});

	it('keeps GTD settings after a failed login (null token)', () => {
		const out = applyLogin(saved, { inboxId: null, token: null });
		expect(out.syncedLists).toEqual(['Work', 'nextAction']);
		expect(out.tagListMappings).toEqual(saved.tagListMappings);
	});
});
