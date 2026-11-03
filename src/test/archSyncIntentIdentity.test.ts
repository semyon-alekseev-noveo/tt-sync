/**
 * ARCH-SYNC-INTENT-IDENTITY (#256) — intent types, precedence, destructive-only threshold.
 * Identity-before-plan / Link tombstones: #257 (out of scope here).
 */
import { describe, expect, it } from 'vitest';
import {
	DEFAULT_MASS_DELETE_GUARD,
	evaluateMassDeleteGuard,
	type PlannedDeletion,
	type SideSnapshot,
} from '@/sync/massDeleteGuard';
import {
	SYNC_INTENT_PRECEDENCE,
	compareSyncIntentsByPrecedence,
	countDestructiveFromPlanned,
	countDestructiveSyncIntents,
	isDestructivePlannedDeletion,
	isDestructiveSyncIntent,
	mismatchImpliesAutoPushDeleteTT,
	plannedDeletionToSyncIntent,
	plannedDeletionsToSyncIntents,
	sortSyncIntentsByPrecedence,
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
