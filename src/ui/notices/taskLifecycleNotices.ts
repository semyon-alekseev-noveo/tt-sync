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
