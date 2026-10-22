import log from '@/utils/logger';
import { Notice } from 'obsidian';
import type { TaskParser } from '@/taskParser/TaskParser';
import type { ITask } from '@/api/types/Task';

/** Field-level change detection between line task and TickTick/cached task. */
export class TaskParserDiff {
	isTitleChanged(this: TaskParser, lineTask: ITask, TickTickTask: ITask) {
		//TODO: This is ugly, but I'm tired of chasing it. There's still a place where
		//      we're adding the OBSUrl to the tile when we don't need to. Everything else
		//      works, so just kludge it for now.
	
		const lineTaskTitle = this.stripOBSUrl(lineTask.title);
		const TickTickTaskTitle = this.stripOBSUrl(TickTickTask.title);
		//Whether content is modified?
		const contentModified = (lineTaskTitle.trim() === TickTickTaskTitle.trim());
		return (!contentModified);
	}
	
	isTagsChanged(this: TaskParser, lineTask: ITask, TickTickTask: ITask) {
		const lineTaskTags = lineTask.tags ? lineTask.tags : [];
		const TickTickTaskTags = TickTickTask.tags ? TickTickTask.tags : [];
		if (!lineTaskTags && !TickTickTaskTags) {
			return false; //no tags.
		} else if ((lineTaskTags && !TickTickTaskTags) || (!lineTaskTags && TickTickTaskTags)) {
			return true; //tasks added or deleted.
		}
		//Whether content is modified?
		let areTagsSame = lineTaskTags.length === TickTickTaskTags.length
			&& lineTaskTags.sort().every((val, index) =>
				val === TickTickTaskTags.sort()[index]);
		return !(areTagsSame);
	}
	
	isStatusChanged(this: TaskParser, lineTask: Record<string, unknown>, TickTickTask: Record<string, unknown>) {
		//Whether status is modified?
		const statusModified = (lineTask.status === TickTickTask.status);
		//log.debug(lineTask)
		//log.debug(TickTickTask)
		return (!statusModified);
	}
	
	isParentIdChanged(this: TaskParser, lineTask: ITask, TickTickTask: ITask): boolean {
		let lineParentId = lineTask.parentId ? lineTask.parentId : '';
		let cacheParentId = TickTickTask.parentId ? TickTickTask.parentId : '';
		return (lineParentId != cacheParentId);
	}
	
	isChildrenChanged(this: TaskParser, lineTask: ITask, TickTickTask: ITask): boolean {
		if (!lineTask.childIds && !TickTickTask.childIds) {
			return false;
		} else if (!lineTask.childIds && TickTickTask.childIds) {
			return true;
		} else if (lineTask.childIds && !TickTickTask.childIds) {
			return true;
		}
	
		return lineTask?.childIds.length != TickTickTask?.childIds.length;
	
	}
	
	async isProjectIdChanged(this: TaskParser, lineTask: ITask, TickTickTask: ITask) {
		if (lineTask.projectId !== TickTickTask.projectId) {
			log.debug('Project ID changed: ', lineTask.projectId, TickTickTask.projectId);
			//make sure that they're not in a non-project file.
			const taskFile = await this.plugin.fileMetadataService.getFilepathForTask(TickTickTask.id);
			if (taskFile) {
				// log.debug('Task file: ', taskFile);
				const hasADefaultProject = await this.plugin.fileTaskQueries.filepathHasDefaultProjectID(taskFile)
				if (hasADefaultProject) {
					return true;
				} else {
					log.debug('Task file does not have a default project: ', taskFile);
					//hate to do a notification from here, but I don't want to blindside them either.
					new Notice(`Task ${TickTickTask.title} was moved in TickTick, but is in ${taskFile}. Assuming that this is intentional and not moving it.`, 10000	);
	
					return false;
				}
	
			}
		} else {
			return false;
		}
	}
}
