/**
 * One sync run's timings and counters. Overhead is a couple of number adds
 * while a run is open, and a single null check when it is not.
 * Phase times may overlap: comments sit inside vault reconcile, journal inside pull.
 */

export type SyncPerfTrigger = 'manual' | 'scheduled' | 'startup' | 'active-file';

export interface SyncPerfCounts {
	filesScanned: number;
	filesRead: number;
	vaultReads: number;
	vaultWrites: number;
	tasksTotal: number;
	tasksChecked: number;
	tasksDelta: number;
	tasksProbedById: number;
	commentsFetched: number;
	/** getTaskComments attributed to innermost `timePhase` (#87 / PERF-DELTA). */
	commentsByPhase: Record<string, number>;
	apiCalls: number;
	http429: number;
	httpByEndpoint: Record<string, number>;
}

export interface SyncPerfReport {
	trigger: SyncPerfTrigger;
	fullSync: boolean;
	phaseMs: Record<string, number>;
	counts: SyncPerfCounts;
	ok: boolean;
	totalMs: number;
}

interface SyncPerfRun {
	trigger: SyncPerfTrigger;
	fullSync: boolean;
	startedAt: number;
	phaseMs: Record<string, number>;
	counts: SyncPerfCounts;
	ok: boolean;
}

let current: SyncPerfRun | null = null;
let lastReport: SyncPerfReport | null = null;
let orphanBackupMs = 0;
const phaseStack: string[] = [];

/** Innermost `timePhase` name, for the write trace. */
export function currentSyncPhase(): string | undefined {
	return phaseStack[phaseStack.length - 1];
}

export function currentSyncTrigger(): SyncPerfTrigger | undefined {
	return current?.trigger;
}

function emptyCounts(): SyncPerfCounts {
	return {
		filesScanned: 0,
		filesRead: 0,
		vaultReads: 0,
		vaultWrites: 0,
		tasksTotal: 0,
		tasksChecked: 0,
		tasksDelta: 0,
		tasksProbedById: 0,
		commentsFetched: 0,
		commentsByPhase: {},
		apiCalls: 0,
		http429: 0,
		httpByEndpoint: {},
	};
}

export function startSyncPerf(opts: { trigger: SyncPerfTrigger; fullSync: boolean }): SyncPerfRun {
	const run: SyncPerfRun = {
		trigger: opts.trigger,
		fullSync: opts.fullSync,
		startedAt: performance.now(),
		phaseMs: {},
		counts: emptyCounts(),
		ok: true,
	};
	if (orphanBackupMs) {
		run.phaseMs.backup = orphanBackupMs;
		orphanBackupMs = 0;
	}
	current = run;
	return run;
}

export function finishSyncPerf(run: SyncPerfRun, ok: boolean): SyncPerfReport {
	run.ok = ok;
	const report: SyncPerfReport = {
		trigger: run.trigger,
		fullSync: run.fullSync,
		phaseMs: roundRecord(run.phaseMs),
		counts: {
			...run.counts,
			commentsByPhase: { ...run.counts.commentsByPhase },
			httpByEndpoint: { ...run.counts.httpByEndpoint },
		},
		ok,
		totalMs: roundMs(performance.now() - run.startedAt),
	};
	if (current === run) current = null;
	lastReport = report;
	return report;
}

export function lastSyncPerf(): SyncPerfReport | null {
	return lastReport;
}

export function resetSyncPerfForTests(): void {
	current = null;
	lastReport = null;
	orphanBackupMs = 0;
	phaseStack.length = 0;
}

export async function timePhase<T>(name: string, fn: () => Promise<T>): Promise<T> {
	const t0 = performance.now();
	phaseStack.push(name);
	try {
		return await fn();
	} finally {
		phaseStack.pop();
		addPhaseMs(name, performance.now() - t0);
	}
}

export function addPhaseMs(name: string, ms: number): void {
	if (ms < 0) return;
	if (!current) {
		if (name === 'backup') orphanBackupMs += ms;
		return;
	}
	current.phaseMs[name] = (current.phaseMs[name] ?? 0) + ms;
}

type CountKey = Exclude<keyof SyncPerfCounts, 'httpByEndpoint' | 'commentsByPhase'>;

export function addCount(name: CountKey, n = 1): void {
	if (!current || !n) return;
	current.counts[name] += n;
}

export function noteFilesScanned(n = 1): void {
	addCount('filesScanned', n);
}

export function noteFileRead(kind: 'read' | 'cached'): void {
	if (!current) return;
	current.counts.filesRead++;
	if (kind === 'read') current.counts.vaultReads++;
}

export function noteVaultWrite(): void {
	addCount('vaultWrites', 1);
}

/** Stable endpoint name for one HTTP call. `getTaskById` and `getTaskComments` stay distinct. */
export function httpEndpointKey(operation: string, url: string): string {
	let path = url;
	try {
		path = new URL(url, 'https://ticktick.local').pathname;
	} catch {
		path = url.split('?')[0] ?? url;
	}
	path = path.replace(/^\/+/, '');
	const tail = path.replace(/^api\/v\d+\//, '');
	if (/^task\/[^/]+$/.test(tail)) return 'getTaskById';
	if (/\/comments$/.test(tail)) return 'getTaskComments';
	if (/\/comment\/[^/]+$/.test(tail)) {
		return /update/i.test(operation) ? 'updateTaskComment' : 'deleteTaskComment';
	}
	if (/\/comment$/.test(tail)) return 'addTaskComment';
	if (tail.includes('batch/check')) return 'batch/check';
	if (tail.includes('batch/taskParent')) return 'batch/taskParent';
	if (tail.includes('batch/taskProject')) return 'batch/taskProject';
	if (tail.includes('batch/task')) return 'batch/task';
	if (tail.includes('data/export')) return 'export';
	if (tail === 'projects' || tail.startsWith('project')) return operation || 'projects';
	return operation || tail || 'unknown';
}

export function noteHttpCall(operation: string, url: string, status?: number): void {
	if (!current) return;
	const key = httpEndpointKey(operation, url);
	const bag = current.counts.httpByEndpoint;
	bag[key] = (bag[key] ?? 0) + 1;
	current.counts.apiCalls++;
	if (status === 429) current.counts.http429++;
}

type ApiFn = (...args: unknown[]) => unknown;

interface MockFn extends ApiFn {
	mock?: unknown;
	mockImplementation?: (impl: ApiFn) => void;
	getMockImplementation?: () => ApiFn | undefined;
}

/** Count getTaskById / getTaskComments on the API object for this run, including test doubles. */
export function observeSyncApi(api: object | null | undefined): () => void {
	if (!api) return () => undefined;
	const restores: Array<() => void> = [];
	watch(api, 'getTaskById', 'getTaskById', restores);
	watch(api, 'getTaskComments', 'getTaskComments', restores);
	return () => {
		for (const restore of restores.reverse()) restore();
	};
}

function watch(api: object, method: 'getTaskById' | 'getTaskComments', kind: 'getTaskById' | 'getTaskComments', restores: Array<() => void>): void {
	const rec = api as Record<string, unknown>;
	const orig = rec[method];
	if (typeof orig !== 'function') return;
	const fn = orig as MockFn;
	const counted = async (invoke: ApiFn | undefined, args: unknown[]) => {
		const t0 = performance.now();
		try {
			if (kind === 'getTaskById') addCount('tasksProbedById', 1);
			else {
				addCount('commentsFetched', 1);
				// #87: attribute comment GETs to innermost sync phase (push / reconcile / …).
				if (current) {
					const phase = currentSyncPhase() ?? 'unknown';
					const bag = current.counts.commentsByPhase;
					bag[phase] = (bag[phase] ?? 0) + 1;
				}
			}
			return invoke ? await invoke.apply(api, args) : undefined;
		} finally {
			if (kind === 'getTaskComments') addPhaseMs('comments', performance.now() - t0);
		}
	};
	if (fn.mock && typeof fn.mockImplementation === 'function' && typeof fn.getMockImplementation === 'function') {
		const prev = fn.getMockImplementation();
		fn.mockImplementation((...args: unknown[]) => counted(prev, args));
		restores.push(() => {
			fn.mockImplementation?.(prev ?? (() => undefined));
		});
		return;
	}
	const wrapped: ApiFn = (...args: unknown[]) => counted(orig as ApiFn, args);
	rec[method] = wrapped;
	restores.push(() => {
		rec[method] = orig;
	});
}

export function formatSyncPerf(report: SyncPerfReport): string {
	return JSON.stringify(report);
}

export function formatSyncPerfShort(report: SyncPerfReport): string {
	const c = report.counts;
	const limited = c.http429 ? ` · 429 ${c.http429}` : '';
	return `api ${c.apiCalls} · probe ${c.tasksProbedById} · read ${c.filesRead} · write ${c.vaultWrites}${limited}`;
}

function roundMs(ms: number): number {
	return Math.round(ms * 10) / 10;
}

function roundRecord(phaseMs: Record<string, number>): Record<string, number> {
	const out: Record<string, number> = {};
	for (const [name, ms] of Object.entries(phaseMs)) out[name] = roundMs(ms);
	return out;
}
