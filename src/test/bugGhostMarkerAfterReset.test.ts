/**
 * BUG-GHOST-MARKER-AFTER-RESET (#290): after Reset (Dexie empty) + Synchronize,
 * vault ticktick_id whose TT id 404s must detach (%%tt-detached%%, text kept) —
 * never stay fake-live, never invent TT, never Apply once / strip checklist.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

vi.mock('obsidian', () => {
	class TFile {
		path: string;
		constructor(path: string) {
			this.path = path;
		}
	}
	class Notice {
		constructor(..._a: unknown[]) {}
	}
	return { TFile, Notice };
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

import { TFile } from 'obsidian';
import { getSettings } from '@/settings';
import { TaskParser } from '@/taskParser';
import { TaskModificationDetector } from '@/services/TaskModificationDetector';
import { NewFileMap } from '@/services/NewFileMap';
import { DETACH_MARK } from '@/detach';
import * as vaultIo from '@/sync/vault-io';

describe('BUG-GHOST-MARKER-AFTER-RESET', () => {
	const taskId = '6ad3324d80c8b04a254e8109';
	const filepath = '30 Tasks/301 Noveo_tasks/DON-253.md';

	beforeEach(() => {
		Object.assign(getSettings() as Record<string, unknown>, {
			syncNotes: true,
			abyssTasksFormat: true,
			syncAbyssCommentsViaApi: false,
			syncScopeFolders: ['30 Tasks/'],
			syncedLists: ['TTS-Inbox'],
			SyncTag: 'tts-test',
			checkPoint: 0,
			tagListMappings: [],
			tagMappings: [],
			syncMarkerTag: 'ticktick',
		});
		vi.restoreAllMocks();
	});

	it('scan: vault-only marker + TT 404 → detach (not leave fake-live; not wipe line)', async () => {
		const lineText = `- [?] Merge MR, run \`deploy_prod\` #tts-test #obsidian #inbox %%[ticktick_id:: ${taskId}]%%`;
		let fileContent = `${lineText}\n`;
		const file = new TFile(filepath);
		const deleteTaskFromSpecificFile = vi.fn().mockResolvedValue(undefined);
		const parser = new TaskParser({} as never, {} as never);
		const plugin = {
			taskParser: parser,
			fileMetadataService: {
				getFilepathForTask: async () => filepath,
				clearTaskFile: vi.fn().mockResolvedValue(undefined),
			},
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '2026-10-28T00:00:00.000+0000',
				addDatesToLine: (s: string) => s,
				areDatesChanged: () => false,
				addDateHolderToTask: () => undefined,
			},
			app: {
				vault: {
					getName: () => 'V',
					getAbstractFileByPath: () => file,
					cachedRead: async () => fileContent,
					read: async () => fileContent,
					modify: vi.fn(async (_f: unknown, next: string) => {
						fileContent = next;
					}),
				},
			},
			projectScheme: {
				ensurePushContext: vi.fn(),
				isParentTask: () => false,
				isParentId: () => false,
				enabled: () => false,
				lineDuplicatesProjectParent: () => false,
			},
			taskRepository: {
				loadTaskById: vi.fn().mockResolvedValue(undefined),
				getTaskCount: vi.fn().mockResolvedValue(0),
				upsertTask: vi.fn().mockResolvedValue(undefined),
				deleteTask: vi.fn().mockResolvedValue(undefined),
			},
			tickTickRestAPI: {
				getTaskById: vi.fn().mockResolvedValue(null),
			},
			fileOperation: { deleteTaskFromSpecificFile },
		};
		parser.plugin = plugin as never;

		vi.spyOn(vaultIo, 'commitVaultText').mockImplementation(async (_app, _f, _snap, next) => {
			fileContent = next;
			return { status: 'ok' } as never;
		});
		vi.spyOn(vaultIo, 'readNoteForWrite').mockImplementation(async () => fileContent);
		vi.spyOn(vaultIo, 'syncRead').mockImplementation(async () => fileContent);
		vi.spyOn(vaultIo, 'syncCachedRead').mockImplementation(async () => fileContent);

		const detector = new TaskModificationDetector(plugin.app as never, plugin as never);
		vi.spyOn(NewFileMap.prototype, 'init').mockImplementation(async function (this: NewFileMap) {
			(this as unknown as { fileLines: string[] }).fileLines = fileContent.split('\n');
			return undefined;
		});
		vi.spyOn(NewFileMap.prototype, 'getFileLines').mockImplementation(function (this: NewFileMap) {
			return (this as unknown as { fileLines: string[] }).fileLines?.join('\n') ?? fileContent;
		});
		vi.spyOn(NewFileMap.prototype, 'getTaskRecord').mockReturnValue({
			task: lineText,
			taskLines: [],
		} as never);

		const pending: Array<{ filepath: string }> = [];
		await detector.checkFileForModifications(filepath, pending as never, {
			skipOrphanVaultLineDeletes: true,
		});

		expect(pending).toHaveLength(0);
		expect(deleteTaskFromSpecificFile).not.toHaveBeenCalled();
		expect(plugin.tickTickRestAPI.getTaskById).toHaveBeenCalledWith(taskId, undefined);
		expect(fileContent).toContain(DETACH_MARK);
		expect(fileContent).not.toContain(`ticktick_id:: ${taskId}`);
		expect(fileContent).toContain('Merge MR, run `deploy_prod`');
	});

	it('scan.ts detaches vault-only TT-gone markers (BUG-GHOST-MARKER-AFTER-RESET)', () => {
		const src = readFileSync(
			join(__dirname, '../sync/vault-push/taskModification/scan.ts'),
			'utf8',
		);
		expect(src).toContain('BUG-GHOST-MARKER-AFTER-RESET');
		expect(src).toMatch(/detachInContent|detachVaultOnly/);
		expect(src).not.toMatch(/leave marker for re-link/);
	});
});
