/**
 * Mass-deletion / empty-side guard.
 *
 * A sync run plans vault→TickTick and TickTick→vault deletions (tasks and
 * comments) before it applies any of them. Over the threshold, or when one
 * side looks empty, nothing destructive runs and the checkpoint stays put.
 */

export type DeletionDirection = 'vault-to-ticktick' | 'ticktick-to-vault';
export type DeletionKind = 'task' | 'comment';
export type DeletionAction = 'delete' | 'close' | 'detach' | 'mark-cancelled';
export type SyncRunTrigger = 'manual' | 'scheduled' | 'startup';
export type FileTrust = 'ok' | 'unreadable' | 'conflict' | 'sync-pending' | 'skipped';
export type GuardReason =
	| 'allow'
	| 'disabled'
	| 'threshold'
	| 'empty-vault'
	| 'empty-ticktick'
	| 'empty-dexie'
	| 'incomplete-index';
/** `rematch` = rewrite missing vault lines from Dexie/TT; never Apply TT deletes (#208). */
export type GuardChoice = 'allow' | 'apply-once' | 'skip' | 'open-report' | 'notify-only' | 'rematch';
export type DeletionConfirmMode = 'normal' | 'force' | 'skip';

export interface PlannedDeletion {
	id: string;
	kind: DeletionKind;
	direction: DeletionDirection;
	action: DeletionAction;
	title?: string;
	file?: string;
	taskId?: string;
}

export interface MassDeleteGuardConfig {
	enabled: boolean;
	/** Block when planned task deletions are strictly greater than this AND greater than the percent. */
	taskCountThreshold: number;
	taskPercentThreshold: number;
	previewCount: number;
}

export interface SideSnapshot {
	/** TickTick ids found by a complete vault scan. Ignored for the empty-vault check when the index is incomplete. */
	vaultTrackedCount: number;
	/** Non-deleted tasks in Dexie. */
	dexieTaskCount: number;
	/** Full TickTick snapshot (since 0 / full sync) contained no tasks. A quiet delta is not empty. */
	ticktickSnapshotEmpty: boolean;
	/** Metadata cache not ready, or a file read failed, so absence cannot be trusted. */
	vaultIndexIncomplete: boolean;
}

export interface GuardDecision {
	block: boolean;
	reason: GuardReason;
	taskDeletions: number;
	commentDeletions: number;
	trackedTasks: number;
	percent: number;
}

export interface LocalDeletionCandidate {
	taskId: string;
	title?: string;
	file?: string;
	deleted?: boolean;
	isParent?: boolean;
	/** ID-NOTEBOOK-RESTORE-SAFE / BUG-NOTEBOOK-NO-DELETE: NOTE kind or Notebook list. */
	isNotebook?: boolean;
	tags?: string[];
	/** False when the task's file is outside push scope. */
	inPushScope?: boolean;
}

export const DEFAULT_MASS_DELETE_GUARD: MassDeleteGuardConfig = {
	enabled: true,
	taskCountThreshold: 10,
	taskPercentThreshold: 20,
	previewCount: 20,
};

const num = (value: unknown, fallback: number): number => {
	const n = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(n) ? n : fallback;
};

export function massDeleteSettingsFrom(source: {
	massDeleteGuardEnabled?: boolean;
	massDeleteTaskThreshold?: number;
	massDeletePercentThreshold?: number;
	massDeletePreviewCount?: number;
} | null | undefined): MassDeleteGuardConfig {
	if (!source) return { ...DEFAULT_MASS_DELETE_GUARD };
	return {
		enabled: source.massDeleteGuardEnabled !== false,
		taskCountThreshold: num(source.massDeleteTaskThreshold, DEFAULT_MASS_DELETE_GUARD.taskCountThreshold),
		taskPercentThreshold: num(source.massDeletePercentThreshold, DEFAULT_MASS_DELETE_GUARD.taskPercentThreshold),
		previewCount: Math.max(1, Math.round(num(source.massDeletePreviewCount, DEFAULT_MASS_DELETE_GUARD.previewCount))),
	};
}

/** Full snapshot only. A delta that happens to contain no rows is not an empty TickTick. */
export function isEmptyTickTickSnapshot(fullSync: boolean, since: number, taskCount: number): boolean {
	return (fullSync || since === 0) && taskCount === 0;
}

/**
 * BUG-208-EMPTY-TT-NO-AZ-STRIP: a delta with no surviving updates that clears
 * more than the mass-delete count+percent of Dexie looks like a TickTick wipe —
 * even when `since > 0`. A single remote delete must not trip this (normal path).
 */
export function looksLikeTickTickWipe(args: {
	updateCount: number;
	deleteCount: number;
	dexieTaskCount: number;
	taskCountThreshold?: number;
	taskPercentThreshold?: number;
}): boolean {
	if (args.dexieTaskCount <= 0) return false;
	if (args.updateCount > 0) return false;
	if (args.deleteCount <= 0) return false;
	const countTh = args.taskCountThreshold ?? DEFAULT_MASS_DELETE_GUARD.taskCountThreshold;
	const pctTh = args.taskPercentThreshold ?? DEFAULT_MASS_DELETE_GUARD.taskPercentThreshold;
	const percent = (args.deleteCount / args.dexieTaskCount) * 100;
	return args.deleteCount > countTh && percent > pctTh;
}

/**
 * BUG-208-HELD-LABEL: owner-facing line for the held modal / report.
 * `vault-to-ticktick` + delete = TickTick would be wiped for tasks missing vault markers.
 */
export function formatPlannedDeletionLabel(item: PlannedDeletion): string {
	const title = item.title || item.id;
	const file = item.file ? ` (${item.file})` : '';
	if (item.kind === 'task' && item.direction === 'vault-to-ticktick' && item.action === 'delete') {
		return `Would delete from TickTick — missing vault line/marker — ${title}${file}`;
	}
	if (item.kind === 'task' && item.direction === 'ticktick-to-vault') {
		const verb = item.action === 'detach' || item.action === 'mark-cancelled'
			? 'Would detach/cancel vault line'
			: 'Would remove vault line';
		// ID-MISSING-FROM-TT-BACKUP / ID-TT-RESTORE-OMITTED: honest — not invent TT.
		return `${verb} — gone from TickTick (deleted or not in backup) — ${title}${file}`;
	}
	if (item.kind === 'comment' && item.direction === 'vault-to-ticktick') {
		return `Would delete TickTick comment — missing in vault — ${title}${file}`;
	}
	if (item.kind === 'comment' && item.direction === 'ticktick-to-vault') {
		return `Would remove vault comment — gone from TickTick — ${title}${file}`;
	}
	return [item.direction, item.kind, item.action, title, item.file].filter(Boolean).join(' — ');
}

/** ID-REBIND-UX (#217) — held modal / notices */
export const REBIND_BUTTON_LABEL = 'Rebind vault to TickTick (no TT deletes)';
export const REBIND_BUTTON_DESC =
	'Rewrite stale or missing vault markers from TickTick/local cache. Does not delete TickTick tasks.';
export const REBIND_VAULT_WIPE_HINT =
	'Lines labeled “Would delete from TickTick” mean the vault is missing line markers — Apply once would wipe those tasks in TickTick. After a restore, prefer Skip or Rebind — not Apply once.';
export const REBIND_GUARD_NOTICE =
	'Rebinding vault markers (TickTick kept). Deletions skipped.';

/** ID-TEXT-NO-MARKER (#233): unmarked checkboxes bind only via Rebind — never silent auto-bind. */
export const TEXT_NO_MARKER_POLICY =
	'Unmarked checkboxes that match TickTick are not auto-bound on Synchronize. Use Rebind (or insert on Rematch) — never Apply once to “fix” missing markers.';

/**
 * ID-TT-GONE-DETACH / ID-MISSING-FROM-TT-BACKUP / ID-TT-RESTORE-OMITTED (#233):
 * detach markers, keep checklist text; never invent TickTick tasks from vault.
 */
export const TT_GONE_DETACH_NOTICE =
	'task(s) gone from TickTick (deleted or not in backup) — markers detached, text kept. TickTick was not recreated from the vault.';

export function formatTtGoneDetachNotice(detachedCount: number): string {
	return `TickTickSync: ${detachedCount} ${TT_GONE_DETACH_NOTICE}`;
}

/**
 * Offer Rematch/Rebind when any vault→TickTick task delete is planned
 * (post-restore missing markers). Mixed plans may still include held
 * ticktick→vault rows — rematchCandidates only takes vault→TT (#216).
 */
export function canOfferRematch(planned: readonly PlannedDeletion[]): boolean {
	return rematchCandidates(planned).length > 0;
}

export function rematchCandidates(planned: readonly PlannedDeletion[]): PlannedDeletion[] {
	return planned.filter(item =>
		item.kind === 'task'
		&& item.direction === 'vault-to-ticktick'
		&& item.action === 'delete'
		&& !!item.taskId
		&& !!item.file,
	);
}

/**
 * ID-REBIND-UX: vault→TT deletes dominate the held plan (typical post-restore).
 * UI must not nudge Apply once — Rebind/Skip are the safe path.
 */
export function isRestoreShapedHold(planned: readonly PlannedDeletion[]): boolean {
	const vaultTt = rematchCandidates(planned).length;
	if (vaultTt === 0) return false;
	const taskOps = planned.filter(item => item.kind === 'task').length;
	return vaultTt >= Math.max(1, Math.ceil(taskOps / 2));
}

export function deletionIdOf(item: unknown): string | null {
	if (!item) return null;
	if (typeof item === 'string') return item;
	if (typeof item === 'object') {
		const row = item as { id?: unknown; taskId?: unknown };
		const id = row.taskId ?? row.id;
		return typeof id === 'string' && id ? id : null;
	}
	return null;
}

export function isConflictCopyPath(path: string): boolean {
	return /\(Conflicted copy\b/i.test(path) || /\.sync-conflict-/i.test(path);
}

export function isSyncPendingPath(path: string): boolean {
	return /\.sync-pending\b/i.test(path) || /\[sync-pending\]/i.test(path);
}

export function classifySyncState(state: string | null | undefined): 'ok' | 'conflict' | 'sync-pending' | 'unknown' {
	if (!state) return 'unknown';
	const s = state.toLowerCase();
	if (s.includes('conflict')) return 'conflict';
	if (s.includes('pending') || s.includes('syncing') || s.includes('uploading') || s.includes('downloading')) return 'sync-pending';
	if (s === 'idle' || s === 'synced' || s === 'fullysynced' || s === 'ok') return 'ok';
	return 'unknown';
}

/**
 * A file that is not `ok` must not contribute deletions.
 * An empty string is a successful read (`readOk` true); a throw is `readOk` false.
 */
export function classifyFileRead(input: {
	path: string;
	readOk: boolean;
	syncState?: string | null;
	skipped?: boolean;
}): FileTrust {
	if (input.skipped) return 'skipped';
	if (isConflictCopyPath(input.path)) return 'conflict';
	if (isSyncPendingPath(input.path)) return 'sync-pending';
	const sync = classifySyncState(input.syncState);
	if (sync === 'conflict') return 'conflict';
	if (sync === 'sync-pending') return 'sync-pending';
	if (!input.readOk) return 'unreadable';
	return 'ok';
}

export function vaultIndexReady(app: {
	metadataCache?: { initialized?: boolean };
	workspace?: { layoutReady?: boolean };
} | null | undefined): boolean {
	if (!app) return false;
	if (app.metadataCache && app.metadataCache.initialized === false) return false;
	if (app.workspace && app.workspace.layoutReady === false) return false;
	return true;
}

/** Obsidian Sync file status, when the installed sync plugin exposes one. Unknown is not pending. */
export function obsidianSyncFileState(app: unknown, file: unknown): string | undefined {
	try {
		const host = app as {
			sync?: { getFileStatus?: (f: unknown) => unknown; getSyncStatus?: (f: unknown) => unknown };
			internalPlugins?: { getPluginById?: (id: string) => { instance?: { getFileStatus?: (f: unknown) => unknown; getSyncStatus?: (f: unknown) => unknown } } | undefined };
		};
		const plugin = host.internalPlugins?.getPluginById?.('sync');
		const service = host.sync ?? plugin?.instance;
		if (!service) return undefined;
		const fn = service.getFileStatus ?? service.getSyncStatus;
		if (typeof fn !== 'function') return undefined;
		const status = fn.call(service, file);
		if (typeof status === 'string') return status;
		if (status && typeof status === 'object') {
			const row = status as { state?: unknown; status?: unknown; type?: unknown };
			const value = row.state ?? row.status ?? row.type;
			return value == null ? undefined : String(value);
		}
		return undefined;
	} catch {
		return undefined;
	}
}

export function evaluateMassDeleteGuard(
	planned: readonly PlannedDeletion[],
	side: SideSnapshot,
	settings: MassDeleteGuardConfig,
): GuardDecision {
	const taskDeletions = planned.filter(item => item.kind === 'task').length;
	const commentDeletions = planned.filter(item => item.kind === 'comment').length;
	const trackedTasks = side.dexieTaskCount;
	const percent = trackedTasks > 0 ? (taskDeletions / trackedTasks) * 100 : 0;
	const base = { taskDeletions, commentDeletions, trackedTasks, percent };

	if (!settings.enabled) {
		return { ...base, block: false, reason: 'disabled' };
	}
	// First sync, or Dexie was wiped: there is no baseline, so do not delete.
	if (side.dexieTaskCount === 0) {
		return planned.length > 0
			? { ...base, block: true, reason: 'empty-dexie' }
			: { ...base, block: false, reason: 'allow' };
	}
	if (side.vaultIndexIncomplete && planned.some(item => item.direction === 'vault-to-ticktick')) {
		return { ...base, block: true, reason: 'incomplete-index' };
	}
	if (planned.length > 0 && !side.vaultIndexIncomplete && side.vaultTrackedCount === 0) {
		return { ...base, block: true, reason: 'empty-vault' };
	}
	if (planned.length > 0 && side.ticktickSnapshotEmpty) {
		return { ...base, block: true, reason: 'empty-ticktick' };
	}
	if (taskDeletions > settings.taskCountThreshold && percent > settings.taskPercentThreshold) {
		return { ...base, block: true, reason: 'threshold' };
	}
	return { ...base, block: false, reason: 'allow' };
}

/**
 * BUG-RESET-CACHE-DELETE / UX-RESET-1 companion.
 *
 * Mass-delete guard only blocks vault→TickTick / TickTick→vault *task* deletes.
 * A separate path strips vault lines when `ticktick_id` is missing from Dexie and
 * `getTaskById` 404s (modal reason «task not found in local cache»). After Reset
 * (empty Dexie) or checkPoint 0, that path would mass-delete notes that still hold
 * pre-wipe / out-of-synced-list ids — fail closed instead.
 *
 * `syncBootstrapSkip` is sticky for one Synchronize that *started* empty/reset so
 * a mid-run pull filling Dexie does not re-enable orphan vault-line removal.
 */
export function shouldSkipOrphanVaultLineDelete(args: {
	dexieTaskCount: number;
	checkPoint: number;
	syncBootstrapSkip?: boolean;
}): boolean {
	if (args.syncBootstrapSkip) return true;
	if (args.dexieTaskCount <= 0) return true;
	if (!Number.isFinite(args.checkPoint) || args.checkPoint === 0) return true;
	return false;
}

export function planVaultTaskDeletions(args: {
	tasks: readonly LocalDeletionCandidate[];
	presentIds: ReadonlySet<string>;
	untrustedFiles: ReadonlySet<string>;
	indexIncomplete: boolean;
}): PlannedDeletion[] {
	if (args.indexIncomplete) return [];
	const out: PlannedDeletion[] = [];
	for (const task of args.tasks) {
		if (!task.taskId || task.deleted || task.isParent) continue;
		// ID-NOTEBOOK-RESTORE-SAFE (#234): never plan vault→TT delete / rematch wipe for Notebook.
		if (task.isNotebook) continue;
		if (task.file && args.untrustedFiles.has(task.file)) continue;
		if (args.presentIds.has(task.taskId)) continue;
		// ID-TAG-ONLY-NO-WIPE (#223): tag `obsidian` alone must not authorize
		// vault→TT delete. Require a known vault file in push scope; otherwise
		// Confirm Deletion appears under "Unknown" for never-synced / restore orphans.
		if (!task.file || task.inPushScope === false) continue;
		out.push({
			id: task.taskId,
			kind: 'task',
			direction: 'vault-to-ticktick',
			action: 'delete',
			title: task.title,
			file: task.file,
			taskId: task.taskId,
		});
	}
	return out;
}

export function planRemoteTaskDeletions(
	deleteIds: readonly string[],
	localById: ReadonlyMap<string, { title?: string; file?: string; deleted?: boolean }>,
	action: 'detach' | 'mark-cancelled',
): PlannedDeletion[] {
	const out: PlannedDeletion[] = [];
	const seen = new Set<string>();
	for (const id of deleteIds) {
		if (!id || seen.has(id)) continue;
		const local = localById.get(id);
		if (!local || local.deleted) continue;
		seen.add(id);
		out.push({
			id,
			kind: 'task',
			direction: 'ticktick-to-vault',
			action,
			title: local.title,
			file: local.file,
			taskId: id,
		});
	}
	return out;
}

export function planVaultCommentDeletions(args: {
	maps: readonly { taskId: string; ticktickCommentId: string; body: string }[];
	taskFile: ReadonlyMap<string, string>;
	fileText: ReadonlyMap<string, string>;
	untrustedFiles: ReadonlySet<string>;
	indexIncomplete: boolean;
}): PlannedDeletion[] {
	if (args.indexIncomplete) return [];
	const out: PlannedDeletion[] = [];
	for (const map of args.maps) {
		const body = map.body?.trim();
		if (!body || !map.ticktickCommentId) continue;
		const file = args.taskFile.get(map.taskId);
		if (!file || args.untrustedFiles.has(file)) continue;
		const text = args.fileText.get(file);
		if (text == null) continue;
		if (text.includes(body)) continue;
		out.push({
			id: map.ticktickCommentId,
			kind: 'comment',
			direction: 'vault-to-ticktick',
			action: 'delete',
			title: body,
			file,
			taskId: map.taskId,
		});
	}
	return out;
}

/** Comments TickTick no longer reports, from `commentCount` falling below the local map. */
export function planRemoteCommentDeletions(
	maps: readonly { taskId: string; ticktickCommentId: string; body: string }[],
	updates: readonly { id?: string; taskId?: string; commentCount?: number }[],
): PlannedDeletion[] {
	const byTask = new Map<string, typeof maps[number][]>();
	for (const map of maps) {
		const list = byTask.get(map.taskId);
		if (list) list.push(map);
		else byTask.set(map.taskId, [map]);
	}
	const out: PlannedDeletion[] = [];
	for (const update of updates) {
		const taskId = update.id || update.taskId;
		if (!taskId || typeof update.commentCount !== 'number') continue;
		const local = byTask.get(taskId) ?? [];
		const drop = local.length - update.commentCount;
		if (drop <= 0) continue;
		for (const map of local.slice(0, drop)) {
			out.push({
				id: map.ticktickCommentId,
				kind: 'comment',
				direction: 'ticktick-to-vault',
				action: 'delete',
				title: map.body,
				taskId,
			});
		}
	}
	return out;
}

export function planVanishedListDeletions(
	projects: readonly { id: string }[] | undefined,
	tasks: readonly { taskId: string; deleted?: boolean; projectId?: string; title?: string; file?: string }[],
	action: 'detach' | 'mark-cancelled',
): PlannedDeletion[] {
	if (!projects || projects.length === 0) return [];
	const live = new Set(projects.map(project => project.id));
	const out: PlannedDeletion[] = [];
	for (const task of tasks) {
		if (!task.taskId || task.deleted || !task.projectId) continue;
		if (task.projectId.startsWith('inbox') || live.has(task.projectId)) continue;
		out.push({
			id: task.taskId,
			kind: 'task',
			direction: 'ticktick-to-vault',
			action,
			title: task.title,
			file: task.file,
			taskId: task.taskId,
		});
	}
	return out;
}

export function previewItems(items: readonly PlannedDeletion[], count: number): PlannedDeletion[] {
	return items.slice(0, Math.max(0, count));
}

export function deletionConfirmModeOf(choice: GuardChoice, blocked: boolean): DeletionConfirmMode {
	if (!blocked) return 'normal';
	if (choice === 'apply-once') return 'force';
	// rematch / skip / open-report / notify-only: never apply the held deletes
	return 'skip';
}

export function pullOptionsForMode(mode: DeletionConfirmMode): { applyDeletions: boolean; advanceCheckpoint: boolean } {
	if (mode === 'skip') return { applyDeletions: false, advanceCheckpoint: false };
	return { applyDeletions: true, advanceCheckpoint: true };
}

/** Scheduled and startup never apply a blocked plan. Manual sync asks. */
export async function settleGuardChoice(
	trigger: SyncRunTrigger,
	decision: GuardDecision,
	prompt: () => Promise<'apply-once' | 'skip' | 'open-report' | 'rematch'>,
): Promise<GuardChoice> {
	if (!decision.block) return 'allow';
	if (trigger !== 'manual') return 'notify-only';
	try {
		const choice = await prompt();
		if (choice === 'apply-once' || choice === 'skip' || choice === 'open-report' || choice === 'rematch') {
			return choice;
		}
	} catch {
		// A broken dialog must not apply deletions.
	}
	return 'skip';
}

export function guardNotice(decision: GuardDecision, choice: GuardChoice): string {
	const held = choice === 'apply-once'
		? 'Applying these deletions once.'
		: choice === 'rematch'
			? REBIND_GUARD_NOTICE
			: 'Nothing destructive was applied. Checkpoint unchanged.';
	return `TickTickSync: ${decision.taskDeletions} task deletion(s) and ${decision.commentDeletions} comment deletion(s) held (${decision.reason}). ${held}`;
}

export function deletionReportPath(now: Date): string {
	const ts = now.toISOString().replace(/[:.]/g, '-');
	return `.tickticksync/reports/deletions-${ts}.md`;
}

export function formatDeletionReport(input: {
	now: Date;
	trigger: SyncRunTrigger;
	choice: GuardChoice;
	decision: GuardDecision;
	planned: readonly PlannedDeletion[];
	vaultTrackedCount: number;
	checkpoint: 'held' | 'advanced';
}): string {
	const lines = [
		'# TickTickSync deletion guard',
		'',
		`- When: ${input.now.toISOString()}`,
		`- Trigger: ${input.trigger}`,
		`- Decision: ${input.choice}`,
		`- Reason: ${input.decision.reason}`,
		`- Tracked tasks (Dexie): ${input.decision.trackedTasks}`,
		`- Vault tracked tasks: ${input.vaultTrackedCount}`,
		`- Task deletions planned: ${input.decision.taskDeletions} (${input.decision.percent.toFixed(1)}%)`,
		`- Comment deletions planned: ${input.decision.commentDeletions}`,
		`- Checkpoint: ${input.checkpoint}`,
		'',
		'## Planned deletions',
		'',
		'| Label | Kind | Action | Id | Task | Title | File |',
		'| --- | --- | --- | --- | --- | --- | --- |',
	];
	const cell = (value: string | undefined) => (value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
	for (const item of input.planned) {
		lines.push(`| ${cell(formatPlannedDeletionLabel(item))} | ${item.kind} | ${item.action} | ${cell(item.id)} | ${cell(item.taskId)} | ${cell(item.title)} | ${cell(item.file)} |`);
	}
	if (input.planned.length === 0) lines.push('| | | | | | | |');
	lines.push('');
	return lines.join('\n');
}

export interface ReportWriter {
	exists(path: string): Promise<boolean>;
	mkdir(path: string): Promise<void>;
	append(path: string, data: string): Promise<void>;
}

/** New file under `.tickticksync/reports/`. Never a user note. */
export async function writeDeletionReport(writer: ReportWriter, markdown: string, now = new Date()): Promise<string> {
	if (!(await writer.exists('.tickticksync'))) await writer.mkdir('.tickticksync');
	if (!(await writer.exists('.tickticksync/reports'))) await writer.mkdir('.tickticksync/reports');
	let path = deletionReportPath(now);
	if (await writer.exists(path)) path = deletionReportPath(new Date(now.getTime() + 1));
	await writer.append(path, markdown);
	return path;
}

export function guardDecisionRecord(input: {
	reportPath: string;
	decision: GuardDecision;
	choice: GuardChoice;
}): {
	kind: 'file';
	op: 'update';
	field: string;
	file: string;
	dir: 'obs->tt';
	before: unknown;
	after: unknown;
} {
	return {
		kind: 'file',
		op: 'update',
		field: 'mass-delete-guard',
		file: input.reportPath,
		dir: 'obs->tt',
		before: {
			reason: input.decision.reason,
			taskDeletions: input.decision.taskDeletions,
			commentDeletions: input.decision.commentDeletions,
			percent: input.decision.percent,
			checkpoint: input.choice === 'apply-once' ? 'advanced' : 'held',
		},
		after: { choice: input.choice },
	};
}

export interface GuardRunState {
	trigger: SyncRunTrigger;
	decision: GuardDecision;
	choice: GuardChoice;
	planned: PlannedDeletion[];
	reportPath?: string;
	mode: DeletionConfirmMode;
	/** BUG-208-REMATCH: vault←TT materialize targets (no TT wipe). */
	rematch?: PlannedDeletion[];
}

let currentRun: GuardRunState | null = null;

export function setGuardRun(state: GuardRunState | null): void {
	currentRun = state;
}

export function getGuardRun(): GuardRunState | null {
	return currentRun;
}

export function clearGuardRun(): void {
	currentRun = null;
}

/** No active run means the small confirm dialog, same as before this guard. */
export function deletionConfirmMode(): DeletionConfirmMode {
	if (!currentRun) return 'normal';
	return currentRun.mode;
}
