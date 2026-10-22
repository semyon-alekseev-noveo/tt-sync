import type { App } from 'obsidian';
import type { PluginContext } from '@/pluginContext';
import { applyMixins } from '@/taskParser/applyMixins';
import { TaskParserReminders } from '@/taskParser/reminders';
import { TaskParserMarkers } from '@/taskParser/markers';
import { TaskParserStructure } from '@/taskParser/structure';
import { TaskParserDiff } from '@/taskParser/diff';
import { TaskParserNotes } from '@/taskParser/notes';
import { TaskParserConvertToLine } from '@/taskParser/convertToLine';
import { TaskParserConvertToTask } from '@/taskParser/convertToTask';

/** Facade: line ↔ TickTick task parse/format. Methods live in concern mixins. */
export interface TaskParser extends
	TaskParserReminders,
	TaskParserMarkers,
	TaskParserStructure,
	TaskParserDiff,
	TaskParserNotes,
	TaskParserConvertToLine,
	TaskParserConvertToTask {}

export class TaskParser {
	app: App;
	plugin: PluginContext;

	constructor(app: App, plugin: PluginContext) {
		this.app = app;
		this.plugin = plugin;
	}
}

applyMixins(TaskParser, [
	TaskParserReminders,
	TaskParserMarkers,
	TaskParserStructure,
	TaskParserDiff,
	TaskParserNotes,
	TaskParserConvertToLine,
	TaskParserConvertToTask,
]);
