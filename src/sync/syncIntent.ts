/**
 * ARCH-SYNC-INTENT-IDENTITY (#256) — typed sync intents + precedence +
 * destructive-only threshold helpers.
 *
 * Full identity-before-plan wiring is #257; this module is the shared vocabulary
 * planners can adopt gradually.
 *
 * Precedence (приоритет): Link ≻ DetachMarker ≻ InsertLine ≻ PullStripVault ≻ PushDeleteTT.
 * Threshold (порог mass-delete) counts **destructive** intents only.
 * Invariant: mismatch ≠ auto PushDeleteTT (удалить в TickTick).
 */

/** Subject of an intent: task line or comment sibling. */
export type SyncIntentSubject = 'task' | 'comment';

/**
 * Sync intent kinds (intent = намерение мутации).
 *
 * - Link — привязка маркера
 * - DetachMarker — снять id, текст оставить
 * - InsertLine — вставить строку
 * - PullStripVault — убрать строку из vault
 * - PushDeleteTT — удалить в TickTick
 */
export type SyncIntentKind =
	| 'Link'
	| 'DetachMarker'
	| 'InsertLine'
	| 'PullStripVault'
	| 'PushDeleteTT';

/** Provenance (происхождение) — used by #257 Link tombstones / false-wipe block. */
export type SyncIntentProvenance =
	| 'user-removed'
	| 'rewrite'
	| 'remote-gone'
	| 'unknown';

export interface SyncIntent {
	kind: SyncIntentKind;
	subject: SyncIntentSubject;
	id: string;
	taskId?: string;
	title?: string;
	file?: string;
	provenance?: SyncIntentProvenance;
}

/** Higher rank applies first. Link = 0 … PushDeleteTT = 4. */
export const SYNC_INTENT_PRECEDENCE: readonly SyncIntentKind[] = [
	'Link',
	'DetachMarker',
	'InsertLine',
	'PullStripVault',
	'PushDeleteTT',
] as const;

const PRECEDENCE_RANK: ReadonlyMap<SyncIntentKind, number> = new Map(
	SYNC_INTENT_PRECEDENCE.map((kind, index) => [kind, index]),
);

export function syncIntentPrecedenceRank(kind: SyncIntentKind): number {
	return PRECEDENCE_RANK.get(kind) ?? Number.MAX_SAFE_INTEGER;
}

/** Sort comparator: lower rank first (Link before PushDeleteTT). */
export function compareSyncIntentsByPrecedence(a: SyncIntent, b: SyncIntent): number {
	const byKind = syncIntentPrecedenceRank(a.kind) - syncIntentPrecedenceRank(b.kind);
	if (byKind !== 0) return byKind;
	if (a.subject !== b.subject) return a.subject < b.subject ? -1 : 1;
	return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function sortSyncIntentsByPrecedence(intents: readonly SyncIntent[]): SyncIntent[] {
	return [...intents].sort(compareSyncIntentsByPrecedence);
}

/**
 * Destructive intents (destructive = разрушающие) for threshold / discrepancy UI:
 * PullStripVault (убрать строку из vault) and PushDeleteTT (удалить в TickTick).
 * Link / DetachMarker / InsertLine are identity-safe and must not inflate the threshold.
 */
export function isDestructiveSyncIntent(kind: SyncIntentKind): boolean {
	return kind === 'PullStripVault' || kind === 'PushDeleteTT';
}

export function countDestructiveSyncIntents(
	intents: readonly SyncIntent[],
	subject?: SyncIntentSubject,
): number {
	return intents.filter(
		item => isDestructiveSyncIntent(item.kind) && (subject == null || item.subject === subject),
	).length;
}

/**
 * Documented invariant for tests and callers: a title/id mismatch alone must never
 * become an automatic PushDeleteTT (удалить в TickTick). Confirm / Apply only after
 * proven user-removed or explicit authorize (#257+).
 */
export function mismatchImpliesAutoPushDeleteTT(): false {
	return false;
}

/** Minimal shape shared with `PlannedDeletion` so this module stays dependency-light. */
export interface PlannedDeletionLike {
	id: string;
	kind: SyncIntentSubject;
	direction: 'vault-to-ticktick' | 'ticktick-to-vault';
	action: 'delete' | 'close' | 'detach' | 'mark-cancelled';
	title?: string;
	file?: string;
	taskId?: string;
}

/**
 * Map a legacy planned deletion row to a SyncIntent.
 * Detach / mark-cancelled → DetachMarker (снять id, текст оставить).
 * vault→TT delete/close → PushDeleteTT; TT→vault delete → PullStripVault.
 */
export function plannedDeletionToSyncIntent(item: PlannedDeletionLike): SyncIntent {
	const base = {
		subject: item.kind,
		id: item.id,
		taskId: item.taskId,
		title: item.title,
		file: item.file,
	};
	if (item.action === 'detach' || item.action === 'mark-cancelled') {
		return { ...base, kind: 'DetachMarker', provenance: 'remote-gone' };
	}
	if (item.direction === 'vault-to-ticktick') {
		return { ...base, kind: 'PushDeleteTT' };
	}
	return { ...base, kind: 'PullStripVault' };
}

export function plannedDeletionsToSyncIntents(
	planned: readonly PlannedDeletionLike[],
): SyncIntent[] {
	return planned.map(plannedDeletionToSyncIntent);
}

/** Whether a legacy planned row counts toward the mass-delete threshold. */
export function isDestructivePlannedDeletion(item: PlannedDeletionLike): boolean {
	return isDestructiveSyncIntent(plannedDeletionToSyncIntent(item).kind);
}

/**
 * Threshold counters from a mixed plan: identity intents (Link / Detach / Insert)
 * and DetachMarker rows from legacy planners do not inflate these numbers.
 */
export function countDestructiveFromPlanned(planned: readonly PlannedDeletionLike[]): {
	taskDeletions: number;
	commentDeletions: number;
} {
	const intents = plannedDeletionsToSyncIntents(planned);
	return {
		taskDeletions: countDestructiveSyncIntents(intents, 'task'),
		commentDeletions: countDestructiveSyncIntents(intents, 'comment'),
	};
}
