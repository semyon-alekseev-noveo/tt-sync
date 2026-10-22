import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/settings';
import { mergeSettingsWithDefaults } from '@/settingsMerge';
import { TaskDeletionHandler } from '@/services/TaskDeletionHandler';
import {
	DEFAULT_MASS_DELETE_GUARD,
	classifyFileRead,
	clearGuardRun,
	deletionConfirmMode,
	evaluateMassDeleteGuard,
	formatDeletionReport,
	guardDecisionRecord,
	isEmptyTickTickSnapshot,
	massDeleteSettingsFrom,
	planRemoteTaskDeletions,
	planVaultCommentDeletions,
	planVaultTaskDeletions,
	pullOptionsForMode,
	setGuardRun,
	settleGuardChoice,
	writeDeletionReport,
	type GuardDecision,
	type PlannedDeletion,
	type SideSnapshot,
} from '@/sync/massDeleteGuard';
import { startupSyncDelayMs, waitForStartupSync } from '@/sync/startupDelay';

const cfg = { ...DEFAULT_MASS_DELETE_GUARD };

function side(over: Partial<SideSnapshot> = {}): SideSnapshot {
	return {
		vaultTrackedCount: 40,
		dexieTaskCount: 40,
		ticktickSnapshotEmpty: false,
		vaultIndexIncomplete: false,
		...over,
	};
}

function tasks(n: number, direction: PlannedDeletion['direction'] = 'vault-to-ticktick'): PlannedDeletion[] {
	return Array.from({ length: n }, (_, i) => ({
		id: `t${i}`,
		kind: 'task' as const,
		direction,
		action: 'delete' as const,
		title: `task ${i}`,
	}));
}

describe('EMPTY-SIDE-GUARD', () => {
	it('blocks when task deletions exceed the count and the percent', () => {
		const over = evaluateMassDeleteGuard(tasks(11), side({ vaultTrackedCount: 40, dexieTaskCount: 40 }), cfg);
		expect(over.block).toBe(true);
		expect(over.reason).toBe('threshold');
		expect(over.percent).toBeCloseTo(27.5);

		const countOnly = evaluateMassDeleteGuard(tasks(11), side({ dexieTaskCount: 100, vaultTrackedCount: 100 }), cfg);
		expect(countOnly.block).toBe(false);
		expect(countOnly.reason).toBe('allow');

		const percentOnly = evaluateMassDeleteGuard(tasks(10), side({ dexieTaskCount: 20, vaultTrackedCount: 20 }), cfg);
		expect(percentOnly.block).toBe(false);
	});

	it('blocks any deletion when the vault scan is empty and Dexie is not', () => {
		const planned = planVaultTaskDeletions({
			tasks: [
				{ taskId: 'a', title: 'A', file: 'n.md', inPushScope: true },
				{ taskId: 'b', title: 'B', file: 'n.md', inPushScope: true },
			],
			presentIds: new Set(),
			untrustedFiles: new Set(),
			indexIncomplete: false,
		});
		expect(planned).toHaveLength(2);
		const decision = evaluateMassDeleteGuard(planned, side({
			vaultTrackedCount: 0,
			dexieTaskCount: 2,
		}), cfg);
		expect(decision.block).toBe(true);
		expect(decision.reason).toBe('empty-vault');
		expect(pullOptionsForMode('skip')).toEqual({ applyDeletions: false, advanceCheckpoint: false });
	});

	it('blocks any deletion when the TickTick full snapshot is empty and Dexie is not', () => {
		expect(isEmptyTickTickSnapshot(true, 0, 0)).toBe(true);
		expect(isEmptyTickTickSnapshot(false, 0, 0)).toBe(true);
		expect(isEmptyTickTickSnapshot(false, 50, 0)).toBe(false);
		expect(isEmptyTickTickSnapshot(true, 0, 3)).toBe(false);

		const planned = planRemoteTaskDeletions(['gone'], new Map([['gone', { title: 'Gone', file: 'n.md' }]]), 'detach');
		const decision = evaluateMassDeleteGuard(planned, side({
			vaultTrackedCount: 4,
			dexieTaskCount: 4,
			ticktickSnapshotEmpty: true,
		}), cfg);
		expect(planned).toHaveLength(1);
		expect(decision.block).toBe(true);
		expect(decision.reason).toBe('empty-ticktick');
	});

	it('does not infer deletions from an unreadable, conflict, sync-pending, or skipped file', () => {
		expect(classifyFileRead({ path: 'n.md', readOk: false })).toBe('unreadable');
		expect(classifyFileRead({ path: 'n (Conflicted copy laptop 2026).md', readOk: true })).toBe('conflict');
		expect(classifyFileRead({ path: 'n.md', readOk: true, syncState: 'syncing' })).toBe('sync-pending');
		expect(classifyFileRead({ path: 'n.md', readOk: true, skipped: true })).toBe('skipped');
		expect(classifyFileRead({ path: 'n.md', readOk: true, syncState: 'idle' })).toBe('ok');

		const tasksInFile = [{ taskId: 'task-1', title: 'A', file: 'n.md', inPushScope: true }];
		expect(planVaultTaskDeletions({
			tasks: tasksInFile,
			presentIds: new Set(),
			untrustedFiles: new Set(['n.md']),
			indexIncomplete: false,
		})).toEqual([]);
		expect(planVaultTaskDeletions({
			tasks: tasksInFile,
			presentIds: new Set(),
			untrustedFiles: new Set(),
			indexIncomplete: true,
		})).toEqual([]);
		expect(planVaultCommentDeletions({
			maps: [{ taskId: 'task-1', ticktickCommentId: 'c1', body: 'hello' }],
			taskFile: new Map([['task-1', 'n.md']]),
			fileText: new Map(),
			untrustedFiles: new Set(['n.md']),
			indexIncomplete: false,
		})).toEqual([]);
	});

	it('with the setting off keeps the old deletion behavior', () => {
		const off = massDeleteSettingsFrom({ ...cfg, massDeleteGuardEnabled: false });
		const decision = evaluateMassDeleteGuard(tasks(30), side({
			vaultTrackedCount: 0,
			dexieTaskCount: 30,
			ticktickSnapshotEmpty: true,
		}), off);
		expect(decision.block).toBe(false);
		expect(decision.reason).toBe('disabled');
		expect(pullOptionsForMode('normal')).toEqual({ applyDeletions: true, advanceCheckpoint: true });
	});

	it('empty Dexie bootstrap does not delete', () => {
		expect(planRemoteTaskDeletions(['gone'], new Map(), 'mark-cancelled')).toEqual([]);
		expect(planVaultTaskDeletions({
			tasks: [],
			presentIds: new Set(['still-in-vault']),
			untrustedFiles: new Set(),
			indexIncomplete: false,
		})).toEqual([]);
		const invented: GuardDecision = evaluateMassDeleteGuard(tasks(2, 'ticktick-to-vault'), side({
			dexieTaskCount: 0,
			vaultTrackedCount: 5,
		}), cfg);
		expect(invented.block).toBe(true);
		expect(invented.reason).toBe('empty-dexie');
	});

	it('startup and scheduled runs do not auto-apply', async () => {
		const blocked = evaluateMassDeleteGuard(tasks(12), side({ dexieTaskCount: 20, vaultTrackedCount: 20 }), cfg);
		const prompt = vi.fn(async () => 'apply-once' as const);
		expect(await settleGuardChoice('startup', blocked, prompt)).toBe('notify-only');
		expect(await settleGuardChoice('scheduled', blocked, prompt)).toBe('notify-only');
		expect(prompt).not.toHaveBeenCalled();
		expect(await settleGuardChoice('manual', blocked, prompt)).toBe('apply-once');
		expect(pullOptionsForMode('force')).toEqual({ applyDeletions: true, advanceCheckpoint: true });
	});

	it('startup delay waits for layout and Obsidian Sync, then the configured seconds', async () => {
		expect(DEFAULT_SETTINGS.startupSyncDelaySeconds).toBe(30);
		expect(DEFAULT_SETTINGS.massDeleteGuardEnabled).toBe(true);
		expect(DEFAULT_SETTINGS.massDeleteTaskThreshold).toBe(10);
		expect(DEFAULT_SETTINGS.massDeletePercentThreshold).toBe(20);
		expect(DEFAULT_SETTINGS.massDeletePreviewCount).toBe(20);
		expect(startupSyncDelayMs(undefined)).toBe(30_000);
		expect(startupSyncDelayMs(0)).toBe(0);
		expect(mergeSettingsWithDefaults({}).startupSyncDelaySeconds).toBe(30);

		const order: string[] = [];
		const waited = await waitForStartupSync({
			ensureLayoutReady: async () => { order.push('layout'); },
			waitForObsidianSync: async () => { order.push('sync'); },
			delaySeconds: 30,
			sleep: async () => { order.push('sleep'); },
		});
		expect(order).toEqual(['layout', 'sync', 'sleep']);
		expect(waited.delayMs).toBe(30_000);

		const skipped: string[] = [];
		await waitForStartupSync({
			ensureLayoutReady: async () => { skipped.push('layout'); },
			waitForObsidianSync: async () => { skipped.push('sync'); },
			delaySeconds: 0,
			sleep: async () => { skipped.push('sleep'); },
		});
		expect(skipped).toEqual(['layout', 'sync']);
	});

	it('writes a new report and a redo record for the decision', async () => {
		const files = new Map<string, string>();
		const path = await writeDeletionReport({
			exists: async p => files.has(p) || p === '.tickticksync',
			mkdir: async p => { files.set(p, ''); },
			append: async (p, data) => { files.set(p, data); },
		}, '# report\n', new Date('2026-10-20T12:00:00.000Z'));
		expect(path.startsWith('.tickticksync/reports/deletions-')).toBe(true);
		expect(path.endsWith('.md')).toBe(true);
		expect(files.get(path)).toContain('# report');
		expect([...files.keys()].some(p => p.startsWith('notes/'))).toBe(false);

		const decision = evaluateMassDeleteGuard(tasks(12), side({ dexieTaskCount: 20, vaultTrackedCount: 20 }), cfg);
		const markdown = formatDeletionReport({
			now: new Date('2026-10-20T12:00:00.000Z'),
			trigger: 'manual',
			choice: 'skip',
			decision,
			planned: tasks(12),
			vaultTrackedCount: 0,
			checkpoint: 'held',
		});
		expect(markdown).toContain('Checkpoint: held');
		expect(markdown).toContain('t0');
		const record = guardDecisionRecord({ reportPath: path, decision, choice: 'skip' });
		expect(record.field).toBe('mass-delete-guard');
		expect(record.file).toBe(path);
		expect(record.after).toEqual({ choice: 'skip' });
	});

	it('skip does not call deleteTasksByIds; apply once asks the handler to skip the second confirm', async () => {
		const handler = new TaskDeletionHandler({ vault: { getMarkdownFiles: () => [] } } as never, { projectScheme: { isParentTask: () => false, isParentId: () => false } } as never);
		const spy = vi.spyOn(handler, 'deleteTasksByIds').mockResolvedValue([]);
		setGuardRun({
			trigger: 'manual',
			decision: evaluateMassDeleteGuard(tasks(12), side({ dexieTaskCount: 20, vaultTrackedCount: 20 }), cfg),
			choice: 'skip',
			planned: [],
			mode: 'skip',
		});
		await handler.processSyncRemovedTasks(['n.md'], { isPendingMarker: () => false });
		expect(spy).not.toHaveBeenCalled();
		expect(deletionConfirmMode()).toBe('skip');
		clearGuardRun();
	});
});
