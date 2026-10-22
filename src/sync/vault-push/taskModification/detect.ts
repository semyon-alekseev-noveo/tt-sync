import type { ITask } from '@/api/types/Task';
import type { ITaskRecord } from '@/services/NewFileMap';
import { getSettings } from '@/settings';
import { normalizeRepeatFlag } from '@/utils/RecurrenceConverter';
import type { TaskModificationDetector } from '@/sync/vault-push/taskModification/TaskModificationDetector';
import type { TaskModifications } from '@/sync/vault-push/taskModification/types';

/** Field-level change detection between vault line task and saved TickTick/Dexie task. */
export class TaskModificationDetect {
	/**
	 * Detect all modifications between line task and saved task
	 */
	detectModifications(this: TaskModificationDetector, lineTask: ITask, savedTask: ITask, taskRecord: ITaskRecord): TaskModifications {
		return {
			titleModified: this.plugin.taskParser?.isTitleChanged(lineTask, savedTask) || false,
			tagsModified: this.plugin.taskParser?.isTagsChanged(lineTask, savedTask) || false,
			statusModified: this.plugin.taskParser?.isStatusChanged(lineTask as unknown as Record<string, unknown>, savedTask as unknown as Record<string, unknown>) || false,
			datesModified: this.plugin.dateMan?.areDatesChanged(lineTask, savedTask) || false,
			parentIdModified: this.plugin.taskParser?.isParentIdChanged(lineTask, savedTask) || false,
			priorityModified: lineTask.priority !== savedTask.priority,
			taskItemsModified: this.plugin.taskParser.areItemsChanged(lineTask.items, savedTask.items),
			notesModified: this.detectNotesModification(lineTask, savedTask),
			projectMoved: false, // Will be set separately
			repeatFlagModified: normalizeRepeatFlag(lineTask.repeatFlag) !== normalizeRepeatFlag(savedTask.repeatFlag),
			remindersModified: this.plugin.taskParser?.areRemindersChanged(lineTask, savedTask) || false
		};
	}

	/**
	 * Detect if notes/description changed
	 */
	detectNotesModification(this: TaskModificationDetector, lineTask: ITask, savedTask: ITask): boolean {
		if (!getSettings().syncNotes) {
			return false;
		}

		if (lineTask.content) {
			return this.plugin.taskParser.areNotesChanged(lineTask.content, savedTask.content);
		} else if (lineTask.desc) {
			return this.plugin.taskParser.areNotesChanged(lineTask.desc, savedTask.desc);
		}

		return false;
	}

	/**
	 * Check if there are any content changes (excluding status)
	 */
	hasContentChanges(this: TaskModificationDetector, modifications: TaskModifications): boolean {
		return modifications.titleModified ||
			modifications.tagsModified ||
			modifications.datesModified ||
			modifications.parentIdModified ||
			modifications.priorityModified ||
			modifications.taskItemsModified ||
			modifications.notesModified ||
			modifications.projectMoved ||
			modifications.repeatFlagModified ||
			modifications.remindersModified;
	}
}
