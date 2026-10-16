import type { DeviceInfo } from '@/db/schema';
import { settingsStore } from '@/ui/settings/settingsstore';

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
	enableFullVaultSync: boolean;
	tagAndOr: number; // 1 == And ; 2 == Or
	SyncProject: string;
	SyncTag: string;
	// GTD scope: TickTick lists (name or id) that are pulled into the vault and get list files.
	// Empty = pull nothing (safe default, NOT "everything"). Replaces the single SyncProject
	// (migrated on load when this key is absent); SyncTag/SyncProject still narrow it further.
	syncedLists: string[];
	// Vault folders (prefix match, e.g. "00 Inbox/") that may push to TickTick. Empty = no folder
	// restriction. The tasks folder, the projects folder and newTasksFile are always in scope.
	syncScopeFolders: string[];
	defaultProjectId: string;
	defaultProjectName: string;
	TickTickTasksFilePath: string;
	keepProjectFolders: boolean;
	syncNotes: boolean;
	noteDelimiter: string;
	// Abyss Tasks format: notes as `- > ` lines, comments as `- ` lines
	abyssTasksFormat: boolean;
	abyssIndent: 'tab' | 'spaces';
	// ⏳ scheduled <-> TickTick startDate (when no 🛫)
	scheduledAsStartDate: boolean;
	tagMappings: { obsidian: string; ticktick: string }[];
	statusMappings: { char: string; tag: string }[];
	projectMappings: { path: string; project: string }[];
	tagListMappings: { tag: string; list: string; listId?: string }[];
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
	logLevel: string;
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
	automaticSynchronizationInterval: 0, // 0 = no automatic sync; user starts a sync from settings or the command
	enableFullVaultSync: false,
	tagAndOr: 1,
	debugMode: false,
	logLevel: 'info',
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
	noteDelimiter: '-------------------------------------------------------------',
	abyssTasksFormat: false,
	abyssIndent: 'tab',
	scheduledAsStartDate: false,
	tagMappings: [],
	statusMappings: [{ char: '/', tag: 'status/in-progress' }, { char: '-', tag: 'status/cancelled' }],
	projectMappings: [],
	tagListMappings: [],
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
	bkupFolder: '/',
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
			tag: true,
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
