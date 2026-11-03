/**
 * ARCH-SYNC-INTENT-IDENTITY (#256 types + #257 tombstones + #258 DetachMarker drain).
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	selectDetachMarkerPlanned,
	withoutDetachMarkerPlanned,
} from '@/sync/applyDetachMarkers';
import {
	DEFAULT_MASS_DELETE_GUARD,
	evaluateMassDeleteGuard,
	planVaultTaskDeletions,
	type PlannedDeletion,
	type SideSnapshot,
} from '@/sync/massDeleteGuard';
import { rebindFileContent } from '@/sync/rebindVault';
import {
	SYNC_INTENT_PRECEDENCE,
	clearLinkTombstones,
	compareSyncIntentsByPrecedence,
	compileResidualDestructivesAfterIdentity,
	countDestructiveFromPlanned,
	countDestructiveSyncIntents,
	isDestructivePlannedDeletion,
	isDestructiveSyncIntent,
	isLinkTombstoned,
	linkTombstoneBlocksPushDeleteTT,
	mismatchImpliesAutoPushDeleteTT,
	plannedDeletionToSyncIntent,
	plannedDeletionsToSyncIntents,
	sortSyncIntentsByPrecedence,
	stampLinkTombstones,
	syncIntentPrecedenceRank,
	type SyncIntent,
	type SyncIntentKind,
} from '@/sync/syncIntent';

const cfg = { ...DEFAULT_MASS_DELETE_GUARD };

function side(partial: Partial<SideSnapshot> = {}): SideSnapshot {
	return {
		vaultTrackedCount: 40,
		dexieTaskCount: 40,
		ticktickSnapshotEmpty: false,
		vaultIndexIncomplete: false,
		...partial,
	};
}

function pushDelete(id: string): PlannedDeletion {
	return {
		id,
		taskId: id,
		kind: 'task',
		direction: 'vault-to-ticktick',
		action: 'delete',
		title: id,
		file: 'n.md',
	};
}

function detach(id: string): PlannedDeletion {
	return {
		id,
		taskId: id,
		kind: 'task',
		direction: 'ticktick-to-vault',
		action: 'detach',
		title: id,
		file: 'n.md',
	};
}

function pullStrip(id: string): PlannedDeletion {
	return {
		id,
		taskId: id,
		kind: 'task',
		direction: 'ticktick-to-vault',
		action: 'delete',
		title: id,
		file: 'n.md',
	};
}

describe('ARCH-SYNC-INTENT-IDENTITY', () => {
	it('covers five intents (+ comment subjects) with RU-documented kinds', () => {
		expect(SYNC_INTENT_PRECEDENCE).toEqual([
			'Link',
			'DetachMarker',
			'InsertLine',
			'PullStripVault',
			'PushDeleteTT',
		]);
		const kinds: SyncIntentKind[] = [...SYNC_INTENT_PRECEDENCE];
		expect(kinds).toHaveLength(5);
		expect(isDestructiveSyncIntent('Link')).toBe(false);
		expect(isDestructiveSyncIntent('DetachMarker')).toBe(false);
		expect(isDestructiveSyncIntent('InsertLine')).toBe(false);
		expect(isDestructiveSyncIntent('PullStripVault')).toBe(true);
		expect(isDestructiveSyncIntent('PushDeleteTT')).toBe(true);
	});

	it('precedence sorts Link ≻ DetachMarker ≻ InsertLine ≻ PullStripVault ≻ PushDeleteTT', () => {
		const intents: SyncIntent[] = [
			{ kind: 'PushDeleteTT', subject: 'task', id: 'd' },
			{ kind: 'Link', subject: 'task', id: 'a' },
			{ kind: 'PullStripVault', subject: 'comment', id: 'c' },
			{ kind: 'InsertLine', subject: 'task', id: 'i' },
			{ kind: 'DetachMarker', subject: 'task', id: 'b' },
		];
		const sorted = sortSyncIntentsByPrecedence(intents);
		expect(sorted.map(x => x.kind)).toEqual([
			'Link',
			'DetachMarker',
			'InsertLine',
			'PullStripVault',
			'PushDeleteTT',
		]);
		expect(syncIntentPrecedenceRank('Link')).toBeLessThan(syncIntentPrecedenceRank('DetachMarker'));
		expect(syncIntentPrecedenceRank('DetachMarker')).toBeLessThan(syncIntentPrecedenceRank('InsertLine'));
		expect(syncIntentPrecedenceRank('InsertLine')).toBeLessThan(syncIntentPrecedenceRank('PullStripVault'));
		expect(syncIntentPrecedenceRank('PullStripVault')).toBeLessThan(syncIntentPrecedenceRank('PushDeleteTT'));
		expect(compareSyncIntentsByPrecedence(intents[0]!, intents[1]!)).toBeGreaterThan(0);
	});

	it('maps PlannedDeletion rows: detach→DetachMarker; vault→TT delete→PushDeleteTT; TT→vault delete→PullStripVault', () => {
		expect(plannedDeletionToSyncIntent(detach('x')).kind).toBe('DetachMarker');
		expect(plannedDeletionToSyncIntent(pushDelete('y')).kind).toBe('PushDeleteTT');
		expect(plannedDeletionToSyncIntent(pullStrip('z')).kind).toBe('PullStripVault');
		expect(plannedDeletionToSyncIntent({
			id: 'c1',
			kind: 'comment',
			direction: 'vault-to-ticktick',
			action: 'delete',
			taskId: 't1',
		}).kind).toBe('PushDeleteTT');
		expect(plannedDeletionToSyncIntent({
			id: 'c2',
			kind: 'comment',
			direction: 'ticktick-to-vault',
			action: 'delete',
			taskId: 't1',
		}).kind).toBe('PullStripVault');
		expect(isDestructivePlannedDeletion(detach('x'))).toBe(false);
		expect(isDestructivePlannedDeletion(pushDelete('y'))).toBe(true);
	});

	it('threshold counts destructive intents only — DetachMarker volume does not trip mass-delete', () => {
		const manyDetach = Array.from({ length: 195 }, (_, i) => detach(`d${i}`));
		const fewWipe = Array.from({ length: 5 }, (_, i) => pushDelete(`w${i}`));
		const mixed = [...manyDetach, ...fewWipe];

		const counts = countDestructiveFromPlanned(mixed);
		expect(counts.taskDeletions).toBe(5);
		expect(counts.commentDeletions).toBe(0);
		expect(countDestructiveSyncIntents(plannedDeletionsToSyncIntents(mixed), 'task')).toBe(5);

		// 5 deletes on 40 tracked → under count threshold (10) → allow
		const under = evaluateMassDeleteGuard(mixed, side({ dexieTaskCount: 40, vaultTrackedCount: 40 }), cfg);
		expect(under.block).toBe(false);
		expect(under.reason).toBe('allow');
		expect(under.taskDeletions).toBe(5);

		// Same detach flood + 12 PushDeleteTT → threshold on destructives only
		const wipeHeavy = [
			...manyDetach,
			...Array.from({ length: 12 }, (_, i) => pushDelete(`p${i}`)),
		];
		const blocked = evaluateMassDeleteGuard(
			wipeHeavy,
			side({ dexieTaskCount: 40, vaultTrackedCount: 40 }),
			cfg,
		);
		expect(blocked.block).toBe(true);
		expect(blocked.reason).toBe('threshold');
		expect(blocked.taskDeletions).toBe(12);
		expect(blocked.percent).toBeCloseTo(30);

		// Detach-only plan never trips threshold (identity-safe)
		const detachOnly = evaluateMassDeleteGuard(
			manyDetach,
			side({ dexieTaskCount: 40, vaultTrackedCount: 40 }),
			cfg,
		);
		expect(detachOnly.block).toBe(false);
		expect(detachOnly.taskDeletions).toBe(0);
	});

	it('invariant: mismatch ≠ auto PushDeleteTT', () => {
		expect(mismatchImpliesAutoPushDeleteTT()).toBe(false);
		// A Link / InsertLine intent must never be classified as destructive wipe.
		const identity: SyncIntent[] = [
			{ kind: 'Link', subject: 'task', id: 'a', provenance: 'rewrite' },
			{ kind: 'InsertLine', subject: 'task', id: 'b' },
			{ kind: 'DetachMarker', subject: 'task', id: 'c', provenance: 'remote-gone' },
		];
		expect(countDestructiveSyncIntents(identity)).toBe(0);
		expect(identity.every(i => !isDestructiveSyncIntent(i.kind))).toBe(true);
	});
});

describe('ARCH-SYNC-INTENT-IDENTITY (#257 identity / Link tombstones)', () => {
	beforeEach(() => {
		clearLinkTombstones();
	});

	it('Link rewrite reports displacedIds (вытесненные id)', () => {
		const newId = 'newid01newid01newid01new1';
		const oldId = 'oldid01oldid01oldid01old1';
		const live = new Set([newId]);
		const snapshot = [
			'# P',
			'## Active Zone',
			`- [ ] Mixer %%[ticktick_id:: ${oldId}]%%`,
			'',
		].join('\n');
		const r = rebindFileContent(
			snapshot,
			[{ id: newId, title: 'Mixer', projectId: 'p', content: '', items: [] }] as never,
			live,
		);
		expect(r.rebound).toBe(1);
		expect(r.displacedIds).toEqual([oldId]);
		expect(r.next).toContain(`ticktick_id:: ${newId}`);
		expect(r.next).not.toContain(oldId);
	});

	it('Link tombstones block PushDeleteTT / Confirm for displaced id same run', () => {
		const displaced = 'oldid01oldid01oldid01old1';
		const linked = 'newid01newid01newid01new1';
		stampLinkTombstones([displaced], 'rewrite');
		expect(isLinkTombstoned(displaced)).toBe(true);
		expect(linkTombstoneBlocksPushDeleteTT(displaced)).toBe(true);
		expect(linkTombstoneBlocksPushDeleteTT(linked)).toBe(false);

		const planned: PlannedDeletion[] = [
			pushDelete(displaced),
			pushDelete(linked),
			detach('keep-detach'),
		];
		// After identity: linked id is present; displaced is tombstoned.
		const residual = compileResidualDestructivesAfterIdentity(
			planned,
			new Set([linked]),
		);
		expect(residual.map(p => p.id)).toEqual(['keep-detach']);
		expect(residual.every(p => plannedDeletionToSyncIntent(p).kind !== 'PushDeleteTT')).toBe(true);

		// Delete planner must not offer tombstoned id as vault→TT wipe.
		const fromPlanner = planVaultTaskDeletions({
			tasks: [
				{ taskId: displaced, title: 'Old', file: 'n.md', inPushScope: true },
				{ taskId: linked, title: 'New', file: 'n.md', inPushScope: true },
			],
			presentIds: new Set([linked]),
			untrustedFiles: new Set(),
			indexIncomplete: false,
		});
		expect(fromPlanner).toEqual([]);
	});

	it('post-identity presentIds drop successfully Linked PushDeleteTT; DetachMarker kept until drain', () => {
		const linked = 'live01live01live01live01li';
		const stillMissing = 'miss01miss01miss01miss01mi';
		const planned: PlannedDeletion[] = [
			pushDelete(linked),
			pushDelete(stillMissing),
			detach('remote-gone-1'),
		];
		const residual = compileResidualDestructivesAfterIdentity(
			planned,
			new Set([linked]),
		);
		expect(residual.map(p => p.id).sort()).toEqual(['miss01miss01miss01miss01mi', 'remote-gone-1'].sort());
		expect(plannedDeletionToSyncIntent(residual.find(p => p.id === stillMissing)!).kind).toBe('PushDeleteTT');
		expect(plannedDeletionToSyncIntent(residual.find(p => p.id === 'remote-gone-1')!).kind).toBe('DetachMarker');
	});
});

describe('ARCH-SYNC-INTENT-IDENTITY (#258 DetachMarker drain)', () => {
	it('selectDetachMarkerPlanned / withoutDetachMarkerPlanned split remote-gone from PushDeleteTT', () => {
		const planned: PlannedDeletion[] = [
			pushDelete('still-missing-id-00000001'),
			detach('remote-gone-aaaaaaaaaaaa'),
			detach('remote-gone-bbbbbbbbbbbb'),
		];
		const det = selectDetachMarkerPlanned(planned);
		expect(det).toHaveLength(2);
		expect(det.every(p => plannedDeletionToSyncIntent(p).kind === 'DetachMarker')).toBe(true);
		const rest = withoutDetachMarkerPlanned(planned);
		expect(rest).toHaveLength(1);
		expect(plannedDeletionToSyncIntent(rest[0]!).kind).toBe('PushDeleteTT');
	});

	it('after Link residual + withoutDetachMarkerPlanned, hold bag has no DetachMarker (drain)', () => {
		const linked = 'live02live02live02live02li';
		const planned: PlannedDeletion[] = [
			pushDelete(linked),
			pushDelete('miss02miss02miss02miss02mi'),
			detach('remote-gone-cccccccccccc'),
		];
		const afterIdentity = compileResidualDestructivesAfterIdentity(
			planned,
			new Set([linked]),
		);
		const residual = withoutDetachMarkerPlanned(afterIdentity);
		expect(residual.map(p => p.id)).toEqual(['miss02miss02miss02miss02mi']);
		expect(residual.every(p => plannedDeletionToSyncIntent(p).kind === 'PushDeleteTT')).toBe(true);
	});

	it('rematchPhase runs DetachMarker drain even when Link candidate list is empty', () => {
		const src = readFileSync(join(__dirname, '../sync/phases/rematchPhase.ts'), 'utf8');
		expect(src).toContain('rematchLink === undefined');
		expect(src).toContain('applyDetachMarkerPlanned');
		expect(src).toContain('withoutDetachMarkerPlanned');
		expect(src).toContain('#258');
	});
});
