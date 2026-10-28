/**
 * Settings UX Phase 4 (#194) — cold-start strip & polish.
 * Copy / visibility / confirm UX only. No sync-semantics change.
 * Cases: UX-SET-COLD-START, UX-SET-DEVICE-PRUNE, UX-SET-INTERVAL-ZERO, UX-SET-PW-CONFIRM
 * (+ Generate Debug dump includes GTD + statusListMappings).
 */

import type { DeviceInfo } from '@/db/schema';

/** UX-SET-COLD-START — one-screen cues in Sync Control. */
export const COLD_START_STRIP_TITLE = 'Cold start — make a synced project';
export const COLD_START_STRIP_LINES: readonly string[] = [
	'Put a note in your Projects folder (e.g. 10 Projects/) with tag #system/project.',
	'Add next actions under ## Active Zone (include Pull filter / SyncTag if set).',
	'Run Synchronize (Maintenance or the TickTickSync command).',
	'A new TickTick list stays silent until you tick it under Synced lists.',
];

/** UX-SET-DEVICE-PRUNE */
export const DEVICE_LIST_LABEL = 'Known devices';
export const DEVICE_LIST_HELP =
	'Devices that have opened this vault with TickTickSync. Rename the current device above; remove stale rows that no longer sync here.';
export const DEVICE_PRUNE_BUTTON = 'Remove';
export const DEVICE_PRUNE_HELP =
	'Prune a stale device label/id from this list. You cannot remove the current device.';
export const DEVICE_CURRENT_BADGE = 'current';

/** Remove one non-current device from the list. Current device is never removed. */
export function pruneDeviceFromList(
	devices: readonly DeviceInfo[],
	deviceIdToRemove: string,
	currentDeviceId: string | null | undefined,
): DeviceInfo[] {
	const id = (deviceIdToRemove ?? '').trim();
	const current = (currentDeviceId ?? '').trim();
	if (!id || (current && id === current)) {
		return devices.map((d) => ({ ...d }));
	}
	return devices.filter((d) => d.deviceId !== id).map((d) => ({ ...d }));
}

/** UX-SET-INTERVAL-ZERO — progress-on-scheduled grey/disabled when interval=0. */
export function scheduledProgressControlEnabled(interval: number | null | undefined): boolean {
	const n = Number(interval);
	return Number.isFinite(n) && n > 0;
}

export const SCHEDULED_PROGRESS_LABEL = 'Show progress during scheduled sync';
export const SCHEDULED_PROGRESS_HELP =
	'When off (default), automatic interval sync runs silently. Manual Sync and inline updates still show a top-right progress notice.';
export const SCHEDULED_PROGRESS_DISABLED_HINT =
	'Interval is 0 (no automatic sync) — this toggle is inactive until you set an interval of 20 seconds or more.';

/** UX-SET-PW-CONFIRM — explicit plaintext confirm before store. */
export const PASSWORD_PLAINTEXT_CONFIRM_TITLE = 'Store password in plaintext?';
export const PASSWORD_PLAINTEXT_CONFIRM_MESSAGE =
	'Username and password are saved in plain text in this plugin\'s data.json so TickTickSync can log in when Obsidian starts. Anyone with vault file access can read them. Prefer empty fields + manual login, or SSO/2FA on desktop, if you do not want plaintext storage.';
export const PASSWORD_PLAINTEXT_CONFIRM_LABEL = 'Store plaintext password';
export const PASSWORD_PLAINTEXT_BANNER =
	'Regular Login credentials are stored in plaintext in data.json when non-empty. You will be asked to confirm before a password is saved.';

/** True when a new non-empty password would be written (needs confirm). Clearing stays silent. */
export function passwordNeedsPlaintextConfirm(
	nextPassword: string | null | undefined,
	previousPassword: string | null | undefined,
): boolean {
	const next = nextPassword ?? '';
	const prev = previousPassword ?? '';
	if (!next) return false;
	return next !== prev;
}

/** Debug dump GTD / status→list subset (Generate Debug Info). */
export type DebugDumpSettingsSlice = {
	version?: string;
	baseURL?: string;
	enableFullVaultSync?: boolean;
	debugMode?: boolean;
	logLevel?: string;
	fileLinksInTickTick?: string;
	taskLinksInObsidian?: string;
	bkupFolder?: string;
	skipBackup?: boolean;
	defaultProjectName?: string;
	defaultProjectId?: string;
	TickTickTasksFilePath?: string;
	SyncProject?: string;
	tagAndOr?: number;
	SyncTag?: string;
	syncNotes?: boolean;
	noteDelimiter?: string;
	projectSchemeEnabled?: boolean;
	abyssTasksFormat?: boolean;
	syncedLists?: string[];
	syncScopeFolders?: string[];
	projectsFolder?: string;
	projectsListName?: string;
	gtdStageVia?: string;
	tagListMappings?: unknown[];
	statusListMappings?: unknown[];
	statusMappings?: unknown[];
	automaticSynchronizationInterval?: number;
	showSyncProgressOnScheduledSync?: boolean;
};

export function buildSettingsDebugDump(
	settings: DebugDumpSettingsSlice,
	extras?: { numProjects?: number; fileTasks?: string[] },
): Record<string, unknown> {
	return {
		general: {
			version: settings.version,
			baseURL: settings.baseURL,
			enableFullVaultSync: settings.enableFullVaultSync,
			debugMode: settings.debugMode,
			logLevel: settings.logLevel,
			fileLinksInTickTick: settings.fileLinksInTickTick,
			taskLinksInObsidian: settings.taskLinksInObsidian,
			bkupFolder: settings.bkupFolder,
			skipBackup: settings.skipBackup,
			numProjects: extras?.numProjects ?? 0,
			fileTasks: extras?.fileTasks ?? [],
		},
		defaults: {
			defaultProjectName: settings.defaultProjectName,
			defaultProjectId: settings.defaultProjectId,
			TickTickTasksFilePath: settings.TickTickTasksFilePath,
		},
		syncControl: {
			SyncProject: settings.SyncProject,
			tagAndOr: settings.tagAndOr,
			SyncTag: settings.SyncTag,
			automaticSynchronizationInterval: settings.automaticSynchronizationInterval,
			showSyncProgressOnScheduledSync: settings.showSyncProgressOnScheduledSync,
		},
		noteSetting: {
			syncNotes: settings.syncNotes,
			noteDelimiter: settings.noteDelimiter,
		},
		gtd: {
			projectSchemeEnabled: settings.projectSchemeEnabled,
			abyssTasksFormat: settings.abyssTasksFormat,
			syncedLists: settings.syncedLists ?? [],
			syncScopeFolders: settings.syncScopeFolders ?? [],
			projectsFolder: settings.projectsFolder,
			projectsListName: settings.projectsListName,
			gtdStageVia: settings.gtdStageVia,
			tagListMappings: settings.tagListMappings ?? [],
			statusListMappings: settings.statusListMappings ?? [],
			statusMappings: settings.statusMappings ?? [],
		},
	};
}
