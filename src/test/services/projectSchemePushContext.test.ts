import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => {
	class TFile { constructor(public path: string) {} }
	return { TFile, Notice: class { constructor(..._a: unknown[]) {} } };
});

import { TFile } from 'obsidian';

const settings: Record<string, unknown> = {};

vi.mock('@/settings', () => ({
	getSettings: () => settings,
	updateSettings: vi.fn(),
}));
vi.mock('@/db/projects', () => ({ getAllProjects: vi.fn() }));
vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import { getAllProjects } from '@/db/projects';
import { ProjectSchemeService } from '@/services/ProjectSchemeService';

const PARENT = '6ad1dc711befa8582aceadd7';
const NOTE = '10 Projects/TTS-PILOT- Phase C test.md';

function appWith(note: TFile) {
	return {
		vault: {
			getAbstractFileByPath: (p: string) => (p === NOTE ? note : null),
			getMarkdownFiles: () => [note],
		},
		metadataCache: {
			getFileCache: () => ({ frontmatter: { tags: ['system/project', 'system/moc'], ticktick_id: PARENT } }),
			getFirstLinkpathDest: () => null,
		},
	};
}

describe('project scheme push context', () => {
	beforeEach(() => {
		Object.assign(settings, {
			projectSchemeEnabled: true,
			projectsFolder: '10 Projects',
			projectsListName: 'TTS-Projects',
			projectsListId: '',
			syncedLists: ['TTS-Projects'],
			projectTaskTags: ['project', 'obsidian'],
		});
		vi.mocked(getAllProjects).mockResolvedValue([
			{ id: 'inbox', name: 'TTS-Inbox' },
			{ id: 'proj', name: 'TTS-Projects' },
		] as never);
	});

	it('resolveForFile is empty until the projects list is hydrated (file-save push path)', async () => {
		const note = new TFile(NOTE);
		const scheme = new ProjectSchemeService(appWith(note) as never, {} as never);
		expect(scheme.resolveForFile(NOTE)).toBeUndefined();
		await scheme.ensurePushContext();
		expect(scheme.resolveForFile(NOTE)).toEqual({ parentId: PARENT, listId: 'proj' });
		expect(scheme.isParentId(PARENT)).toBe(true);
	});

	it('does not route children when the projects list is outside syncedLists', async () => {
		settings.syncedLists = ['TTS-Inbox'];
		const note = new TFile(NOTE);
		const scheme = new ProjectSchemeService(appWith(note) as never, {} as never);
		await scheme.ensurePushContext();
		expect(scheme.resolveForFile(NOTE)).toBeUndefined();
	});
});
