/**
 * BUG-SYNC-OFF-REACTIVE-CREATE — Sync off (disk) must not create/update TT via reactive paths.
 * Pilot DON-253: syncEnabled=false on disk, journal edit- create+tag update still ran.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
	isAutomaticSyncEnabled,
	mayPushTickTickReactively,
	reconcileSyncEnabledFromDisk,
} from '@/sync/syncEnabled';
import { getSettings, setSettings, updateSettings, DEFAULT_SETTINGS } from '@/settings';

const SRC_ROOT = join(__dirname, '..');

describe('BUG-SYNC-OFF-REACTIVE-CREATE', () => {
	const snapshot = { ...getSettings() };

	beforeEach(() => {
		setSettings({ ...DEFAULT_SETTINGS, ...snapshot, syncEnabled: true, token: 't' });
	});

	afterEach(() => {
		setSettings(snapshot);
	});

	it('mayPushTickTickReactively blocks when master off unless Synchronize is running', () => {
		expect(mayPushTickTickReactively({ settings: { syncEnabled: false }, syncRunning: false })).toBe(false);
		expect(mayPushTickTickReactively({ settings: { syncEnabled: false }, syncRunning: true })).toBe(true);
		expect(mayPushTickTickReactively({ settings: { syncEnabled: true }, syncRunning: false })).toBe(true);
	});

	it('reconcileSyncEnabledFromDisk adopts disk false when memory still true', async () => {
		updateSettings({ syncEnabled: true });
		expect(isAutomaticSyncEnabled(getSettings())).toBe(true);
		const ok = await reconcileSyncEnabledFromDisk(async () => ({ syncEnabled: false }));
		expect(ok).toBe(false);
		expect(getSettings().syncEnabled).toBe(false);
	});

	it('reconcileSyncEnabledFromDisk skips disk read when memory already off', async () => {
		updateSettings({ syncEnabled: false });
		const loadDisk = vi.fn(async () => ({ syncEnabled: true }));
		const ok = await reconcileSyncEnabledFromDisk(loadDisk);
		expect(ok).toBe(false);
		expect(loadDisk).not.toHaveBeenCalled();
	});

	it('addNewTask and line/file modification scanners seal the kill switch', () => {
		const newTasks = readFileSync(join(SRC_ROOT, 'sync/vault-push/taskModification/newTasks.ts'), 'utf8');
		expect(newTasks).toMatch(/async addNewTask\([\s\S]*mayPushTickTickReactively/);

		const scan = readFileSync(join(SRC_ROOT, 'sync/vault-push/taskModification/scan.ts'), 'utf8');
		expect(scan).toMatch(/async checkLineForModifications\([\s\S]*mayPushTickTickReactively/);
		expect(scan).toMatch(/async checkFileForModifications\([\s\S]*mayPushTickTickReactively/);

		const service = readFileSync(join(SRC_ROOT, 'services/index.ts'), 'utf8');
		expect(service).toMatch(/async lineSettledCheck\([\s\S]*reconcileSyncEnabledFromDisk/);
		expect(service).toMatch(/async lineModifiedTaskCheck\([\s\S]*reconcileSyncEnabledFromDisk/);
		expect(service).toMatch(/async pushSettledActiveFile\([\s\S]*reconcileSyncEnabledFromDisk/);

		const main = readFileSync(join(SRC_ROOT, 'main.ts'), 'utf8');
		expect(main).toMatch(/onExternalSettingsChange\([\s\S]*syncEnabled === false/);
		expect(main).toMatch(/checkboxEventhandler\([\s\S]*reconcileSyncEnabledFromDisk/);
	});

	it('addNewTask does not createTask when syncEnabled is false and syncRunning is false', async () => {
		updateSettings({
			syncEnabled: false,
			abyssTasksFormat: true,
			syncScopeFolders: ['30 Tasks/'],
			token: 't',
		});
		const { TaskModificationDetector } = await import(
			'@/sync/vault-push/taskModification/TaskModificationDetector'
		);
		const { TaskParser } = await import('@/taskParser');
		const { NewFileMap } = await import('@/services/NewFileMap');
		const { TFile } = await import('obsidian');

		const file = Object.assign(new TFile(), { path: '30 Tasks/t.md', name: 't.md', basename: 't', extension: 'md' });
		const lineTxt = '- [ ] BUG-SYNC-OFF reactive create probe #obsidian #inbox';
		const fileContent = `${lineTxt}\n`;
		const parser = new TaskParser({} as never, {} as never);
		const createTask = vi.fn();
		const plugin = {
			syncRunning: false,
			taskParser: parser,
			dateMan: {
				parseDates: () => ({}),
				stripDatesFromLine: (s: string) => s,
				formatDateToISO: () => '2026-11-06T00:00:00.000+0000',
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
				upsertTask: vi.fn(),
			},
			tickTickRestAPI: { createTask },
			fileOperation: {},
			tagService: undefined,
			saveSettings: vi.fn(),
		};
		parser.plugin = plugin as never;
		parser.app = plugin.app as never;
		const detector = new TaskModificationDetector(plugin.app as never, plugin as never);
		const fileMap = new NewFileMap(plugin.app as never, plugin as never, file);
		await fileMap.init(fileContent);
		await detector.addNewTask(lineTxt, 0, null, null, fileMap);
		expect(createTask).not.toHaveBeenCalled();
	});
});
