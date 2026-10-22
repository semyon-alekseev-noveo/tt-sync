import log from '@/utils/logger';
import { isDetached } from '@/detach';
import type { TaskParser } from '@/taskParser/TaskParser';
import { REGEX, markerName, keywords } from '@/taskParser/regex';
import { getSettings } from '@/settings';
import { isBlankTitle } from '@/projectScheme';
import { isPathInPushScope, scopePushWithoutMarker } from '@/syncScope';
import type { ITask } from '@/api/types/Task';

/** TickTick id / tag / link markers on a markdown line. */
export class TaskParserMarkers {
	hasTickTickTag(this: TaskParser, text: string) {
		if (isDetached(text)) return false;
		if (this.isMarkdownTask(text)) {
			// log.debug("hasTickTickTag", `${text}
			// ${REGEX.TickTick_TAG}
			// ${REGEX.TickTick_TAG.test(text)}`);
			if (REGEX.TickTick_TAG.test(text)) return true;
			// Vault-born lines carry #obsidian once they have an id (source tag): still synced.
			return this.hasTickTickId(text) && REGEX.OBSIDIAN_SOURCE.test(text);
		} else {
			return false;
		}
	}
	
	isLineTrackedForSync(this: TaskParser, text: string, filepath?: string | null): boolean {
		if (!this.isMarkdownTask(text) || isDetached(text)) return false;
		if (this.hasTickTickTag(text)) return true;
		if (!scopePushWithoutMarker() || !filepath || !isPathInPushScope(filepath)) return false;
		if (this.hasTickTickId(text)) return true;
		return !isBlankTitle(this.getTaskContentFromLineText(text.trimStart()));
	}
	
	hasTickTickId(this: TaskParser, text: string) {
		if (REGEX.TickTick_ID_CANONICAL.test(text)) return true;
		let result = REGEX.TickTick_ID.test(text);
		if (!result) {
			//try the dataview version
			result = REGEX.TickTick_ID_DV_NUM.test(text);
		}
		return (result);
	}
	
	getLineItemId(this: TaskParser, text: string) {
		if (!text) {
			log.error('No Text passed to getLineItemId');
			return undefined;
		}
		let res = text.match(REGEX.LINE_ITEM_ID);
		let lineItemId;
		if (res) {
			lineItemId = res[0].slice(2, -2);
			// log.debug("\nResult: ", res);
		}
		return lineItemId;
	}
	
	isTickTickTask(this: TaskParser, text: string) {
		return this.hasTickTickId(text);
	}
	
	addTickTickId(this: TaskParser, line: string, ticktick_id: string) {
		line = `${line} %%[ticktick_id:: ${ticktick_id}]%%`;
		return line;
	}
	
	getProjectNameFromLineText(this: TaskParser, text: string) {
		const result = REGEX.PROJECT_NAME.exec(text);
		return result ? result[1] : null;
	}
	
	getTickTickId(this: TaskParser, text: string) {
		const canonical = REGEX.TickTick_ID_CANONICAL.exec(text);
		if (canonical) return canonical[1];
		let result = REGEX.TickTick_ID_NUM.exec(text);
		if (!result) {
			//try the dataview version
			result = REGEX.TickTick_ID_DV_NUM.exec(text);
		}
		const id = result ? result[1].trim() : undefined;
		return id && /^[a-f0-9]{24}$/i.test(id) ? id : undefined;
	}
	
	stripLineItemId(this: TaskParser, lineText: string) {
		let line = lineText.replace(REGEX.LINE_ITEM_ID, '');
		return line;
	}
	
	preserveTickTickTag(this: TaskParser, lineTask: ITask, savedTask: ITask | null | undefined): void {
		if (!getSettings().stopInjectingTickTickTag) return;
		if (savedTask?.tags?.some(t => t.toLowerCase() === markerName()) &&
			!lineTask.tags?.some(t => t.toLowerCase() === markerName())) {
			lineTask.tags = [...(lineTask.tags || []), markerName()];
		}
	}
	
	stripTickTickTag(this: TaskParser, lineTask: ITask): void {
		lineTask.tags = (lineTask.tags || []).filter(t => t.toLowerCase() !== markerName());
	}
	
	addTickTickTag(this: TaskParser, str: string): string {
		str = (str + ` ${keywords.TickTick_TAG}`);
		return str;
	}
	
	addTickTickLink(this: TaskParser, linetext: string, taskId: string, projecId: string): string {
		let url = this.createURL(taskId, projecId);
		const regex = new RegExp(`${keywords.TickTick_TAG}`, 'gi');
		const link = ` [link](${url})`;
		return linetext.replace(regex, link + ' ' + '$&');
	}
	
	hasTickTickLink(this: TaskParser, lineText: string) {
		return (REGEX.TickTick_LINK.test(lineText));
	}
	
	createURL(this: TaskParser, newTaskId: string, projectId: string): string {
		let url = '';
		if (projectId) {
			url = `https://${getSettings().baseURL}/webapp/#p/${projectId}/tasks/${newTaskId}`;
		} else {
			url = `https://${getSettings().baseURL}/webapp/#q/all/tasks/${newTaskId}`;
		}
		return url;
	}
}
