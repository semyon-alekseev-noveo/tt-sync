import { afterEach, describe, expect, it, vi } from 'vitest';
import * as obsidian from 'obsidian';
import { Tick } from '@/api';
import { TickTickService } from '@/services';
import {
	finishSyncPerf,
	formatSyncPerf,
	httpEndpointKey,
	lastSyncPerf,
	noteHttpCall,
	observeSyncApi,
	resetSyncPerfForTests,
	startSyncPerf,
	timePhase,
} from '@/sync/perf';

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), trace: vi.fn() },
}));

describe('PERF-COUNTERS', () => {
	afterEach(() => {
		resetSyncPerfForTests();
		vi.restoreAllMocks();
	});

	it('names getTaskById and getTaskComments apart from other calls', () => {
		expect(httpEndpointKey('Get Tasks', 'https://api.ticktick.com/api/v2/task/abc?projectID=p')).toBe('getTaskById');
		expect(httpEndpointKey('Get Task Comments', 'https://api.ticktick.com/api/v2/project/p/task/abc/comments')).toBe('getTaskComments');
		expect(httpEndpointKey('Get All Resources', 'https://api.ticktick.com/api/v2/batch/check/0')).toBe('batch/check');
		expect(httpEndpointKey('Batch Update', 'https://api.ticktick.com/api/v2/batch/task')).toBe('batch/task');
	});

	it('counts HTTP calls, 429s, and phase time on the open run', async () => {
		const run = startSyncPerf({ trigger: 'manual', fullSync: false });
		noteHttpCall('Get Tasks', 'https://api.ticktick.com/api/v2/task/abc', 200);
		noteHttpCall('Get Task Comments', 'https://api.ticktick.com/api/v2/project/p/task/abc/comments', 200);
		noteHttpCall('Get All Resources', 'https://api.ticktick.com/api/v2/batch/check/12', 429);
		await timePhase('pull', async () => undefined);
		const report = finishSyncPerf(run, true);
		expect(report.counts.apiCalls).toBe(3);
		expect(report.counts.http429).toBe(1);
		expect(report.counts.httpByEndpoint).toEqual({
			getTaskById: 1,
			getTaskComments: 1,
			'batch/check': 1,
		});
		expect(report.phaseMs.pull).toBeGreaterThanOrEqual(0);
		expect(report.ok).toBe(true);
		expect(formatSyncPerf(report)).toContain('"getTaskById":1');
		expect(lastSyncPerf()).toEqual(report);
	});

	it('records a 429 from Tick.makeRequest while a run is open', async () => {
		vi.spyOn(obsidian, 'requestUrl').mockResolvedValue({
			status: 429,
			headers: {},
			json: {},
			text: 'slow down',
		} as never);
		const run = startSyncPerf({ trigger: 'scheduled', fullSync: false });
		const tick = new Tick({ token: 't', baseUrl: 'ticktick.com', checkPoint: 1 });
		const task = await tick.getTask('abc', 'proj');
		const report = finishSyncPerf(run, true);
		expect(task).toBeNull();
		expect(report.counts.http429).toBe(1);
		expect(report.counts.httpByEndpoint.getTaskById).toBe(1);
		expect(report.counts.apiCalls).toBe(1);
	});

	it('PERF-DELTA #87: commentsByPhase attributes getTaskComments to innermost timePhase', async () => {
		const api = {
			getTaskById: vi.fn(async () => null),
			getTaskComments: vi.fn(async () => []),
		};
		const run = startSyncPerf({ trigger: 'manual', fullSync: false });
		const stop = observeSyncApi(api);
		await timePhase('vaultReconcile', async () => {
			await api.getTaskComments('p', 't1');
		});
		await timePhase('push', async () => {
			await api.getTaskComments('p', 't2');
			await api.getTaskComments('p', 't3');
		});
		stop();
		const report = finishSyncPerf(run, true);
		expect(report.counts.commentsFetched).toBe(3);
		expect(report.counts.commentsByPhase).toEqual({
			vaultReconcile: 1,
			push: 2,
		});
	});

	it('logs one active-file summary around the settled push', async () => {
		const plugin = {
			syncRunning: false,
			app: { vault: {} },
			tickTickRestAPI: { getTaskById: vi.fn(async () => null), getTaskComments: vi.fn(async () => []) },
			syncActivity: { runInline: async (_label: string, fn: () => Promise<void>) => fn() },
			taskModificationDetector: { checkFileForModifications: vi.fn(async () => undefined) },
		};
		const service = new TickTickService(plugin as never);
		await service.pushSettledActiveFile('notes/open.md', [2]);
		const report = lastSyncPerf();
		expect(report?.trigger).toBe('active-file');
		expect(report?.fullSync).toBe(false);
		expect(report?.ok).toBe(true);
		expect(report?.phaseMs.activeFile).toBeGreaterThanOrEqual(0);
		expect(plugin.taskModificationDetector.checkFileForModifications).toHaveBeenCalledWith(
			'notes/open.md',
			undefined,
			{ skipLines: new Set([2]), identifiedOnly: true },
		);
	});
});
