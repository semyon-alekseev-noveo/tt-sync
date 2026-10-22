import type { TFile } from 'obsidian';
import type { ITask } from '@/api/types/Task';

export interface TaskModifications {
	titleModified: boolean;
	tagsModified: boolean;
	statusModified: boolean;
	datesModified: boolean;
	parentIdModified: boolean;
	priorityModified: boolean;
	taskItemsModified: boolean;
	notesModified: boolean;
	projectMoved: boolean;
	repeatFlagModified: boolean;
	remindersModified: boolean;
}

/**
 * A task found in a vault file that is neither in the local cache nor on
 * TickTick. Collected during a sync scan so all such tasks (across all files)
 * can be confirmed for deletion in a single dialog.
 */
export interface PendingTickTickDeletion {
	file: TFile;
	filepath: string;
	lineTask: ITask;
}
