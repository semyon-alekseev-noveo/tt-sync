import type { DeviceInfo } from '@/db/schema';
import { DEFAULT_BKUP_FOLDER } from '@/ui/settings/settingsUxNames';

export interface TaskDisplayModeSettings {
	link: 'show' | 'hide' | 'hover';
	id: boolean;
	tag: boolean;
}

export interface ITickTickSyncSettings {

	baseURL: string;
	token?: string;
	// Optional stored credentials (plaintext in data.json, opt-in): when set, the plugin logs in at start
	// if there is no token or the token was rejected. Never required: login from settings still works.
	username?: string;
	password?: string;
	version?: string;

	automaticSynchronizationInterval: number;
	/**
	 * UX-SET-SYNC-MASTER-OFF: when false, automatic/reactive sync is off (startup, interval,
	 * open-note, file-modify, checkbox→TT). Explicit Synchronize still runs. Default true.
	 * Interval 0 only disables the timer — use this for a real kill switch.
	 */
	syncEnabled: boolean;
	/** When false (default), scheduled interval sync runs without the full-sync progress modal. */
	showSyncProgressOnScheduledSync: boolean;
	enableFullVaultSync: boolean;
	tagAndOr: number; // 1 == And ; 2 == Or
	SyncProject: string;
	SyncTag: string;
	// GTD scope: TickTick lists (name or id) that are pulled into the vault.
	// Empty = pull nothing (safe default, NOT "everything"). Replaces the single SyncProject
	// (migrated on load when this key is absent); SyncTag/SyncProject still narrow it further.
	// Per-list mirror stubs under TickTickTasksFilePath are created only when listStubFilesEnabled()
	// (off for newTasksFile hub and for Abyss/GTD: projectScheme + abyssTasksFormat + syncScopeFolders).
	syncedLists: string[];
	// Vault folders (prefix match, e.g. "00 Inbox/") that may push to TickTick. Empty = no folder
	// restriction. The tasks folder, the projects folder and newTasksFile are always in scope.
	syncScopeFolders: string[];
	defaultProjectId: string;
	defaultProjectName: string;
	TickTickTasksFilePath: string;
	keepProjectFolders: boolean;
	syncNotes: boolean;
	/**
	 * Opt-in: TickTick Notebook items (`kind: NOTE`) → markdown under `notebookFolder`.
	 * Default off. Not task-body `syncNotes` / NOTE-BODY.
	 */
	syncNotebook: boolean;
	/** Vault folder for Notebook MVP (TT→vault). */
	notebookFolder: string;
	noteDelimiter: string;
	// Abyss Tasks format: notes as `- > ` lines, comments as `- ` lines
	abyssTasksFormat: boolean;
	abyssIndent: 'tab' | 'spaces';
	/** Push `note/<file-slug>` and `proj/<moc-slug>` tags for TickTick filter views; stripped on pull. */
	syncNoteContextTags: boolean;
	/** Abyss `- stamp:` comments → TickTick Comments API (not `content` block). */
	syncAbyssCommentsViaApi: boolean;
	// ⏳ scheduled <-> TickTick startDate (when no 🛫)
	scheduledAsStartDate: boolean;
	tagMappings: { obsidian: string; ticktick: string }[];
	statusMappings: { char: string; tag: string }[];
	/**
	 * Abyss checkbox symbol → TickTick list (SoT for list when non-empty + abyssTasksFormat).
	 * Distinct from statusMappings (char → TT tag). When set, #gtd/* via tagListMappings
	 * does not drive list placement; stage tags are stripped on sync rewrite.
	 */
	statusListMappings: { char: string; list: string; listId?: string }[];
	projectMappings: { path: string; project: string }[];
	tagListMappings: { tag: string; list: string; listId?: string }[];
	/** GTD stage: Obsidian tag selects a TickTick list, or a TickTick tag for a filter view. */
	gtdStageVia: 'list' | 'tag';
	projectsListId?: string;
	syncMarkerTag: string;
	// If set: every TickTick list maps to this one file for NEW tasks; lists are
	// decided by tags, and list moves don't relocate lines between files.
	newTasksFile: string;
	// What to do when a task is deleted in TickTick: ask (modal) | cancel ([-] + detach)
	onTickTickDeletion: 'ask' | 'cancel';
	lastBackupDate: string; // YYYY-MM-DD of last startup backup
	projectSchemeEnabled: boolean;
	// Remove DB entries of files deleted from the vault without asking
	autoCleanupDatabase: boolean;
	projectsFolder: string;
	projectsListName: string;
	projectTaskTags: string[];
	// Optional vault path of a project note template, used when a project note is created from
	// TickTick. Templater blocks/prompts are skipped; title and id are filled. Empty = built-in template.
	projectTemplatePath: string;
	/** Abyss: flat TickTick tag name -> original Obsidian tag path (foo-bar -> foo/bar). */
	tagPathMap?: Record<string, string>;
	projectSnapshot: Record<string, { noteDone: boolean; ttDone: boolean; title?: string }>;
	fileLinksInTickTick: string;
	taskLinksInObsidian: string;
	bkupFolder: string;
	// Opt-in: stop injecting the "#ticktick" control tag as a real TickTick
	// tag. Historically the plugin force-added "ticktick" to every synced
	// task's TickTick tags; this lets users stop that behavior.
	stopInjectingTickTickTag: boolean;
	// Opt-in (only meaningful with stopInjectingTickTickTag): on a full task
	// reset, actively strip the legacy "ticktick" tag from existing TickTick
	// tasks so it gets cleaned up there too.
	stripTickTickTagOnReset: boolean;


	debugMode: boolean;
	/** Log every note write and update decision. Default off. Reload the plugin after turning it on. */
	debugWriteTrace: boolean;
	logLevel: string;
	/** Hold a sync's deletions when they exceed the count and percent, or when one side looks empty. */
	massDeleteGuardEnabled: boolean;
	/** Block when planned task deletions are more than this count AND more than the percent. */
	massDeleteTaskThreshold: number;
	massDeletePercentThreshold: number;
	/** How many planned deletions the guard dialog lists. The report lists all of them. */
	massDeletePreviewCount: number;
	/** Seconds after layout-ready and Obsidian Sync idle before the first sync. 0 skips the wait. */
	startupSyncDelaySeconds: number;
	journalRetentionDays: number;
	redoLogRetentionDays: number;
	deletedTaskRetentionDays: number;
	skipBackup?: boolean;

	//TODO look like one cache object
	inboxID: string;
	inboxName: string;
	checkPoint: number;

	vaultName: string;

	taskDisplay: {
		reading: TaskDisplayModeSettings;
		editing: TaskDisplayModeSettings;
	};

	devices: DeviceInfo[];

	// statistics: any;
}

export const DEFAULT_SETTINGS: ITickTickSyncSettings = {
	baseURL: 'ticktick.com',
	automaticSynchronizationInterval: 0, // 0 = no scheduled timer; open-note / startup still sync unless syncEnabled is false
	syncEnabled: true, // UX-SET-SYNC-MASTER-OFF: false = kill automatic/reactive paths; Synchronize still works
	showSyncProgressOnScheduledSync: false,
	enableFullVaultSync: false,
	tagAndOr: 1,
	debugMode: false,
	debugWriteTrace: false,
	logLevel: 'info',
	massDeleteGuardEnabled: true,
	massDeleteTaskThreshold: 10,
	massDeletePercentThreshold: 20,
	massDeletePreviewCount: 20,
	startupSyncDelaySeconds: 30,
	journalRetentionDays: 3,
	redoLogRetentionDays: 30,
	deletedTaskRetentionDays: 7,
	SyncProject: '',
	SyncTag: '',
	syncedLists: [], // safe default: nothing is pulled until lists are chosen
	syncScopeFolders: [],
	defaultProjectId: '',
	defaultProjectName: 'Inbox',
	TickTickTasksFilePath: '/',
	keepProjectFolders: false,
	syncNotes: true,
	syncNotebook: false,
	notebookFolder: 'TickTick Notebook',
	noteDelimiter: '-------------------------------------------------------------',
	abyssTasksFormat: false,
	abyssIndent: 'tab',
	syncNoteContextTags: true,
	syncAbyssCommentsViaApi: true,
	scheduledAsStartDate: false,
	tagMappings: [],
	statusMappings: [{ char: '/', tag: 'status/in-progress' }, { char: '-', tag: 'status/cancelled' }],
	statusListMappings: [],
	projectMappings: [],
	tagListMappings: [],
	gtdStageVia: 'list',
	syncMarkerTag: 'ticktick',
	newTasksFile: '',
	onTickTickDeletion: 'ask',
	lastBackupDate: '',
	projectSchemeEnabled: false,
	autoCleanupDatabase: false,
	projectsFolder: '10 Projects',
	projectsListName: 'Projects',
	projectTaskTags: ['project', 'obsidian'],
	projectTemplatePath: '',
	projectSnapshot: {},
	// Fork defaults: no obsidian:// links in TickTick titles, no "ticktick" tag pushed to TickTick.
	fileLinksInTickTick: 'noLink',
	taskLinksInObsidian: 'taskLink',
	// Phase 3 #193 UX-SET-BKUP-DEFAULT: subfolder for new installs (existing data.json kept as-is).
	bkupFolder: DEFAULT_BKUP_FOLDER,
	stopInjectingTickTickTag: true,
	stripTickTickTagOnReset: false,

	inboxID: '',
	inboxName: 'Inbox',
	checkPoint: 0,
	skipBackup: false,

	vaultName: '',

	taskDisplay: {
		reading: {
			link: 'show',
			id: false,
			// Phase 3 #193 quiet reading: hide sync tag chrome in Reading mode for new installs.
			tag: false,
		},
		editing: {
			link: 'show',
			id: true,
			tag: true,
		},
	},

	devices: [],

	//statistics: {}
};

//two places for settings, move all ref from main to here

export let settings: ITickTickSyncSettings = { ...DEFAULT_SETTINGS };

export const getSettings = (): ITickTickSyncSettings => {
	return settings;
};

export const setSettings = (value: ITickTickSyncSettings) => {
	settings = value;
};

/**
 * Narrow surface of the Svelte settings store that `updateSettings` needs.
 * The store registers itself via `registerSettingsStore` (see ui/settings/settingsstore.ts),
 * so the import stays one-way (store → settings). Importing the store here created a
 * settings ↔ store cycle that pulled every module calling `getSettings()` into a
 * circular import (73 allowlisted cycles before this change).
 */
type SettingsStoreLike = {
	set: (value: ITickTickSyncSettings) => void;
	update: (updater: (current: ITickTickSyncSettings) => ITickTickSyncSettings) => void;
};

let settingsStore: SettingsStoreLike | null = null;

/** Called by the Svelte settings store when it is created (settings tab first open). */
export function registerSettingsStore(store: SettingsStoreLike): void {
	settingsStore = store;
}

export type UpdateSettingsOptions = { persist?: boolean };

export const updateSettings = (
	newSettings: Partial<ITickTickSyncSettings>,
	opts?: UpdateSettingsOptions,
): ITickTickSyncSettings => {
	settings = { ...settings, ...newSettings } as const;
	if (settingsStore) {
		// Default: sync Svelte store only; disk writes go through plugin.saveSettings().
		if (opts?.persist === true) {
			settingsStore.set(settings);
		} else {
			settingsStore.update(() => ({ ...settings }));
		}
	}
	return getSettings();
};

/**
 * Merge two device lists, deduplicating by deviceId.
 * `override` entries take precedence for label when IDs match.
 */
export function mergeDeviceLists(base: DeviceInfo[], override: DeviceInfo[]): DeviceInfo[] {
	const map = new Map<string, DeviceInfo>();
	for (const d of base) map.set(d.deviceId, d);
	for (const d of override) map.set(d.deviceId, d);
	return Array.from(map.values());
}

export const getDefaultFolder = (): string => {
	let path = settings.TickTickTasksFilePath;
	if (!path || path === '/') {
		return '';
	}
	// Remove leading slash
	if (path.startsWith('/')) {
		path = path.substring(1);
	}
	// Remove trailing slash
	if (path.endsWith('/')) {
		path = path.substring(0, path.length - 1);
	}
	return path;
};
