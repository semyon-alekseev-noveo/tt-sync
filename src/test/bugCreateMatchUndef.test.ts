/**
 * BUG-CREATE-MATCH-UNDEF (#291): open-note create must not toast both
 * «New TickTick task created» and «Failed to add… reading 'match'».
 *
 * Root cause: editor-path write did not update fileMap; post-create
 * getTaskRecord(newId) → index -1 → abyssRegionEnd → indentWidth(undefined).match.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

vi.mock('obsidian', () => {
	const notices: string[] = [];
	class TFile {
		path: string;
		constructor(path: string) {
			this.path = path;
		}
	}
	class Notice {
		constructor(msg: string) {
			notices.push(String(msg));
		}
	}
	return { TFile, Notice, __notices: notices };
});

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('@/db/projects', () => ({
	getAllProjects: vi.fn().mockResolvedValue([{ id: 'in', name: 'TTS-Inbox' }]),
}));
vi.mock('@/abyssCommentSync', async importOriginal => {
	const actual = await importOriginal<typeof import('@/abyssCommentSync')>();
	return {
		...actual,
		syncAbyssCommentsToTickTick: vi.fn().mockResolvedValue(true),
		useAbyssCommentsApi: () => false,
	};
});

vi.mock('@/sync/vault-io', async importOriginal => {
	const actual = await importOriginal<typeof import('@/sync/vault-io')>();
	return {
		...actual,
		commitVaultText: vi.fn().mockResolvedValue({ status: 'ok' }),
		registerPendingMarkerTaskId: vi.fn(),
	};
});

import { getSettings } from '@/settings';
import { TaskParser } from '@/taskParser';
import { TaskModificationDetector } from '@/services/TaskModificationDetector';
import { NewFileMap } from '@/services/NewFileMap';
import { abyssRegionEnd, indentWidth } from '@/abyssFormat';
import { TFile } from 'obsidian';
import * as obsidian from 'obsidian';

function notices(): string[] {
	return (obsidian as unknown as { __notices: string[] }).__notices;
}

describe('BUG-CREATE-MATCH-UNDEF', () => {
	const filepath = '30 Tasks/301 Noveo_tasks/DON-253.md';
	const newId = '6aec900783c55223f9dcb7ad';
	const lineTxt =
		'- [ ] Remove `tcp-services` `3000` map… #obsidian #inbox #note/don-253';

	beforeEach(() => {
		notices().length = 0;
		Object.assign(getSettings() as Record<string, unknown>, {
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: false,
			syncScopeFolders: ['30 Tasks/'],
			syncedLists: ['TTS-Inbox'],
			SyncTag: 'tts-test',
			defaultProjectId: 'in',
			stopInjectingTickTickTag: true,
			tagListMappings: [],
			tagMappings: [],
			statusMappings: [],
			statusListMappings: [],
			taskLinksInObsidian: 'off',
			fileLinksInTickTick: 'noLink',
			checkPoint: 1,
		});
	});

	it('indentWidth / abyssRegionEnd tolerate missing line (no .match throw)', () => {
		expect(() => indentWidth(undefined as unknown as string)).not.toThrow();
		expect(indentWidth(undefined as unknown as string)).toBe(0);
		expect(() => abyssRegionEnd(['- [ ] a'], -1)).not.toThrow();
		expect(abyssRegionEnd(['- [ ] a'], -1)).toBe(-1);
	});

	it('open-note create: created Notice without Failed … match after editor write', async () => {
		const file = new TFile(filepath);
		const fileContent = `${lineTxt}\n`;
		const parser = new TaskParser({} as never, {} as never);
		const createdTask = {
			id: newId,
			projectId: 'in',
			title: 'Remove `tcp-services` `3000` map…',
			tags: ['obsidian', 'inbox', 'note/don-253'],
			status: 0,
			items: [],
			reminders: [],
			priority: 0,
			parentId: '',
			childIds: [],
			content: '',
			desc: '',
		};
		const plugin = {
			taskParser: parser,
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '2026-11-05T00:00:00.000+0000',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
				getEmptydateHolder: () => ({}),
			},
			app: {
				vault: {
					getName: () => 'V',
					getAbstractFileByPath: () => file,
					cachedRead: async () => fileContent,
					read: async () => fileContent,
					modify: vi.fn(),
				},
				workspace: { getLeavesOfType: () => [] },
				metadataCache: { getFileCache: () => null, getTags: () => ({}) },
			},
			projectScheme: {
				ensurePushContext: vi.fn(),
				isParentTask: () => false,
				isParentId: () => false,
				enabled: () => false,
				lineDuplicatesProjectParent: () => false,
				resolveForFile: () => undefined,
			},
			taskRepository: {
				loadTaskById: vi.fn().mockResolvedValue(undefined),
				loadTasksForFile: vi.fn().mockResolvedValue([]),
				getTaskCount: vi.fn().mockResolvedValue(10),
				upsertTask: vi.fn().mockResolvedValue(undefined),
				closeTask: vi.fn(),
			},
			tickTickRestAPI: {
				createTask: vi.fn().mockResolvedValue(createdTask),
				CloseTask: vi.fn(),
				getTaskById: vi.fn(),
			},
			fileOperation: {},
			tagService: undefined,
			saveSettings: vi.fn().mockResolvedValue(undefined),
		};
		parser.plugin = plugin as never;
		parser.app = plugin.app as never;

		const detector = new TaskModificationDetector(plugin.app as never, plugin as never);
		const fileMap = new NewFileMap(plugin.app as never, plugin as never, file);
		await fileMap.init(fileContent);

		const editor = {
			getLine: (n: number) => fileContent.split('\n')[n] ?? '',
			getValue: () => fileContent,
			getCursor: () => ({ line: 0, ch: 0 }),
		};

		await detector.addNewTask(lineTxt, 0, editor as never, { line: 0, ch: 0 }, fileMap);

		expect(plugin.tickTickRestAPI.createTask).toHaveBeenCalled();
		expect(plugin.taskRepository.upsertTask).toHaveBeenCalled();
		const joined = notices().join('\n');
		expect(joined.toLowerCase()).toContain('created');
		expect(joined.toLowerCase()).not.toMatch(/failed to add/);
		expect(joined).not.toContain("reading 'match'");
		expect(fileMap.getTaskIndex(newId)).toBeGreaterThanOrEqual(0);
	});

	it('newTasks.ts keeps fileMap in sync on editor-path create write', () => {
		const src = readFileSync(
			join(__dirname, '../sync/vault-push/taskModification/newTasks.ts'),
			'utf8',
		);
		expect(src).toContain('BUG-CREATE-MATCH-UNDEF');
		expect(src).toMatch(/replaceLines\(/);
		expect(src).toMatch(/created but|after TickTick create|vault marker/i);
	});
});
