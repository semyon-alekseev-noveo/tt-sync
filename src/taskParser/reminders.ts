import type { TaskParser } from '@/taskParser/TaskParser';
import type { ITask, Reminder } from '@/api/types/Task';
import { keywords, REGEX } from '@/taskParser/regex';
import { normalizeTrigger, parseReminderText, secondsToShorthand, triggerToSeconds } from '@/utils/ReminderConverter';

/** Reminder parse / format / preserve (line ↔ TickTick). */
export class TaskParserReminders {
	addRemindersToLine(this: TaskParser, resultLine: string, task: ITask): string {
		if (!task.reminders?.length) {
			return resultLine;
		}
		for (const reminder of task.reminders) {
			const seconds = triggerToSeconds(reminder.trigger);
			if (seconds === null) {
				continue;
			}
			resultLine += ` ${keywords.REMINDER} ${secondsToShorthand(seconds)}`;
		}
		return resultLine;
	}
	
	getRemindersFromLine(this: TaskParser, lineText: string): { reminders: Reminder[]; clear: boolean } {
		const reminders: Reminder[] = [];
		let clear = false;
		for (const match of lineText.matchAll(REGEX.REMINDER_RULE)) {
			const parsed = parseReminderText(match[1]);
			if (!parsed) {
				continue;
			}
			if ('clear' in parsed) {
				clear = true;
			} else {
				reminders.push({ trigger: parsed.trigger });
			}
		}
		if (clear) {
			return { reminders: [], clear: true };
		}
		return { reminders, clear: false };
	}
	
	areRemindersChanged(this: TaskParser, lineTask: ITask, savedTask: ITask): boolean {
		const lineTriggers = (lineTask.reminders || []).map(r => normalizeTrigger(r.trigger));
		const savedTriggers = (savedTask.reminders || []).map(r => normalizeTrigger(r.trigger));
		const sort = (arr: string[]) => [...arr].sort();
		if (lineTask.clearReminders && savedTriggers.length > 0) {
			return true;
		}
		if (lineTriggers.length !== savedTriggers.length) {
			return true;
		}
		return JSON.stringify(sort(lineTriggers)) !== JSON.stringify(sort(savedTriggers));
	}
	
	preserveReminders(this: TaskParser, lineTask: ITask, savedTask: ITask | null | undefined): void {
		if (lineTask.clearReminders) {
			lineTask.reminders = [];
			return;
		}
		const savedReminders = savedTask?.reminders;
		if (!savedReminders?.length) {
			return;
		}
		if (!lineTask.reminders || lineTask.reminders.length === 0) {
			lineTask.reminders = savedReminders;
			return;
		}
		lineTask.reminders = lineTask.reminders.map(reminder => {
			if (reminder.id) {
				return reminder;
			}
			const match = savedReminders.find(saved => normalizeTrigger(saved.trigger) === normalizeTrigger(reminder.trigger));
			return match ? { ...reminder, id: match.id, trigger: match.trigger } : reminder;
		});
	}
}
