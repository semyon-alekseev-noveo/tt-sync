import type { TaskParser } from '@/taskParser/TaskParser';
import type { ITask, ITaskItem } from '@/api/types/Task';
import type { NewFileMap, ITaskRecord } from '@/services/NewFileMap';
import { REGEX } from '@/taskParser/regex';
import { abyssDescriptionToNote, abyssLinesToNote, noteToAbyssLines, childIndent } from '@/abyssFormat';
import { useAbyssCommentsApi } from '@/abyssCommentSync';
import { getSettings } from '@/settings';

/** Note / checklist item payload between vault lines and ITask. */
export class TaskParserNotes {
	getTaskPayLoad(this: TaskParser, fileMap: NewFileMap | null, TickTick_id: string, noteURL: string, inTaskRecord?: ITaskRecord): {
		description: string,
		content: string,
		taskItems: ITaskItem []
	} {
		if (!fileMap) {
			return { description: '', content: '', taskItems: [] };
		}
	
		const taskRecord = inTaskRecord || fileMap.getTaskRecord(TickTick_id);
		const taskItems: ITaskItem[] = [];
		let description = '';
		let content = '';
	
		//find task items
		const taskLineItems = fileMap.getTaskItems(TickTick_id);
		if (taskLineItems && taskLineItems.length > 0) {
			for (const taskLineItem of taskLineItems) {
				taskItems.push(this.getItemFromLine(taskLineItem));
			}
		}
	
		if (taskRecord) {
			if (taskRecord.taskLines && taskRecord.taskLines.length > 0) {
				const textContent = this.getNoteString(taskRecord, TickTick_id);
				let noteText = noteURL + textContent;
				if (taskLineItems && taskLineItems.length > 0) {
					description = noteText;
				} else {
					content = noteText;
				}
			} else { //no notes
				if (noteURL) {
					if (taskItems.length > 0) { //has task items
						description = noteURL;
					} else { //has no notes, not task items.
						content = noteURL;
					}
				}
	
			}
		}
		return { description, content, taskItems };
	}
	
	getLinkLocation(this: TaskParser, filepath: string) {
		let taskURL = '';
		let noteURL = '';
		let url = '';
		if (getSettings().fileLinksInTickTick !== 'noLink') {
			if (filepath) {
				url = this.plugin.taskParser.getObsidianUrlFromFilepath(filepath);
			}
		}
		if (getSettings().fileLinksInTickTick === 'taskLink') {
			taskURL = url;
		}
		if (getSettings().fileLinksInTickTick === 'noteLink') {
			noteURL = url + '\n';
		}
		return { taskURL, noteURL };
	}
	
	getNoteString(this: TaskParser, taskRecord: ITaskRecord, id?: string) {
		let textContent = '';
		if (getSettings().abyssTasksFormat) {
			const lines = taskRecord.taskLines ?? [];
			if (useAbyssCommentsApi()) return abyssDescriptionToNote(lines);
			return abyssLinesToNote(lines);
		}
		if (taskRecord.taskLines) {
			let descriptionStrings = [...taskRecord.taskLines];
	
			// Always strip matching opening/closing delimiter lines if present in the record,
			// regardless of current settings. This enables conversion when user turns delimiter off.
			if (descriptionStrings.length >= 2) {
				const firstLine = descriptionStrings[0];
				const lastLine = descriptionStrings[descriptionStrings.length - 1];
				// Extract raw text for comparison (trim, but keep indentation logic in FileMap)
				const firstText = firstLine.replace(/^\t*\s{2}/, '').trim();
				const lastText = lastLine.replace(/^\t*\s{2}/, '').trim();
				if (firstText.length > 0 && firstText === lastText) {
					descriptionStrings = descriptionStrings.slice(1, -1);
				}
			}
	
			// Respect current configured delimiter only for output formatting elsewhere;
			// here we just produce plain note text.
			let filteredDescriptionStrings;
			if (id) {
				// Filter out TickTick link lines that contain the task id so we don't duplicate links in notes
				const linkRegex = new RegExp(`\\[link\\]\\(.*${this.escapeRegExp(id)}.*\\)`, 'i');
				filteredDescriptionStrings = descriptionStrings.filter(line => !linkRegex.test(line));
			}
			if (filteredDescriptionStrings) {
				filteredDescriptionStrings = filteredDescriptionStrings.map(line => line.replace(/^\t*\s{2}|^\s{2}/g, ''));
				textContent = filteredDescriptionStrings.length > 0 ? filteredDescriptionStrings.join('\n') : '';
			} else {
				descriptionStrings = descriptionStrings.map(line => line.replace(/^\t*\s{2}|^\s{2}/g, ''));
				textContent = descriptionStrings.length > 0 ? descriptionStrings.join('\n') : '';
			}
		}
		// log.warn('Text Content in GetNoteString', textContent);
		return textContent;
	}
	
	hasNote(this: TaskParser, task: ITask) {
		return ((task.content) && (task.content.length > 0));
	}
	
	hasDescription(this: TaskParser, task: ITask) {
		return ((task.desc) && (task.desc.length > 0));
	}
	
	hasItems(this: TaskParser, task: ITask): boolean {
		return ((task.items) && (task.items.length > 0));
	}
	
	areNotesChanged(this: TaskParser, newNoteString: string, oldNoteString: string) {
		// Check if arrays have different lengths
		// log.debug(newNoteString, oldNoteString);
		if (newNoteString.length !== oldNoteString.length) {
			return true;  // strings are different, save some time.
		}
		const newNote = newNoteString.split('\n');
		const oldNote = oldNoteString.split('\n');
		// Check if elements are different
		for (let i = 0; i < newNote.length; i++) {
			if (newNote[i] !== oldNote[i]) {
				return true;  // Arrays are different
			}
		}
	
		return false;  // Arrays are exactly the same
	}
	
	areItemsChanged(this: TaskParser, newItems: ITaskItem[], oldItems: ITaskItem[]) {
		if (newItems?.length != oldItems?.length) {
			return true;
		}
		newItems.sort((a, b) => a.id.localeCompare(b.id));
		oldItems.sort((a, b) => a.id.localeCompare(b.id));
	
		for (let i = 0; i < newItems.length; i++) {
			if ((newItems[i].id !== oldItems[i].id) ||
				(newItems[i].status !== oldItems[i].status) ||
				(newItems[i].title !== oldItems[i].title)) {
				return true;  // Arrays are different
			}
		}
		return false;
	
	}
	
	addItems(this: TaskParser, resultLine: string, items: ITaskItem[], numTabs: number): string {
		//TODO count indentations?
		items.forEach(item => {
			let completion = item.status > 0 ? '- [x]' : '- [ ]';
			// When Full Vault Sync is enabled, we can't tell the difference between items and subtasks
			// everything is a subtask
			// TODO: in the fullness of time, see if there's a way to differentiate.
			const tabs = '\t'.repeat(numTabs + 1);
			resultLine = `${resultLine} \n${tabs}${completion} ${item.title} `;
			resultLine = `${resultLine} %%${item.id}%%`;
		});
		// log("trace", resultLine)
		return resultLine;
	}
	
	async addNote(this: TaskParser, resultLine: string, content: string, numbTabs: number, type: string, id: string, projectId: string) {
		//TODO figure out Note presentation
		//admonitions just don't work in indented tasks. Until I sort out the presentation, keep it simple until I
		//get all the functionality sorted out,
		// Matches the file link the plugin prepends to a task note when
		// fileLinksInTickTick is 'noteLink': [file](obsidian://open?vault=..&file=..)
		const linkRegex = new RegExp(`\\[.*\\]\\(obsidian://open\\?vault=[^)]*&file=[^)]*\\)`, 'giu');
		let noteLines: string[];
	
		if (content.length > 0) {
			noteLines = content.split('\n');
		} else {
			noteLines = [];
		}
	
		if (getSettings().taskLinksInObsidian === 'taskLink' && getSettings().fileLinksInTickTick == 'noteLink') {
			// The note's first line is normally the file link the plugin prepended
			// when the task was pushed to TickTick. Only drop it when it actually
			// is such a link; a task created in TickTick may have real note content
			// on its first line.
			if (noteLines.length > 0 && noteLines[0].trim().search(linkRegex) >= 0) {
				noteLines.splice(0, 1);
				if (noteLines.length === 0 || (noteLines.length === 1 && noteLines[0].trim().length === 0)) {
					//just the link. bail
					return resultLine;
				}
			}
	
		}
		if (getSettings().abyssTasksFormat) {
			const abyssLines = noteToAbyssLines(noteLines.filter(l => l.search(linkRegex) < 0).join('\n'), childIndent(numbTabs, getSettings().abyssIndent));
			return abyssLines.length ? `${resultLine}\n${abyssLines.join('\n')}` : resultLine;
		}
		const prefix = '\n' + '\t'.repeat(numbTabs) + '  ';
		// resultLine = `${resultLine}${prefix}=== start ${type} ${this.getTickTickId(resultLine)}`;
		// resultLine = `${resultLine}${prefix}`;
		const delimiter = getSettings().noteDelimiter;
		if (delimiter.length > 0) {
			resultLine = `${resultLine}${prefix}${delimiter}`;
		}
		if (getSettings().taskLinksInObsidian === 'noteLink') {
			const url = `[link](${this.createURL(id, projectId)})`;
			resultLine = `${resultLine}${prefix}${url}`;
		}
		if (noteLines.length > 0) {
			if (noteLines[noteLines.length - 1].length === 0) {
				//if last line is empty remove it so it don't look ugly in markdown
				noteLines.pop();
			}
		} else {
			noteLines = [];
		}
	
	
		noteLines.forEach(item => {
			if (item.search(linkRegex) < 0) {
				resultLine = `${resultLine}${prefix}${item}`;
			}
		});
		if (delimiter.length > 0) {
			resultLine = `${resultLine}${prefix}${delimiter}`;
		}
		// resultLine = `${resultLine}${prefix}=== end ${type}  ${this.getTickTickId(resultLine)}`;
		return resultLine;
	}
	
	getItemFromLine(this: TaskParser, itemLine: string): ITaskItem {
	
		const matches = REGEX.ITEM_LINE.exec(itemLine);
		let item: ITaskItem = { id: '', title: '', status: 0 };
		if (matches) {
	
			const status = matches[1] ?? '';
			const text = matches[2] ?? '';
			const id = matches[3] ?? '';
	
			const itemStatus = status === 'x' ? 2 : 0;
	
			item = {
				id, title: text, status: itemStatus
			};
		}
		return item;
	
	}
}
