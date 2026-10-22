import log from '@/utils/logger';
import type { TaskParser } from '@/taskParser/TaskParser';
import { isDetached } from '@/detach';
import { REGEX, prioritySymbols, Priority, priorityMapping, taskRegex, taskIDRegex, status_regex } from '@/taskParser/regex';
import type { ITask } from '@/api/types/Task';
import { sha256 } from 'crypto-hash';
import { getSettings } from '@/settings';

/** Indentation, checkbox, priority, title/content stripping, line shape. */
export class TaskParserStructure {
	getTaskContentFromLineText(this: TaskParser, lineText: string) {
		let taskContent = lineText.replace(REGEX.TASK_CONTENT.REMOVE_INLINE_METADATA, '')
			.replace(REGEX.LOOSE_TICKTICK_ID_FRAGMENT, '')
			.replace(REGEX.TASK_CONTENT.REMOVE_TickTick_LINK, '')
			.replace(REGEX.TASK_CONTENT.REMOVE_PRIORITY, '')
			.replace(REGEX.TASK_CONTENT.REMOVE_RECURRENCE, '')
			.replace(REGEX.TASK_CONTENT.REMOVE_REMINDER, '')
			.replace(REGEX.TASK_CONTENT.REMOVE_TAGS, ' ')
			.replace(REGEX.TASK_CONTENT.REMOVE_CHECKBOX, '')
			.replace(REGEX.TASK_CONTENT.REMOVE_CHECKBOX_WITH_INDENTATION, '')
			.replace(REGEX.TASK_CONTENT.REMOVE_SPACE, '');
	
		taskContent = this.stripOBSUrl(taskContent);
		taskContent = this.plugin.dateMan?.stripDatesFromLine(taskContent) ?? taskContent;
		return (taskContent);
	}
	
	isTaskOpen(this: TaskParser, line: string) {
		let result = new RegExp(status_regex, 'gmi').exec(line);
		if (result) {
			return (result[2].search(/[xX]/) < 0);
		} else {
			throw new Error(`Status not found in line: ${line}`);
		}
	}
	
	getAllTagsFromLineText(this: TaskParser, lineText: string): string[] {
		const tags = [...lineText.matchAll(REGEX.ALL_TAGS)];
		return tags.map(tag => tag[0].replace(/^[\s]*#/, ''));
	}
	
	isTaskCheckboxChecked(this: TaskParser, lineText: string) {
		return (REGEX.TASK_CHECKBOX_CHECKED.test(lineText));
	}
	
	isIndentedTask(this: TaskParser, text: string) {
		return (REGEX.TASK_INDENTATION.test(text));
	}
	
	getNumTabs(this: TaskParser, lineText: string) {
		const match = REGEX.TAB_INDENTATION.exec(lineText);
		return match ? match[1].length : 0;
	}
	
	getTabs(this: TaskParser, lineText: string) {
		const numTabs = this.getNumTabs(lineText);
		let tabs = '';
		for (let i = 0; i < numTabs; i++) {
			tabs = tabs + '\t';
		}
		return tabs;
	}
	
	isTaskItem(this: TaskParser, line: string, parentTabs: number): boolean {
		if (!this.isMarkdownTask(line)) return false;
		if (isDetached(line)) return false; // a detached line is plain text, never a TickTick checklist item
		const lineTabs = this.getNumTabs(line);
		if (lineTabs !== parentTabs + 1) return false;
		const afterTabs = line.slice(lineTabs);
		return afterTabs.startsWith('- [');
	}
	
	isNoteLevel(this: TaskParser, line: string, parentTabs: number): boolean {
		if (!this.isMarkdownTask(line)) return false;
		const lineTabs = this.getNumTabs(line);
		if (lineTabs > parentTabs + 1) return false;
		for (let p = parentTabs; p <= parentTabs + 1; p++) {
			if (line.startsWith('\t'.repeat(p) + '  ')) return true;
		}
		return false;
	}
	
	getIndentation(this: TaskParser, lineText: string) {
		const match = lineText.match(/^([\s\t>]*)/);
		if (match) {
			return match[1];
		} else {
			return '';
		}
	}
	
	getTaskPriority(this: TaskParser, lineText: string) {
		let priority = '0';
		const priorityMatch = lineText.match(REGEX.priorityRegex);
		if (priorityMatch !== null) {
			priority = this.parsePriority(priorityMatch[1]);
		}
	
		return priority;
	}
	
	removeTaskIndentation(this: TaskParser, text: string): string {
		const regex = /^([ \t]*)?- \[(x| )\] /;
		return text.replace(regex, '- [$2] ');
	}
	
	isLineBlank(this: TaskParser, lineText: string) {
		return (REGEX.BLANK_LINE.test(lineText));
	}
	
	isMarkdownTask(this: TaskParser, str: string): boolean {
		if (str) {
			const forRealRegex = taskRegex;
			return forRealRegex.test(str);
		}
		return false;
	}
	
	parsePriority(this: TaskParser, p: string): Priority {
		// const { prioritySymbols } = prioritySymbols;
		switch (p) {
			case prioritySymbols.Lowest:
				return Priority.None;
			case prioritySymbols.Low:
				return Priority.Low;
			case prioritySymbols.Medium:
				return Priority.Medium;
			case prioritySymbols.High:
			case prioritySymbols.Highest:
				return Priority.Highest;
			default:
				return Priority.None;
		}
	}
	
	translateTickTickToObsidian(this: TaskParser, ticktickPriority: number) {
		const mapping = priorityMapping.find((item) => item.ticktick === ticktickPriority);
		return mapping ? mapping.obsidian : null;
	}
	
	translateObsidianToTickTick(this: TaskParser, obsidianPriority: string | null): number | null {
		const mapping = priorityMapping.find((item) => item.obsidian === obsidianPriority);
		return mapping ? mapping.ticktick : null;
	}
	
	taskFromLine(this: TaskParser, line: string) {
		let matches = taskRegex.exec(line);
		if (!matches) {
			return null;
		}
	
		let checkBox = matches[3] || '';
	
		//Anything other than 'x' is a not done state. Deal with it accordingly.
		//https://publish.obsidian.md/tasks/Getting+Started/Statuses
		const status = checkBox.toLowerCase() == 'x';
		let description = matches[4] || '';
		description = description.replace(taskIDRegex, '');
		let indent = matches[1] ? matches[1].length : 0;
	
		return {
			line,
			status,
			description,
			indent
		};
	}
	
	getAllTags(this: TaskParser) {
		// 	const tags = Object.keys(this.app.metadataCache.getTags())
		// 	tags.forEach(tag => log.debug(tag))
		// 	// foo.forEach(tag => log.debug(tag));
	}
	
	async getLineHash(this: TaskParser, resultLine: string) {
		try {
			return await sha256(resultLine);
		} catch (e) {
			log.error('Hashing error.', e);
		}
	}
	
	escapeRegExp(this: TaskParser, str: string) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
	
	getObsidianUrlFromFilepath(this: TaskParser, filepath: string) {
		// if (getSettings().debugMode) {
		// log.debug("Getting OBS path for: ", filepath)
		// }
		const url = encodeURI(`obsidian://open?vault=${this.app.vault.getName()}&file=${filepath}`);
		const obsidianUrl = `[${filepath}](${url})`;
		return (obsidianUrl);
	}
	
	addChildToParent(this: TaskParser, parentTask: ITask, childId: string) {
		if (!parentTask.childIds) {
			parentTask.childIds = [];
		}
		parentTask.childIds.push(childId);
		return parentTask;
	}
	
	stripOBSUrl(this: TaskParser, title: string | undefined): string {
		//TODO: this is ugly but I can't find a clean regex to make it happen.
		let result = title;
		if (result) {
			let eoURL = result.lastIndexOf('.md)');
			let boURL = 0;
			if (eoURL > 0) {
				for (let i = eoURL; i > 0; i--) {
					if (result[i] === '[') {
						boURL = i;
						break;
					}
				}
				if (boURL > 0) {
					result = result.substring(0, boURL);
					result = result + result.substring(eoURL + 4); //magic number is len of .md + 1
				}
			}
		}
		return (result ?? '').trim();
	}
}
