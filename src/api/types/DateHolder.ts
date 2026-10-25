/**
 * Parsed Obsidian Tasks emoji-date fields held on a vault task line.
 * Kept separate from `ITask` / `DateMan` so type imports do not cycle
 * `api/types/Task` ↔ `dateMan` (TECH-CIRC / #66).
 */
export interface date_time_type {
	hasATime: boolean;
	date: string | null;
	time: string | null;
	isoDate: string | null;
	emoji: string | null;
}

export interface date_holder_type {
	[key: string]: date_time_type | boolean | null;
	isAllDay: boolean;
	createdTime: date_time_type | null;
	scheduled_date: date_time_type | null;
	startDate: date_time_type | null;
	dueDate: date_time_type | null;
	completedTime: date_time_type | null;
	cancelled_date: date_time_type | null;
}
