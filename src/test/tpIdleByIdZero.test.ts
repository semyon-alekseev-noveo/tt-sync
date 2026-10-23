/**
 * TP-IDLE-BYID-ZERO / #98 — quiet sync must not probe getTaskById for:
 * - project-scheme parents already in the Dexie/`updated` batch
 * - empty vault parent vs Dexie scheme parent (not a real parent edit)
 * - list-move when line projectId already equals Dexie
 */
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
vi.mock('@/sync/vault-io', () => ({
	commitFrontMatter: vi.fn(),
	commitVaultText: vi.fn(),
	readNoteForWrite: vi.fn(async () => ''),
	syncRead: vi.fn(async () => ''),
}));
vi.mock('@/services/writeTrace', () => ({ traceWrite: vi.fn() }));

import { getAllProjects } from '@/db/projects';
import { ProjectSchemeService } from '@/services/ProjectSchemeService';
import { vaultParentMeaningfullyChanged } from '@/syncScope';
import type { ITask } from '@/api/types/Task';

const PARENT = 'parent-tt-id';
const NOTE = '10 Projects/pilot-project.md';

function appWith(note: TFile) {
	return {
		vault: {
			getAbstractFileByPath: (p: string) => (p === NOTE ? note : null),
			getMarkdownFiles: () => [note],
			createFolder: vi.fn(),
			create: vi.fn(),
			rename: vi.fn(),
		},
		metadataCache: {
			getFileCache: () => ({ frontmatter: { tags: ['system/project'], ticktick_id: PARENT, status: 'active' } }),
			getFirstLinkpathDest: () => null,
		},
		fileManager: { renameFile: vi.fn() },
	};
}

describe('TP-IDLE-BYID-ZERO', () => {
	beforeEach(() => {
		Object.assign(settings, {
			projectSchemeEnabled: true,
			projectsFolder: '10 Projects',
			projectsListName: 'TTS-Projects',
			projectsListId: '',
			syncedLists: ['TTS-Projects'],
			projectTaskTags: ['project', 'obsidian'],
			projectSnapshot: {},
		});
		vi.mocked(getAllProjects).mockResolvedValue([
			{ id: 'inbox', name: 'TTS-Inbox' },
			{ id: 'proj', name: 'TTS-Projects' },
		] as never);
	});

	it('vaultParentMeaningfullyChanged: empty vault parent + scheme parent is not a change', () => {
		expect(vaultParentMeaningfullyChanged('', PARENT, { schemeParentForFile: PARENT })).toBe(false);
		expect(vaultParentMeaningfullyChanged(undefined, PARENT, { schemeParentForFile: PARENT })).toBe(false);
		expect(vaultParentMeaningfullyChanged('', PARENT, { schemeParentForFile: 'other' })).toBe(true);
		expect(vaultParentMeaningfullyChanged('a', 'b')).toBe(true);
		expect(vaultParentMeaningfullyChanged('a', 'a')).toBe(false);
	});

	it('ProjectScheme.run uses Dexie/updated parent and skips getTaskById', async () => {
		const note = new TFile(NOTE);
		const getTaskById = vi.fn();
		const plugin = {
			tickTickRestAPI: { getTaskById, updateTask: vi.fn(), createTask: vi.fn(), CloseTask: vi.fn(), OpenTask: vi.fn() },
			saveSettings: vi.fn(),
			taskParser: { isMarkdownTask: () => false, getTickTickId: () => undefined },
		};
		const scheme = new ProjectSchemeService(appWith(note) as never, plugin as never);
		const localParent = {
			id: PARENT,
			title: 'pilot-project',
			projectId: 'proj',
			parentId: '',
			tags: ['project', 'obsidian'],
			status: 0,
			content: '',
		} as ITask;

		await scheme.run([localParent]);

		expect(getTaskById).not.toHaveBeenCalled();
		expect(scheme.isParentId(PARENT)).toBe(true);
	});

	it('ProjectScheme.run GETs only when parent is missing from updated batch', async () => {
		const note = new TFile(NOTE);
		const remote = {
			id: PARENT,
			title: 'pilot-project',
			projectId: 'proj',
			parentId: '',
			tags: ['project', 'obsidian'],
			status: 0,
			content: '',
		} as ITask;
		const getTaskById = vi.fn().mockResolvedValue(remote);
		const plugin = {
			tickTickRestAPI: { getTaskById, updateTask: vi.fn(), createTask: vi.fn(), CloseTask: vi.fn(), OpenTask: vi.fn() },
			saveSettings: vi.fn(),
			taskParser: { isMarkdownTask: () => false, getTickTickId: () => undefined },
		};
		const scheme = new ProjectSchemeService(appWith(note) as never, plugin as never);

		await scheme.run([]); // no local batch entry

		expect(getTaskById).toHaveBeenCalledWith(PARENT, 'proj');
		expect(scheme.isParentId(PARENT)).toBe(true);
	});
});
