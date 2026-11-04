/**
 * Owner-facing sync notices for task create / re-attach.
 * Case: UX-NOTICE-REATTACH — never say «created» when the TickTick task already existed.
 */

export function formatTaskCreatedNotice(title: string, id: string): string {
	return `New TickTick task created: ${title} (ID: ${id})`;
}

/** Marker was missing; line rebound to an existing TickTick task (same title+file). */
export function formatTaskReattachedNotice(title: string, id: string): string {
	return `Reattached existing TickTick task (marker was missing): ${title} (ID: ${id})`;
}

/**
 * BUG-TT-DUP-CREATE-ON-STRIP-SYNC — refused createTask because same-title live
 * peers already exist under the parent (ambiguous orphans or vault keeper).
 */
export function formatTaskCreateSkippedNotice(
	title: string,
	reason: 'ambiguous-orphans' | 'already-linked-same-title',
): string {
	if (reason === 'already-linked-same-title') {
		return `Skipped creating TickTick task «${title}»: a same-title task is already linked in this note. Remove the extra unmarked line or use Synchronize → Rebind.`;
	}
	return `Skipped creating TickTick task «${title}»: multiple unlinked same-title TickTick copies exist under the same parent. Use Synchronize → Deduplicate / Rebind — do not Sync-create another.`;
}
