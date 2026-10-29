/**
 * ID-CHAIN #231 — vault backup restore identity (D10–D13).
 */
import { describe, expect, it } from 'vitest';
import {
	evaluateMassDeleteGuard,
	isConflictCopyPath,
	massDeleteSettingsFrom,
	planVaultTaskDeletions,
	canOfferRematch,
	isRestoreShapedHold,
	DEFAULT_MASS_DELETE_GUARD,
	type PlannedDeletion,
} from '@/sync/massDeleteGuard';
import {
	findRebindLineIndex,
	rebindFileContent,
	rebindVaultFromPlanned,
} from '@/sync/rebindVault';

const cfg = { ...DEFAULT_MASS_DELETE_GUARD };

describe('ID-VAULT-RESTORE-MATCH', () => {
	it('matching markers → no vault→TT deletes; quiet allow', () => {
		const ids = ['match01match01match01mat1', 'match02match02match02mat2'];
		const planned = planVaultTaskDeletions({
			tasks: ids.map((taskId, i) => ({
				taskId,
				title: `T${i}`,
				file: '10 Projects/p.md',
				inPushScope: true,
			})),
			presentIds: new Set(ids),
			untrustedFiles: new Set(),
			indexIncomplete: false,
		});
		expect(planned).toEqual([]);
		const decision = evaluateMassDeleteGuard(planned, {
			vaultTrackedCount: 2,
			dexieTaskCount: 2,
			ticktickSnapshotEmpty: false,
			vaultIndexIncomplete: false,
		}, massDeleteSettingsFrom(cfg));
		expect(decision.block).toBe(false);
		expect(decision.reason).toBe('allow');
	});
});

describe('ID-VAULT-RESTORE-TEXT-ONLY / ID-TEXT-NO-MARKER', () => {
	it('binds unmarked checkbox by title (no insert dup)', () => {
		const id = 'textonlytextonlytextonly01';
		const live = new Set([id]);
		const snapshot = '# P\n\n## Active Zone\n- [ ] Mixer only\n';
		const r = rebindFileContent(
			snapshot,
			[{ id, title: 'Mixer only', projectId: 'p', content: '', items: [] }] as never,
			live,
		);
		expect(r.rebound).toBe(1);
		expect(r.needInsert).toHaveLength(0);
		expect(r.next).toContain(`ticktick_id:: ${id}`);
		expect(r.next.split('Mixer only').length - 1).toBe(1);
		expect(findRebindLineIndex(
			['- [ ] Mixer only'],
			'Mixer only',
			id,
			live,
		)).toBe(0);
	});

	it('held vault→TT for unmarked lines offers Rebind, not silent Apply', () => {
		const planned: PlannedDeletion[] = planVaultTaskDeletions({
			tasks: [{
				taskId: 'live01live01live01live01li',
				title: 'Mixer only',
				file: '10 Projects/p.md',
				inPushScope: true,
			}],
			presentIds: new Set(), // text-only vault — no markers
			untrustedFiles: new Set(),
			indexIncomplete: false,
		});
		expect(planned).toHaveLength(1);
		expect(canOfferRematch(planned)).toBe(true);
		expect(isRestoreShapedHold(planned)).toBe(true);
	});
});

describe('ID-VAULT-RESTORE-CONFLICT', () => {
	it('conflict copy paths are recognized and do not plan vault→TT deletes', () => {
		const path = '10 Projects/p (Conflicted copy laptop 2026).md';
		expect(isConflictCopyPath(path)).toBe(true);
		const planned = planVaultTaskDeletions({
			tasks: [{
				taskId: 'c1c1c1c1c1c1c1c1c1c1c1c1',
				title: 'X',
				file: path,
				inPushScope: true,
			}],
			presentIds: new Set(),
			untrustedFiles: new Set([path]),
			indexIncomplete: false,
		});
		expect(planned).toEqual([]);
	});

	it('one unmarked line + two same-title tasks: bind once, skip second insert', () => {
		const a = 'dupadupadupadupadupadupa01';
		const b = 'dupbdupbdupbdupbdupbdupb02';
		const live = new Set([a, b]);
		const snapshot = '# P\n\n## Active Zone\n- [ ] Same Title\n';
		const r = rebindFileContent(
			snapshot,
			[
				{ id: a, title: 'Same Title', projectId: 'p', content: '', items: [] },
				{ id: b, title: 'Same Title', projectId: 'p', content: '', items: [] },
			] as never,
			live,
		);
		expect(r.rebound).toBe(1);
		expect(r.needInsert).toHaveLength(0);
		expect(r.skipped).toBe(1);
		expect(r.next).toContain(`ticktick_id:: ${a}`);
		expect(r.next).not.toContain(`ticktick_id:: ${b}`);
		expect(r.next.split('Same Title').length - 1).toBe(1);
	});

	it('rebindVaultFromPlanned skips conflict copy paths', async () => {
		const path = 'note (Conflicted copy 1).md';
		const planned: PlannedDeletion[] = [{
			id: 'x1x1x1x1x1x1x1x1x1x1x1x1',
			taskId: 'x1x1x1x1x1x1x1x1x1x1x1x1',
			kind: 'task',
			direction: 'vault-to-ticktick',
			action: 'delete',
			file: path,
			title: 'A',
		}];
		const writes: string[] = [];
		const result = await rebindVaultFromPlanned(planned, {
			loadLiveTask: async (taskId) => ({
				taskId,
				deleted: false,
				task: { id: taskId, projectId: 'p', title: 'A', content: '', items: [] },
			}),
			readFile: async () => '#\n- [ ] A\n',
			writeFile: async (p) => { writes.push(p); },
			convertTaskToLine: async (task) =>
				`- [ ] ${task.title} %%[ticktick_id:: ${task.id}]%%`,
		});
		expect(writes).toEqual([]);
		expect(result.files).toBe(0);
		expect(result.skipped).toBeGreaterThanOrEqual(1);
	});
});
