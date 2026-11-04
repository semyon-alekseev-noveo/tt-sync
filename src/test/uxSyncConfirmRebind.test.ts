/**
 * UX-SYNC-CONFIRM-REBIND — under-threshold Confirm (TaskDeletionModal) must offer
 * Rebind=Link when vault→TT candidates have id+filePath; choosing it rebinds and
 * never PushDeleteTT.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PluginContext } from '@/pluginContext';
import {
	REBIND_BUTTON_LABEL,
	SYNC_DISCREPANCY_APPLY_LABEL,
	SYNC_DISCREPANCY_MODAL_TITLE,
	SYNC_DISCREPANCY_SKIP_LABEL,
} from '@/sync/massDeleteGuard';

const rebindVaultFromPlanned = vi.hoisted(() =>
	vi.fn(async () => ({
		rebound: 1,
		inserted: 0,
		skipped: 0,
		files: 1,
		written: 1,
		displacedIds: ['oldid01oldid01oldid01old1'],
	})),
);

vi.mock('obsidian', () => ({
	Notice: class {
		constructor(_msg?: string, _timeout?: number) {}
	},
	TFile: class {
		path = '';
	},
}));

vi.mock('@/sync/rebindVault', () => ({
	rebindVaultFromPlanned,
}));

import {
	applyConfirmRematch,
	confirmOffersRematch,
	plannedFromConfirmDeletionItems,
} from '@/sync/confirmRematch';

describe('UX-SYNC-CONFIRM-REBIND plannedFromConfirmDeletionItems / confirmOffersRematch', () => {
	it('maps Confirm rows with id+filePath to vault→TT rematch candidates', () => {
		const planned = plannedFromConfirmDeletionItems([
			{ title: 'A', id: 'aaaaaaaaaaaaaaaaaaaaaaaa', filePath: '10 Projects/p.md' },
			{ title: 'no-file', id: 'bbbbbbbbbbbbbbbbbbbbbbbb' },
			{ title: 'no-id', filePath: '10 Projects/q.md' },
			{ title: 'blank', id: '  ', filePath: '  ' },
		]);
		expect(planned).toHaveLength(1);
		expect(planned[0]).toMatchObject({
			id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
			taskId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
			kind: 'task',
			direction: 'vault-to-ticktick',
			action: 'delete',
			file: '10 Projects/p.md',
			title: 'A',
		});
	});

	it('offers Rematch when at least one vault→TT candidate has id+filePath', () => {
		expect(
			confirmOffersRematch([
				{ title: 'A', id: 'aaaaaaaaaaaaaaaaaaaaaaaa', filePath: 'p.md' },
			]),
		).toBe(true);
	});

	it('does not offer Rematch when id or filePath is missing', () => {
		expect(confirmOffersRematch([{ title: 'A', id: 'aaaaaaaaaaaaaaaaaaaaaaaa' }])).toBe(false);
		expect(confirmOffersRematch([{ title: 'A', filePath: 'p.md' }])).toBe(false);
		expect(confirmOffersRematch([{ title: 'A' }])).toBe(false);
		expect(confirmOffersRematch([])).toBe(false);
	});
});

describe('UX-SYNC-CONFIRM-REBIND TaskDeletionModal / Confirm wiring', () => {
	it('Confirm modal source offers REBIND_BUTTON_LABEL via confirmOffersRematch', () => {
		const confirm = readFileSync(join(__dirname, '../modals/TaskDeletionModal.ts'), 'utf8');
		expect(confirm).toContain('confirmOffersRematch');
		expect(confirm).toContain('REBIND_BUTTON_LABEL');
		expect(confirm).toContain('REBIND_BUTTON_DESC');
		expect(confirm).toContain('REBIND_VAULT_WIPE_HINT');
		expect(confirm).toContain('UX-SYNC-CONFIRM-REBIND');
		expect(confirm).toContain('rematchChosen');
		expect(confirm).toMatch(/DeletionPromptResult[\s\S]*rematch/);
		expect(confirm).toContain('SYNC_DISCREPANCY_MODAL_TITLE');
		expect(confirm).toContain('SYNC_DISCREPANCY_SKIP_LABEL');
		expect(confirm).toContain('SYNC_DISCREPANCY_APPLY_LABEL');
		expect(REBIND_BUTTON_LABEL.toLowerCase()).toContain('rebind');
		expect(SYNC_DISCREPANCY_MODAL_TITLE.toLowerCase()).toContain('discrepan');
		expect(SYNC_DISCREPANCY_SKIP_LABEL.toLowerCase()).toMatch(/don.?t delete/);
		expect(SYNC_DISCREPANCY_APPLY_LABEL.toLowerCase()).toContain('apply once');
	});

	it('held + Confirm both wire Rebind button (tightens #259 copy-only hole)', () => {
		const held = readFileSync(join(__dirname, '../modals/MassDeleteGuardModal.ts'), 'utf8');
		const confirm = readFileSync(join(__dirname, '../modals/TaskDeletionModal.ts'), 'utf8');
		expect(held).toContain('REBIND_BUTTON_LABEL');
		expect(confirm).toContain('REBIND_BUTTON_LABEL');
		expect(confirm).toContain('confirmOffersRematch');
	});

	it('TaskDeletionHandler Confirm rematch applies rebind and returns without TT delete', () => {
		const src = readFileSync(join(__dirname, '../services/TaskDeletionHandler.ts'), 'utf8');
		expect(src).toContain('applyConfirmRematch');
		expect(src).toContain('UX-SYNC-CONFIRM-REBIND');
		expect(src).toMatch(/if\s*\(\s*prompt\.rematch\s*\)[\s\S]{0,200}return\s*\[\]/);
		expect(src).toMatch(/confirmDeletion[\s\S]*applyConfirmRematch/);
	});

	it('checkDatabase residual Confirm rematch skips deletes', () => {
		const src = readFileSync(join(__dirname, '../services/checkDatabase.ts'), 'utf8');
		expect(src).toContain('applyConfirmRematch');
		expect(src).toContain('UX-SYNC-CONFIRM-REBIND');
		expect(src).toMatch(/if\s*\(\s*prompt\.rematch\s*\)[\s\S]{0,300}applyConfirmRematch/);
		expect(src).toMatch(/else if\s*\(\s*prompt\.confirmed\s*\)/);
	});
});

describe('UX-SYNC-CONFIRM-REBIND applyConfirmRematch', () => {
	beforeEach(() => {
		rebindVaultFromPlanned.mockClear();
		rebindVaultFromPlanned.mockResolvedValue({
			rebound: 1,
			inserted: 0,
			skipped: 0,
			files: 1,
			written: 1,
			displacedIds: ['oldid01oldid01oldid01old1'],
		});
	});

	it('rebinds via rebindVaultFromPlanned and never deletes TickTick', async () => {
		const deleteTaskApi = vi.fn();
		const deleteTaskRepo = vi.fn();
		const plugin = {
			taskRepository: {
				loadLocalTaskById: vi.fn(),
				loadAllLocalTasks: vi.fn(async () => [
					{ taskId: 'new1new1new1new1new1new1ne', deleted: false },
				]),
				deleteTask: deleteTaskRepo,
			},
			taskParser: {
				convertTaskToLine: vi.fn(),
			},
			tickTickRestAPI: {
				deleteTask: deleteTaskApi,
			},
			app: {
				vault: {
					getAbstractFileByPath: vi.fn(),
				},
			},
		} as unknown as PluginContext;

		const result = await applyConfirmRematch(plugin, [
			{
				title: 'A',
				id: 'new1new1new1new1new1new1ne',
				filePath: '10 Projects/p.md',
			},
		]);

		expect(rebindVaultFromPlanned).toHaveBeenCalledTimes(1);
		const plannedArg = rebindVaultFromPlanned.mock.calls[0][0];
		expect(plannedArg).toEqual([
			expect.objectContaining({
				taskId: 'new1new1new1new1new1new1ne',
				direction: 'vault-to-ticktick',
				file: '10 Projects/p.md',
			}),
		]);
		expect(result).toEqual({ rebound: 1, inserted: 0, skipped: 0, files: 1 });
		expect(deleteTaskApi).not.toHaveBeenCalled();
		expect(deleteTaskRepo).not.toHaveBeenCalled();
	});

	it('BUG-CONFIRM-REBIND-DUP: Confirm rematch opts into allowDisplaceLiveSameTitle', async () => {
		const plugin = {
			taskRepository: {
				loadLocalTaskById: vi.fn(),
				loadAllLocalTasks: vi.fn(async () => [
					{ taskId: '6ae82058d07c7a23f9eed592', deleted: false },
					{ taskId: '6ae82058d07c7a23f9eed586', deleted: false },
				]),
			},
			taskParser: { convertTaskToLine: vi.fn() },
			app: { vault: { getAbstractFileByPath: vi.fn() } },
		} as unknown as PluginContext;

		await applyConfirmRematch(plugin, [
			{
				title: 'journaling',
				id: '6ae82058d07c7a23f9eed592',
				filePath: '10 Projects/PKM - journaling.md',
			},
		]);

		expect(rebindVaultFromPlanned).toHaveBeenCalledTimes(1);
		const opts = rebindVaultFromPlanned.mock.calls[0][2];
		expect(opts).toMatchObject({ allowDisplaceLiveSameTitle: true });
		expect(opts.allLiveIds.has('6ae82058d07c7a23f9eed592')).toBe(true);
		expect(opts.allLiveIds.has('6ae82058d07c7a23f9eed586')).toBe(true);
	});

	it('no-ops without calling rebind when items lack id+filePath', async () => {
		const plugin = {
			taskRepository: {
				loadLocalTaskById: vi.fn(),
				loadAllLocalTasks: vi.fn(),
				deleteTask: vi.fn(),
			},
			taskParser: { convertTaskToLine: vi.fn() },
			tickTickRestAPI: { deleteTask: vi.fn() },
			app: { vault: { getAbstractFileByPath: vi.fn() } },
		} as unknown as PluginContext;

		const result = await applyConfirmRematch(plugin, [{ title: 'A', id: 'only-id' }]);
		expect(result).toEqual({ rebound: 0, inserted: 0, skipped: 0, files: 0 });
		expect(rebindVaultFromPlanned).not.toHaveBeenCalled();
		expect(plugin.tickTickRestAPI!.deleteTask).not.toHaveBeenCalled();
	});
});
