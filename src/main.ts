import { RedoLog } from '@/redo/log';
import { makeAdapter, instrumentVault, instrumentApi } from '@/redo/obsidian';
import { RedoCommands } from '@/redo/commands';
import { tagRenames, renameTagsInText, folderOf } from '@/settingsMigration';
const snap = (x: { tagListMappings?: unknown; statusMappings?: unknown; tagMappings?: unknown; projectsFolder?: string }) => JSON.parse(JSON.stringify({ tagListMappings: x.tagListMappings ?? [], statusMappings: x.statusMappings ?? [], tagMappings: x.tagMappings ?? [], projectsFolder: x.projectsFolder })) as Parameters<typeof tagRenames>[0];
import { ProjectSchemeService } from '@/services/ProjectSchemeService';
import { isPathInPushScope } from '@/syncScope';
import { ensureSession } from '@/autoLogin';
import { loginPatch } from '@/loginSettings';
import { bumpProjectsVersion } from '@/projectsVersion';
import { getTick } from '@/api/tick_singleton_factory';
import '@/static/styles.css';

import { type Editor, type MarkdownFileInfo, MarkdownView, Notice, Plugin, TFolder } from 'obsidian';

//settings
import { getSettings, mergeDeviceLists, updateSettings } from './settings';
import { formatPluginLoadedNotice, formatSyncResultNotice, type SyncRunResult } from '@/sync/result';
import {
	buildPersistedSettings,
	hydrateSettingsFromDisk,
	mergeSettingsWithDefaults,
	preserveGtdFromDisk,
	wouldWipeGtdFromDisk,
} from '@/settingsMerge';

import { TickTickService } from '@/services';
//TickTick api
import { TickTickRestAPI } from '@/services/TicktickRestAPI';
//task parser
import { TaskParser } from './taskParser';
//cache task read and write
//file operation
import { FileOperation } from './fileOperation';

//import modals
import { SetDefaultProjectForFileModal } from './modals/DefaultProjectModal';
import { LatestChangesModal } from './modals/LatestChangesModal';
import { CleanupDeletedTasksModal } from './modals/CleanupDeletedTasksModal';
import { RecoverDeletedTasksModal } from './modals/RecoverDeletedTasksModal';

//import utils
import { isOlder } from './utils/version';
import { NOTABLE_CHANGES } from './notable-changes';
import { TickTickSyncSettingTab } from './ui/settings';
import { refreshSettingsStore } from '@/ui/settings/settingsstore';
import { MarkdownProcessor } from '@/query/MarkdownProcessor';
import store from '@/store';
import { DateMan } from '@/dateMan';
import { NewFileMap } from '@/services/NewFileMap';

//logging
import log from '@/utils/logger';

//database
import { initDB } from '@/db/dexie';
import { migrateFromDataJson } from '@/db/migrations';
import type { DeviceInfo } from '@/db/schema';

//NEW: Repository layer
import { FileMetadataService } from '@/repositories/FileMetadataService';
import { TaskRepository } from '@/repositories/TaskRepository';
import { FileTaskQueries } from '@/repositories/FileTaskQueries';
import { TaskCache } from '@/repositories/TaskCache';
import { ProjectGroupRepository } from '@/repositories/ProjectGroupRepository';

//NEW: Service layer
import { ProjectSyncService } from '@/services/ProjectSyncService';
import { EventHandlerService } from '@/services/EventHandlerService';
import { VaultSyncCoordinator } from '@/services/VaultSyncCoordinator';
import { TaskModificationDetector } from '@/services/TaskModificationDetector';
import { TaskDeletionHandler } from '@/services/TaskDeletionHandler';
import { TaskOperationsService } from '@/services/TaskOperationsService';
import { FolderSyncService } from '@/services/FolderSyncService';
import { FolderMigrationService } from '@/services/FolderMigrationService';
import { TagService } from '@/services/TagService';
import { SyncActivityIndicator } from '@/services/SyncActivityIndicator';

export default class TickTickSync extends Plugin {

	readonly service: TickTickService = new TickTickService(this);
	readonly syncActivity = new SyncActivityIndicator(this);
	readonly taskParser: TaskParser = new TaskParser(this.app, this);
	readonly fileOperation: FileOperation = new FileOperation(this.app, this);
	readonly fileMetadataService: FileMetadataService = new FileMetadataService();
	readonly dateMan: DateMan = new DateMan();
	readonly tagService: TagService = new TagService();

	readonly lastLines: Map<string, number> = new Map(); //lastLine object {path:line} is saved in lastLines map

	//NEW: Repository layer
	taskRepository!: TaskRepository;
	fileTaskQueries!: FileTaskQueries;
	taskCache!: TaskCache;
	projectGroupRepository!: ProjectGroupRepository;

	//NEW: Service layer
	projectSyncService!: ProjectSyncService;
	eventHandlerService!: EventHandlerService;
	vaultSyncCoordinator!: VaultSyncCoordinator;
	taskModificationDetector!: TaskModificationDetector;
	taskDeletionHandler!: TaskDeletionHandler;
	taskOperationsService!: TaskOperationsService;
	projectScheme!: ProjectSchemeService;
	folderSyncService!: FolderSyncService;
	folderMigrationService!: FolderMigrationService;

	tickTickRestAPI?: TickTickRestAPI;
	statusBar?: HTMLElement;
	private syncIntervalId?: number;
	private markdownProcessor?: MarkdownProcessor;
	/** False until loadSettings finishes; blocks premature saves during enable. */
	settingsReady = false;
	private settingsLoadPromise: Promise<void> | null = null;
	private syncUiRegistered = false;

	onload() {
		// addSettingTab must run synchronously in onload; awaiting loadSettings first left no gear if loadData hung.
		this.registerSettingsTab();
		this.app.workspace.onLayoutReady(async () => {
			await this.waitForObsidianSync();
			await this.ensureSettingsLoaded();
			try {
				await this.pluginLoad();
			} catch (error) {
				log.error('TickTickSync: deferred plugin load failed', error);
				new Notice('TickTickSync: sync features failed to start; settings remain available.');
			}
		});
	}

	/** Single flight: load data.json before pluginLoad / initDB can trigger saves. */
	ensureSettingsLoaded(): Promise<void> {
		if (!this.settingsLoadPromise) {
			this.settingsLoadPromise = this.completeSettingsLoad();
		}
		return this.settingsLoadPromise;
	}

	/** Register settings tab synchronously; load data.json afterward. */
	private registerSettingsTab(): void {
		try {
			this.addSettingTab(new TickTickSyncSettingTab(this.app, this));
		} catch (error) {
			log.error('TickTickSync: failed to register settings tab', error);
			const detail = error instanceof Error ? error.message : String(error);
			new Notice(`TickTickSync: settings tab failed (${detail}). Command: Open TickTickSync settings.`);
			this.addRibbonIcon('alert-triangle', 'TickTickSync settings failed to register', () => {
				new Notice(`TickTickSync settings tab error: ${detail}`);
			});
		}
		this.registerOpenSettingsCommand();
		this.registerSyncUi();
		void this.ensureSettingsLoaded();
	}

	/** Sync UI must register in onload; deferring to pluginLoad hid palette + ribbon until startup sync finished. */
	private registerSyncUi(): void {
		if (this.syncUiRegistered) {
			return;
		}
		this.syncUiRegistered = true;

		this.addCommand({
			id: 'tts-sync',
			name: 'Synchronize',
			callback: async () => {
				await this.ensureSettingsLoaded();
				await this.synchronizeNow();
			},
		});

		this.addRibbonIcon('sync', 'TickTickSync', async () => {
			await this.ensureSettingsLoaded();
			await this.synchronizeNow();
		});
	}

	private async completeSettingsLoad(): Promise<void> {
		try {
			const isSettingsLoaded = await this.loadSettings();
			refreshSettingsStore();
			if (!isSettingsLoaded) {
				new Notice('TickTickSync: settings had load errors; open plugin settings to review.');
			}
		} catch (error) {
			log.error('TickTickSync: failed to load settings', error);
			updateSettings(mergeSettingsWithDefaults({ version: this.manifest.version }), { persist: false });
			this.settingsReady = true;
			refreshSettingsStore();
			new Notice('TickTickSync: settings failed to load; using defaults — open plugin settings to review.');
		}
	}

	/** Opens this plugin's settings (gear fallback when UI does not show it). */
	openPluginSettings(): void {
		const setting = (this.app as typeof this.app & {
			setting?: { open: () => void; openTabById: (id: string) => void };
		}).setting;
		if (setting?.openTabById) {
			setting.open();
			setting.openTabById(this.manifest.id);
			return;
		}
		new Notice('Open Settings → scroll the left sidebar below Community plugins → TickTickSync.');
	}

	private registerOpenSettingsCommand(): void {
		this.addCommand({
			id: 'open-settings',
			name: 'Open TickTickSync settings',
			callback: () => this.openPluginSettings(),
		});
	}

	/**
	 * If Obsidian Sync is installed and enabled, wait until it finishes
	 * syncing before proceeding with plugin initialization.
	 */
	private async waitForObsidianSync(): Promise<void> {
		const app = this.app as unknown as {
			internalPlugins: { getPluginById(id: string): { enabled: boolean; instance?: unknown } | undefined };
			sync?: { isSyncing?: () => boolean; on?: (event: string, handler: () => void) => void; syncing?: boolean };
		};
		const internalPlugins = app.internalPlugins;
		if (!internalPlugins) return;

		const syncPlugin = internalPlugins.getPluginById('sync');
		if (!syncPlugin?.enabled) return;

		const syncService = app.sync ?? syncPlugin.instance as { isSyncing?: () => boolean; on?: (event: string, handler: () => void) => void; syncing?: boolean };
		if (!syncService) return;

		log.debug('Obsidian Sync detected, waiting for sync to complete...');

		return new Promise<void>((resolve) => {
			const isSyncing = (): boolean => {
				try {
					const fn = syncService.isSyncing;
					return typeof fn === 'function' ? fn() : (fn ?? syncService.syncing ?? false);
				} catch {
					return false;
				}
			};

			if (!isSyncing()) {
				log.debug('Obsidian Sync already idle, proceeding.');
				resolve();
				return;
			}

			const poll = () => {
				if (!isSyncing()) {
					log.debug('Obsidian Sync finished, proceeding.');
					resolve();
					return;
				}
				window.setTimeout(poll, 500);
			};
			poll();

			try {
				if (typeof syncService.on === 'function') {
					syncService.on('status-change', () => {
						if (!isSyncing()) {
							resolve();
						}
					});
				}
			} catch {
				// event listener not available, polling alone is fine
			}
		});
	}

	reloadInterval() {
		if (this.syncIntervalId) {
			window.clearInterval(this.syncIntervalId);
			this.syncIntervalId = undefined;
		}
		const timeout = getSettings().automaticSynchronizationInterval * 1000;
		if (timeout === 0) {
			return;
		}
		this.syncIntervalId = this.registerInterval(
			window.setInterval(() => { void this.scheduledSynchronization(false, 'scheduled'); }, timeout)
		);
	}

	// Configure logging.
	// reloadLogging() {
	// 	const options: LogOptions = {
	// 		minLevels: {
	// 			'': getSettings().logLevel,
	// 			ticktick: getSettings().logLevel
	// 		}
	// 	};
	// 	logging.configure(options);
	// }

	onunload() {
		super.onunload();
		// registerInterval handles cleanup of syncIntervalId automatically
		//NEW: Cleanup event handler
		this.eventHandlerService?.cleanup();
		//NEW: Clear cache
		this.taskCache?.clear();
		log.debug(`TickTickSync unloaded!`);
	}

	redo?: RedoLog;
	redoCommands?: RedoCommands;
	private migrating = false;
	private migrationAgain = false;
	/** Compare current mapping/folder settings with the last applied snapshot (kept in data.json, so
	 *  edits of data.json and changes from another device are caught too) and migrate notes. */
	async checkSettingsMigration() {
		if (this.migrating) { this.migrationAgain = true; return; }
		this.migrating = true; this.migrationAgain = false;
		try {
			const cur = snap(getSettings());
			const prev = (getSettings() as { migrationSnapshot?: ReturnType<typeof snap> }).migrationSnapshot;
			log.debug('settings migration check', prev?.projectsFolder, '->', cur.projectsFolder);
			if (prev && JSON.stringify(prev) === JSON.stringify(cur)) return;
			if (prev) await this.migrateSettingsChange(prev, cur).catch(e => log.error('Settings migration failed', e));
			updateSettings({ migrationSnapshot: cur } as never, { persist: false });
			await this.saveSettings();
		} finally { this.migrating = false; }
		if (this.migrationAgain) await this.checkSettingsMigration();
	}

	/** data.json changed outside (hand edit / another device). Never swap settings under a running sync. */
	syncRunning = false;
	private pendingExternal = false;
	async onExternalSettingsChange() {
		this.pendingExternal = true;
		if (!this.syncRunning) await this.applyExternalSettings();
	}
	async applyExternalSettings() {
		if (!this.pendingExternal) return;
		this.pendingExternal = false;
		const data = await this.loadData() as Record<string, unknown> | null;
		if (data) {
			updateSettings(hydrateSettingsFromDisk(getSettings(), data), { persist: false });
			refreshSettingsStore();
			await this.checkSettingsMigration();
		}
	}

	/** Tag/status/list mapping renamed or projects folder changed: carry existing notes over. */
	async migrateSettingsChange(prev: ReturnType<typeof snap>, next: ReturnType<typeof snap>) {
		const renames = tagRenames(prev, next);
		if (Object.keys(renames).length) {
			let n = 0;
			for (const f of this.app.vault.getMarkdownFiles()) {
				await this.app.vault.process(f, d => { const o = renameTagsInText(d, renames); if (o !== d) n++; return o; });
			}
			log.info('Tag mapping change migrated', renames, n, 'file(s)');
			new Notice(`TickTickSync: renamed ${Object.entries(renames).map(([a, b]) => `#${a} → #${b}`).join(', ')} in ${n} note(s)`);
		}
		const from = folderOf(prev), to = folderOf(next);
		if (from !== to && to) {
			const old = this.app.vault.getAbstractFileByPath(from);
			if (old instanceof TFolder) {
				let moved = 0;
				const files = this.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(from + '/'));
				for (const f of files) {
					const dest = to + f.path.slice(from.length);
					if (this.app.vault.getAbstractFileByPath(dest)) { log.warn('Projects folder move: target exists, kept', f.path); continue; }
					const dir = dest.slice(0, dest.lastIndexOf('/'));
					if (dir && !this.app.vault.getAbstractFileByPath(dir)) await this.app.vault.createFolder(dir).catch(() => undefined);
					await this.app.vault.rename(f, dest); moved++; // vault.rename: fileManager.renameFile may block on an 'Update links?' prompt
				}
				if (moved) new Notice(`TickTickSync: moved ${moved} project note(s) from ${from} to ${to}`);
				log.info(`Projects folder ${from} -> ${to}: moved ${moved}`);
			}
		}
	}

	async loadSettings() {
		this.settingsReady = false;
		let migrationOk = true;
		try {
			let data = await this.loadData() as Record<string, unknown> | null;
			if (!data) {
				data = { version: this.manifest.version };
			}
			const versionBefore = data.version as string | undefined;
			try {
				data = await this.migrateData(data);
			} catch (error) {
				migrationOk = false;
				log.error('Failed to migrate data:', error);
			}
			if (data?.TickTickTasksData) {
				// Old data migration is handled by initDB
			}
			const merged = mergeSettingsWithDefaults(data ?? {});
			updateSettings(merged, { persist: false });
			this.settingsReady = true;
			// Bump version on disk only — never rewrite all of data.json from memory on upgrade/enable.
			const versionAfter = merged.version;
			if (migrationOk && versionAfter !== versionBefore) {
				try {
					const disk = (await this.loadData()) as Record<string, unknown> | null;
					if (disk) {
						disk.version = versionAfter;
						await this.saveData(disk);
					}
				} catch (e) {
					log.warn('Failed to persist settings version on disk', e);
				}
			}
		} catch (error) {
			log.error('Failed to load data:( ' + String(error) + ')');
			updateSettings(mergeSettingsWithDefaults({ version: this.manifest.version }), { persist: false });
			this.settingsReady = true;
			return false;
		}
		return migrationOk;
	}

	async saveSettings(force = false) {
		if (!this.settingsReady && !force) {
			log.debug('Settings save skipped: load not finished');
			return;
		}
		// a hand edit of data.json is waiting for the running sync to end: don't overwrite it now
		if (this.pendingExternal && this.syncRunning) { log.info('Settings save deferred: external data.json change pending'); return; }
		try {
			let onDiskData: Record<string, unknown> | null = null;
			try {
				onDiskData = await this.loadData() as Record<string, unknown> | null;
			} catch (e) {
				log.warn('Could not read on-disk settings before save', e);
			}

			// Login / forced save can run before loadSettings finishes; never write DEFAULT_SETTINGS over data.json.
			if (!this.settingsReady && force && onDiskData) {
				updateSettings(hydrateSettingsFromDisk(getSettings(), onDiskData), { persist: false });
			}

			let inMemorySettings = getSettings();
			const preserved = preserveGtdFromDisk(inMemorySettings, onDiskData);
			if (JSON.stringify(preserved) !== JSON.stringify(inMemorySettings)) {
				updateSettings(preserved, { persist: false });
				inMemorySettings = getSettings();
			}

			if (wouldWipeGtdFromDisk(inMemorySettings, onDiskData)) {
				log.error(
					'Blocked saveSettings: in-memory GTD config is empty but data.json still has syncedLists/tagListMappings',
				);
				const healed = preserveGtdFromDisk(inMemorySettings, onDiskData);
				updateSettings(healed, { persist: false });
				refreshSettingsStore();
				return;
			}

			// Verify that the setting exists and is not empty
			if (inMemorySettings && Object.keys(inMemorySettings).length > 0) {
				const saveData = buildPersistedSettings(inMemorySettings, onDiskData);

				// Defensive merge: on-disk data.json may have been updated by
				// another device via Obsidian Sync. Merge devices so that entries
				// added by other instances are not lost.
				try {
					if (onDiskData?.devices && Array.isArray(onDiskData.devices)) {
						const mergedDevices = mergeDeviceLists(
							onDiskData.devices as DeviceInfo[],
							(inMemorySettings.devices || []) as DeviceInfo[],
						);
						saveData.devices = mergedDevices;
						getSettings().devices = mergedDevices;
					}
				} catch (e) {
					log.warn('Could not read on-disk settings for device merge', e);
				}

				await this.saveData(saveData);
				await this.checkSettingsMigration();
			} else {
				log.warn('Settings are empty or invalid, not saving to avoid data loss.');
			}
		} catch (error) {
			//Print or handle errors
			log.error('Error saving settings:', error);
		}
	}

	// return true of false
	/** Login at plugin start with data.json `username`/`password`; only when there is no token or it was rejected. */
	private async ensureLoggedIn(): Promise<boolean> {
		const s = getSettings();
		const res = await ensureSession({
			token: s.token,
			credentials: { username: s.username, password: s.password },
			validateToken: async () => {
				const api = getTick({ baseUrl: getSettings().baseURL, token: getSettings().token ?? '', checkPoint: getSettings().checkPoint });
				return !!(await api.getUserStatus());
			},
			login: async () => this.service.login(s.baseURL, s.username as string, s.password as string),
		});
		if (!res.ok) {
			if (res.reason === 'no-credentials') new Notice(`Please login from settings (or set username and password there).`);
			else new Notice(`TickTickSync: automatic login failed, check username and password in settings.`);
			return false;
		}
		if (res.loggedIn && res.info) {
			updateSettings(loginPatch(res.info), { persist: false }); // login fields only; saveSettings merges GTD from disk
			const api = getTick({ baseUrl: getSettings().baseURL, token: res.info.token ?? '', checkPoint: 0 });
			if (this.tickTickRestAPI && this.tickTickRestAPI.api) this.tickTickRestAPI.api = api;
			this.service.api = api;
			await this.saveSettings();
			log.info('Logged in automatically with stored credentials.');
		}
		return true;
	}

	// return true of false
	async initializePlugin(): Promise<boolean> {
		if (!(await this.ensureLoggedIn())) {
			return false;
		}

		// Load Dexie first as it's the source of truth
		await initDB();

		//NEW: Initialize repositories
		this.taskRepository = new TaskRepository();
		this.fileTaskQueries = new FileTaskQueries();
		this.taskCache = new TaskCache();
		this.projectGroupRepository = new ProjectGroupRepository();

		//NEW: Initialize services
		this.projectSyncService = new ProjectSyncService(this.app, this);
		this.folderSyncService = new FolderSyncService(this.app, this, this.projectGroupRepository);
		this.projectSyncService.setFolderSyncService(this.folderSyncService);
		this.folderMigrationService = new FolderMigrationService(this.app, this.folderSyncService);
		this.vaultSyncCoordinator = new VaultSyncCoordinator(this.app, this, this.folderSyncService);
		this.taskModificationDetector = new TaskModificationDetector(this.app, this, this.folderSyncService);
		this.taskDeletionHandler = new TaskDeletionHandler(this.app, this);
		this.taskOperationsService = new TaskOperationsService(this.app, this);
		this.projectScheme = new ProjectSchemeService(this.app, this);

		// Device ID and Label are now managed in the DB and loaded into memory during initDB
		// They are no longer stored in settings to prevent sync conflicts
		await this.tagService.loadFromDb();
		const isProjectsSaved = await this.saveProjectsToCache();
		if (!isProjectsSaved) {// invalid token or offline?
			this.tickTickRestAPI = undefined;
			new Notice(`TickTickSync plugin initialization failed, please check userid and password in settings.`);
			return false;
		}
		bumpProjectsVersion(); // list cache is filled: GTD settings reload the checkbox lists by themselves

		this.initializeModuleClass();
		//Create a backup folder to back up TickTick data
		try {
			//Back up all data before each startup
			if (!getSettings().skipBackup) {
				this.service.backup();
			}
		} catch (error) {
			log.error('error creating user data folder: ', error);
			new Notice(`Error creating user data folder`);
			return false;
		}
		//And now load the DB and sync it.
		const loadedSync = await this.service.synchronization(true, 'startup');
		await this.autoCleanupDeletedTasks();

		new Notice(formatPluginLoadedNotice(!!getSettings().skipBackup));
		if (!loadedSync.ok) new Notice(formatSyncResultNotice(loadedSync));
		return true;
	}

	initializeModuleClass() {
		// log.debug("initializeModuleClass")
		//initialize TickTick restapi
		if (!this.tickTickRestAPI) {
			// log.debug("API wasn't inited?")
			this.tickTickRestAPI = new TickTickRestAPI(this.app, this, null);
		}
	}

	async lineNumberCheck(): Promise<boolean> {
		const markDownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!markDownView) {
			return false;
		}

		const cursor = markDownView?.editor.getCursor();
		const line = cursor?.line;
		//const lineText = view.editor.getLine(line)
		//log.debug(line)
		//const fileName = view.file?.name
		const file = markDownView?.app.workspace.activeEditor?.file;
		const fileName = file?.name;
		const filepath = file?.path;

		if (typeof this.lastLines === 'undefined' || typeof this.lastLines.get(fileName as string) === 'undefined') {
			this.lastLines.set(fileName as string, line);
			return false;
		}

		//log.debug(`filename is ${fileName}`)
		if (this.lastLines.has(fileName as string) && line !== this.lastLines.get(fileName as string)) {
			const lastLine = this.lastLines.get(fileName as string);
			// if (this.settings.debugMode) {
			// 	log.debug('Line changed!', `current line is ${line}`, `last line is ${lastLine}`);
			// }

			//Perform the operation you want
			const lastLineText = markDownView.editor.getLine(lastLine as number);
			// log.debug(lastLineText)
			if (!(this.checkModuleClass())) {
				return false;
			}
			this.lastLines.set(fileName as string, line);

			return await this.service.lineSettledCheck(filepath as string, lastLineText, lastLine as number);
		} else {
			//log.debug('Line not changed');
		}
		return false;
	}

	async checkboxEventhandler(evt: MouseEvent, editor: Editor) {
		const target = evt.target as HTMLInputElement;
		const bOpenTask = target.checked;

		if (!target.classList.contains('task-list-item-checkbox')) {
			return;
		}

		// Checkbox in a file outside syncScopeFolders: do not touch TickTick.
		if (!isPathInPushScope(this.app.workspace.getActiveFile()?.path)) return;

		if (editor) {
			const mouse = (editor as unknown as { posAtMouse(evt: MouseEvent): { line: number; ch: number } }).posAtMouse(evt);
			const line = mouse.line; // Line where the click occurred
			const clickedText = editor.getLine(line); // Get the text at the clicked line
			if (this.taskParser.isMarkdownTask(clickedText)) {
				const taskId = this.taskParser.getTickTickId(clickedText);
				if (taskId) {
					if (bOpenTask) {
						await this.service.closeTask(taskId);
					} else {
						await this.service.openTask(taskId);
					}
				} else {
					const itemID = this.taskParser.getLineItemId(clickedText);
					if (itemID) {
						const markDownView = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (markDownView?.file) {
							const fileMap = new NewFileMap(this.app, this, markDownView.file);
							await fileMap.init();
							await this.syncActivity.runInline('Updating subtask…', async () => {
								await this.service.tickTickSync.handleTaskItem(clickedText, fileMap, line);
							});
						}
					}
				}
			}
		}
	}


	//return true
	checkModuleClass() {
		if (!getSettings().token) {
			new Notice(`Please login from settings.`);
			return false;
		}

		if (!this.service.initialized) {
			this.service.initialize();
		}
		if (this.tickTickRestAPI === undefined) {
			this.initializeModuleClass();
		}
		return true;
	}

	async setStatusBarText() {
		const markDownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!markDownView || !markDownView.file) {
			this.statusBar?.setText('');
			return;
		}

		const filepath = markDownView.file.path;
		let defaultProjectName = await this.fileMetadataService.getDefaultProjectNameForFilepath(filepath);
		if (!defaultProjectName) {
			if (filepath.startsWith('Inbox')) {
				defaultProjectName = 'Inbox';
			} else {
				defaultProjectName = 'No default Project';
			}
		}
		this.statusBar?.setText(defaultProjectName);

	}

	async scheduledSynchronization(fullSync: boolean = false, trigger: 'manual' | 'scheduled' | 'startup' = 'manual'): Promise<SyncRunResult> {
		if (!this.checkModuleClass()) {
			return { ok: false, error: 'TickTickSync is not ready.' };
		}

		await this.waitForObsidianSync();

		let result: SyncRunResult;
		try {
			result = await this.service.synchronization(fullSync, trigger);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			log.error('An error occurred: ', error);
			result = { ok: false, error: message };
		}
		if (result.ok) {
			await this.autoCleanupDeletedTasks();
		} else if (trigger !== 'manual') {
			new Notice(formatSyncResultNotice(result));
		}
		return result;
	}

	async autoCleanupDeletedTasks() {
		try {
			const days = getSettings().deletedTaskRetentionDays;
			const purged = await this.taskRepository.purgeOldDeletedTasks(days);
			if (purged > 0) {
				log.info(`Auto-cleanup: purged ${purged} deleted task(s) older than ${days} day(s).`);
			}
		} catch (error) {
			log.error('Auto-cleanup error:', error);
		}
	}


	// async oldCheckboxEventhandle(evt: MouseEvent) {
	// 	if (!(this.checkModuleClass())) {
	// 		return;
	// 	}
	//
	//
	// 	const target = evt.target as HTMLInputElement;
	// 	const bOpenTask = target.checked;
	// 	log.debug('Second: Checked: ', bOpenTask);
	//
	// 	//This breaks for subtasks if Tasks is installed. See: https://github.com/obsidian-tasks-group/obsidian-tasks/discussions/2685
	// 	//hence the else.
	// 	const taskElement = target.closest('div');
	// 	if (taskElement) {
	// 		const taskLine = taskElement.textContent;
	// 		const taskId = this.taskParser?.getTickTickId(taskLine);
	// 		if (taskId) {
	// 			// let task = this.taskParser?.convertTextToTickTickTaskObject(tas)
	// 			if (bOpenTask) {
	// 				log.debug('it\'s open, close it.');
	// 				this.tickTickSync?.closeTask(taskId);
	// 			} else {
	// 				log.debug('it\'s closed, open it.');
	// 				this.tickTickSync?.reopenTask(taskId);
	// 			}
	// 		}
	// 	} else {
	// 		log.debug('#### TickTick_id not found -- do it the hard way.');
	// 		//Start full-text search and check status updates
	// 		try {
	// 			log.debug('#### Full text modified??');
	// 			let file = this.app.workspace.getActiveFile();
	// 			let filePath = null;
	// 			if (file instanceof TFile) {
	// 				filePath = file.path;
	// 			}
	//
	// 			if (!await this.checkAndHandleSyncLock()) return;
	// 			await this.tickTickSync?.fullTextModifiedTaskCheck(filePath);
	// 			await this.unlockSynclock();
	// 		} catch (error) {
	// 			log.error(`An error occurred while check modified tasks in the file: ${error}`);
	// 			await this.unlockSynclock();
	//
	// 		}
	// 	}
	// }

	async saveProjectsToCache(): Promise<boolean> {
		if (!this.checkModuleClass()) {
			return false;
		}
		let result = false;
		const startTime = performance.now();
		log.debug(`TickTick saveProjectsToCache started at ${new Date().toLocaleString()}`);
		try {
			result = !!(await this.service.saveProjectsToCache());
		} catch (error) {
			log.error(`An error in saveProjectsToCache occurred:( ${String(error)}`);
			new Notice(`An error in saveProjectsToCache occurred: ${String(error)}`);
		}
		const endTime = performance.now();
		log.debug(`TickTick saveProjectsToCache completed at ${new Date().toLocaleString()}, took ${(endTime - startTime).toFixed(2)} ms`);
		return result;
	}

	private async pluginLoad() {
		if (!this.redo) {
			// write-ahead redo log (.tickticksync/journal), see src/redo
			this.redo = new RedoLog(makeAdapter(this.app));
			instrumentVault(this.app, this.redo);
			instrumentApi(this, this.redo);
			this.redoCommands = new RedoCommands(this, this.redo);
			this.redoCommands.register();
			void this.redo.prune(getSettings().redoLogRetentionDays ?? 30).catch(e => log.warn('redo log prune failed', e));
		}
		log.setLevel(getSettings().logLevel as 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent')
		log.info(`loading plugin "${this.manifest.name}" v${this.manifest.version}`);



		try {
			updateSettings({ vaultName: this.app.vault.getName() }, { persist: false });
			await this.initializePlugin();
		} catch (error) {
			log.error('API Initialization Failed.( ' + String(error) + ')');
		}

		store.service.set(this.service);
		this.markdownProcessor = new MarkdownProcessor(this);
		this.markdownProcessor.activate();


		// //Used for testing adhoc code.
		// this.addRibbonIcon('check', 'Tts test', async (evt: MouseEvent) => {
		// 	// Nothing to see here right now.
		// 	const vaultId = this.app.vault.getName();
		// 	log.debug(`Vault ID: ${vaultId}`);
		// 	this.dumpDB();
		// });

		//Used for testing adhoc code.
		// this.addRibbonIcon('dice', 'Tts test 2', async (evt: MouseEvent) => {
		// 	// Nothing to see here right now.
		// 	// for (const file of this.app.vault.getMarkdownFiles()) {
		// 	// 	if (file.path.includes("List 1")) {
		// 	// 		const fileMap = new NewFileMap(this.app, this, file);
		// 	// 		await fileMap.init();
		// 	// 		const taskRecord = fileMap.getTaskRecord("6a08733c9086963234d145a5")
		// 	// 		const taskItems = fileMap.getTaskItems("6a08733c9086963234d145a5")
		// 	// 		log.debug("record", taskRecord)
		// 	// 		log.debug("items", taskItems)
		// 	// 	}
		// 	// }
		// 	// Example Usage inside a command or event:
		// 	// const targetFolder = 'Folder 1';
		// 	//
		// 	// // Get every file in the vault and filter by path prefix
		// 	// const allFilesInFolder = this.app.vault.getFiles().filter(file =>
		// 	// 	file.path.startsWith(targetFolder + '/')
		// 	// );
		// 	//
		// 	// for (const file of allFilesInFolder) {
		// 	// 	const activeFile = this.app.vault.getFileByPath(file)
		// 	// 	const tasks = await getTasksWithChildren(activeFile, this.app);
		// 	// 	// const fm = new NewFileMap(this.app, this, activeFile);
		// 	// 	// await fm.init();
		// 	// 	// const tasks = fm.getTasks();
		// 	//
		// 	// 	log.debug("In File: ", file.name, "\nStructured Tasks:\n", JSON.stringify(tasks,null, 4));
		// 	// }
		// 	generateDeviceId();
		//
		//
		// });


		this.registerEvents();
		this.reloadInterval();

		// set default project for TickTick task in the current file
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'tts-default-project-for-file',
			name: 'Set default ticktick project for current file',
			editorCallback: (editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
				if (!view || !view.file) {
					new Notice(`No active file.`);
					return;
				}
				const filepath = view.file.path;
				new SetDefaultProjectForFileModal(this.app, this, filepath);
			}
		});
		this.addCommand({
			id: 'tts-delete-permanent',
			name: 'Permanently delete tasks',
			callback: async () => {
				const deletedTasks = await this.taskRepository.getDeletedTasks();
				if (deletedTasks.length === 0) {
					new Notice('No deleted tasks found.');
					return;
				}
				const modal = new CleanupDeletedTasksModal(this.app, deletedTasks);
				const selected = await modal.showModal();
				if (selected.length > 0) {
					await this.taskRepository.hardDeleteTasks(selected);
					new Notice(`Permanently deleted ${selected.length} task(s).`);
				}
			}
		});

		this.addCommand({
			id: 'tts-recover-tasks',
			name: 'View and recover deleted tasks',
			callback: async () => {
				const deletedTasks = await this.taskRepository.getDeletedTasks();
				if (deletedTasks.length === 0) {
					new Notice('No deleted tasks found.');
					return;
				}
				const modal = new RecoverDeletedTasksModal(this.app, this, deletedTasks);
				await modal.showModal();
			}
		});

		//display default project for the current file on status bar
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBar = this.addStatusBarItem();
	}

	private async synchronizeNow() {
		const result = await this.scheduledSynchronization();
		new Notice(formatSyncResultNotice(result));
	}

	private registerEvents() {
		//NEW: Use EventHandlerService to manage all event registration
		this.eventHandlerService = new EventHandlerService(this.app, this);
		this.eventHandlerService.registerAll();
	}

	private async migrateData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
		if (!data) return data;

		//We're going to handle data structure conversions here.
		//NB: The version that goes in the literal is the current version.
		if ((!data.version) || (isOlder(data.version as string, '1.0.10'))) {
			//get rid of username and password. we don't need them no more.
			delete data.username;
			delete data.password;
		}
		if ((!data.version) || (isOlder(data.version as string, '1.0.36'))) {
			//default to AND because that's what we used to do:
			data.tagAndOr = 1;
		}

		//BIG Change. BIG I tell you!
		if ((!data.version) || isOlder(data.version as string, '2.0.0')) {
			log.debug('Entering 1.1.17 migration block');
			// Migrate from legacy data.json repository to Dexie-based repository
			data.__migratedDBData = migrateFromDataJson(data);
			log.debug('migrateFromDataJson completed');
		}
		if ((!data.version) || (isOlder(data.version as string, '2.0.5'))) {
			log.debug('Entering 2.0.5 migration block');
			// New in 2.0.5: opt-in settings for the "#ticktick" control tag.
			// Historically the plugin force-injected "ticktick" onto every
			// synced task's TickTick tags. Default off (false) preserves the
			// legacy behavior for existing installs.
			data.stopInjectingTickTickTag = false;
			data.stripTickTickTagOnReset = false;
		}

		//Build notable changes from the single source of truth
		const notableChanges: string[][] = [];
		const currentVersion = (data.version as string) || '0.0.0';
		for (const change of NOTABLE_CHANGES) {
			if (!data.version || isOlder(currentVersion, change.version)) {
				notableChanges.push([change.title, change.description, change.anchor]);
			}
		}

		if (notableChanges.length > 0) {
			log.debug('Calling LatestChangesModal with', notableChanges.length, 'items');
			await this.LatestChangesModal(notableChanges);
			log.debug('LatestChangesModal returned');
		} else {
			log.debug('Skipping LatestChangesModal - no notable changes');
		}

		//Update the version number. It will save me headaches later.

		if ((!data.version) || (isOlder(data.version as string, this.manifest.version))) {
			log.debug('Updating version number to ', this.manifest.version);
			data.version = this.manifest.version;
			// No saveSettings() here: in-memory settings are still DEFAULT_SETTINGS at this point and would
			// overwrite data.json (syncedLists, tagListMappings, token...). loadSettings() saves the merged data.
		}

		return data;
	}

	private async LatestChangesModal(notableChanges: string[][]) {
		return await new Promise<boolean>(resolve => {
			const myModal = new LatestChangesModal(this.app, notableChanges, (result) => {
				resolve(result);
			});
			myModal.open();
		});

	}
	private dumpDB() {
		let dbName = (getSettings().vaultName || '')  + "TickTickSync";
		const request = indexedDB.open(dbName);

		request.onsuccess = async (event) => {
			const db = (event.target as EventTarget & { result: IDBDatabase }).result;
			const storeNames = Array.from(db.objectStoreNames);
			const exportData: Record<string, unknown> = {};

			// Process all stores
			for (const storeName of storeNames) {
				exportData[storeName] = await new Promise((resolve) => {
					const transaction = db.transaction([storeName], "readonly");
					const store = transaction.objectStore(storeName);
					const allItems = store.getAll();

					allItems.onsuccess = () => resolve(allItems.result);
					allItems.onerror = () => resolve([]); // Handle empty/error stores
				});
			}

			// Create and download JSON file
			const jsonString = JSON.stringify(exportData, null, 2);
			const blob = new Blob([jsonString], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = createEl("a");

			a.href = url;
			a.download = `${dbName}_full_dump.json`;
			a.click();

			URL.revokeObjectURL(url);
			log.debug(`Exported ${storeNames.length} stores to ${dbName}_full_dump.json`);
			db.close();
		};

		request.onerror = (e: Event) => console.error("Database failed to open:", (e.target as IDBRequest)?.error);

	}


}




