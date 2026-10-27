import type { TaskParser } from '@/taskParser/TaskParser';
import type { ITask, ITaskItem } from '@/api/types/Task';
import type { NewFileMap, ITaskRecord } from '@/services/NewFileMap';
import { Notice } from 'obsidian';
import { mapObsidianTag } from '@/tagMapping';
import { hasMultipleStageTags, isListTag, isStageToken, listForTags, pickWinningStageTag, tickTickTagForStage, tagsForCurrentList } from '@/listMapping';
import { checkboxChar, tagForStatusChar, isStatusTag } from '@/statusMapping';
import { isStatusListMapActive, listForStatusChar, isTerminalStatusChar } from '@/statusListMapping';
import { getSettings, updateSettings } from '@/settings';
import { getAllProjects } from '@/db/projects';
import { tasksTextToRRule } from '@/utils/RecurrenceConverter';
import log from '@/utils/logger';
import { isBlankTitle } from '@/projectScheme';
import { isPathInPushScope, scopePushWithoutMarker } from '@/syncScope';
import { appendContextTags, dedupeTags, isVaultContextTagMirror } from '@/contextTags';
import { REGEX, markerName } from '@/taskParser/regex';
import { flatTagName, abyssTagConflicts, warnedConflicts } from '@/taskParser/tags';

/** Markdown line → ITask. */
export class TaskParserConvertToTask {
	async convertLineToTask(this: TaskParser, lineText: string, lineNumber: number, filepath: string, fileMap: NewFileMap | null, inTaskRecord: ITaskRecord | null) {
		let hasParent = false;
		let parentId: string | null = null;
		let parentTaskObject: ITask | null = null;
		let taskItems: ITaskItem[] = [];
		let textWithoutIndentation = this.removeTaskIndentation(lineText);
	
		const TickTick_id = this.getTickTickId(textWithoutIndentation) ?? '';
	
		if (TickTick_id && this.plugin.projectScheme?.lineDuplicatesProjectParent?.(filepath, TickTick_id)) {
			return {
				id: TickTick_id,
				projectId: '',
				title: '',
				content: '',
				desc: '',
				items: [],
				parentId: '',
				childIds: [],
				sortOrder: 0,
				reminder: '',
				reminders: [],
				progress: 0,
				deleted: 1,
				lineHash: '',
				dueDate: '',
				startDate: '',
				completedTime: '',
				isAllDay: false,
				tags: [],
				priority: 0,
				modifiedTime: '',
				status: 0,
			};
		}
	
		const allDatesStruct = this.plugin.dateMan?.parseDates(textWithoutIndentation);
	
		const recurrenceMatch = textWithoutIndentation.match(REGEX.RECURRENCE_RULE);
		const recurrenceResult = recurrenceMatch ? tasksTextToRRule(recurrenceMatch[1]) : null;
	
		const reminderResult = this.getRemindersFromLine(textWithoutIndentation);
	
		let taskRecord: ITaskRecord;
	
		if (inTaskRecord) {
			taskRecord = inTaskRecord;
		} else {
			if (TickTick_id) {
				taskRecord = fileMap!.getTaskRecord(TickTick_id);
			} else {
				taskRecord = await fileMap!.getTaskRecordByLine(lineNumber);
			}
		}
		let description = null;
		let content = null;
	
		let { taskURL, noteURL } = this.getLinkLocation(filepath);
	
		//Detect parentID
		if (taskRecord.parentId && taskRecord.parentId.length > 0) {
			parentId = taskRecord.parentId;
			hasParent = true;
			// log.debug(`parent id is ${parentId}`)
			parentTaskObject = (await this.plugin.taskRepository.loadTaskById(parentId)) ?? null;
		}
	
	
		//Do the description/content thing
		const __ret = this.getTaskPayLoad(fileMap, TickTick_id, noteURL, taskRecord);
		description = __ret.description;
		content = __ret.content;
		taskItems = __ret.taskItems;
	
		// A timezone only means something relative to a date -- don't
		// manufacture one for a task that doesn't have either.
		let timeZone: string | undefined;
		if (allDatesStruct?.dueDate || allDatesStruct?.startDate) {
			timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		}
	
		// The #ticktick tag is an Obsidian-side control signal (marks this
		// line as plugin-tracked). It has historically also been injected as
		// a real TickTick tag; that injection is opt-out via the
		// stopInjectingTickTickTag setting. When opted out, it's excluded
		// here so it never flows into task.tags for creation, comparison, or
		// update -- see preserveTickTickTag for the step that keeps a
		// *genuinely* TT-side "ticktick" tag if one already exists there.
		const rawTags = this.getAllTagsFromLineText(textWithoutIndentation)
			.filter(t => getSettings().stopInjectingTickTickTag ? t.toLowerCase() !== markerName() : true);
		// Dexie list for AF-GTD-TAG-ADD winner (stage whose list ≠ current).
		const savedForStage = TickTick_id
			? (await this.plugin.taskRepository?.loadTaskById(TickTick_id))
			: undefined;
		const statusListMap = getSettings().statusListMappings;
		const useStatusList = getSettings().abyssTasksFormat && isStatusListMapActive(statusListMap);
		const needProjects = !!(getSettings().tagListMappings?.length || useStatusList);
		const stageProjects = needProjects ? await getAllProjects() : [];
		if (getSettings().abyssTasksFormat) {
			// Abyss custom status char -> TickTick tag (e.g. `[/]` -> status/in-progress)
			const smap = getSettings().statusMappings;
			const kept = rawTags.filter(t => !isStatusTag(t, smap));
			const stCh = checkboxChar(textWithoutIndentation);
			// When status->list is SoT, skip tagList stage-conflict toasts (tags are stripped, not "lost").
			const lost = abyssTagConflicts(
				rawTags, stCh, smap,
				useStatusList ? undefined : getSettings().tagListMappings,
				stageProjects, savedForStage?.projectId,
			);
			// Status↔checkbox mismatch is surprising → Notice. Rival stage tags after Abyss DnD
			// are expected (AF-GTD-TAG-ADD); exclusive rewrite handles them without a toast.
			const statusLost = lost.filter(t => isStatusTag(t, smap));
			if (statusLost.length) {
				const msg = `TickTickSync: "${this.getTaskContentFromLineText(textWithoutIndentation).slice(0, 40)}" — tag(s) ${statusLost.map(t => '#' + t).join(', ')} conflict with the checkbox and will be dropped.`;
				if (!warnedConflicts.has(msg)) { warnedConflicts.add(msg); log.warn(msg); new Notice(msg, 8000); }
			} else if (lost.length) {
				log.debug(`stage exclusivity: dropping ${lost.map(t => '#' + t).join(', ')} (DnD / dual stage)`);
			}
			rawTags.length = 0;
			rawTags.push(...kept);
			const stTag = tagForStatusChar(checkboxChar(textWithoutIndentation), smap);
			if (stTag) rawTags.push(stTag);
		}
	
		if (getSettings().abyssTasksFormat && getSettings().syncNoteContextTags) {
			const kept = rawTags.filter(t => !isVaultContextTagMirror(t));
			rawTags.length = 0;
			rawTags.push(...kept);
		}
	
		// Resolve tags: handle hierarchy and create unknown tags in TickTick
		const tagSvc = this.plugin?.tagService;
		const api = this.plugin?.tickTickRestAPI;
		const tagsToCreate: { label: string; name: string; parent: string | null; localLabel?: string }[] = [];
	
		if (tagSvc) {
			for (const raw of rawTags) {
				// Before hierarchy splitting, check if this tag matches a project name
				const projectCheckName = raw.replace(/[/_]/g, ' ');
	
				const isProjectTag = (await getAllProjects()).some(obj => obj.name.toLowerCase() === projectCheckName.toLowerCase());
	
				if (isProjectTag) {
					// Treat as simple tag — don't create hierarchy
					if (!tagSvc.isKnownTag(raw)) {
						const name = raw.toLowerCase().replace(/[/\s]+/g, '-').replace(/-+/g, '-');
						tagsToCreate.push({ label: raw, name, parent: null });
					}
				} else if (getSettings().abyssTasksFormat && raw.includes('/') && !mapObsidianTag(raw, getSettings().tagMappings)) {
					// Abyss: keep the full path (foo/bar -> TT tag `foo-bar`, label kept locally as foo/bar),
					// so it round-trips and never collides with another `bar`.
					const name = flatTagName(raw);
					if (!tagSvc.getLabel(name) || tagSvc.getLabel(name) !== raw) tagsToCreate.push({ label: name, name, parent: null, localLabel: raw });
				} else {
					const parts = this.effectiveTagForHierarchy(raw).split('/');
					if (parts.length === 1) {
						// Simple tag (no hierarchy)
						if (!tagSvc.isKnownTag(raw)) {
							const name = raw.toLowerCase().replace(/[/\s]+/g, '-').replace(/-+/g, '-');
							tagsToCreate.push({ label: raw, name, parent: null });
						}
					} else if (parts.length === 2) {
						// Two-level hierarchy: ensure parent and child tags exist
						const parentLabel = parts[0];
						const childLabel = parts[1];
						const parentName = parentLabel.toLowerCase().replace(/[/\s]+/g, '-').replace(/-+/g, '-');
						const childName = childLabel.toLowerCase().replace(/[/\s]+/g, '-').replace(/-+/g, '-');
						if (!tagSvc.isKnownTag(parentLabel)) {
							tagsToCreate.push({ label: parentLabel, name: parentName, parent: null });
						}
						if (!tagSvc.isKnownTag(childLabel)) {
							tagsToCreate.push({ label: childLabel, name: childName, parent: parentName });
						}
					} else {
						// More than 2 levels: preserve hierarchy in label, flatten name for TickTick
						const parentLabel = parts[0];
						const childLabel = parts.slice(1).join('/');
						const parentName = parentLabel.toLowerCase().replace(/[/\s]+/g, '-').replace(/-+/g, '-');
						const childName = parts.slice(1).join('-').toLowerCase().replace(/[/\s]+/g, '-').replace(/-+/g, '-');
						if (!tagSvc.isKnownTag(parentLabel)) {
							tagsToCreate.push({ label: parentLabel, name: parentName, parent: null });
						}
						if (!tagSvc.isKnownTag(childLabel)) {
							tagsToCreate.push({ label: childLabel, name: childName, parent: parentName });
						}
					}
				}
			}
		}
	
		if (tagsToCreate.length > 0 && api) {
			const created = await api.CreateTags(tagsToCreate.map(({ localLabel: _l, ...t }) => t));
			// full-path labels are a local mapping: record them even if TT already had the tag
			for (const t of tagsToCreate) if (t.localLabel && !created) await tagSvc.addTag(t.name, t.localLabel, null);
			if (created) {
				for (const t of tagsToCreate) {
					await tagSvc.addTag(t.name, t.localLabel ?? t.label, t.parent);
				}
			}
		}
	
		let tags: string[];
		const tagMap = getSettings().tagMappings;
		const mappedTags = rawTags.map(raw => mapObsidianTag(raw, tagMap));
		if (tagSvc) {
			tags = rawTags.map((raw, i) => {
				if (mappedTags[i]) return mappedTags[i] as string;
				if (getSettings().abyssTasksFormat && raw.includes('/')) {
					const flat = flatTagName(raw);
					const pm = getSettings().tagPathMap ?? {};
					if (pm[flat] !== raw) updateSettings({ tagPathMap: { ...pm, [flat]: raw } });
					return flat;
				}
				const parts = this.effectiveTagForHierarchy(raw).split('/');
				if (parts.length === 1) return tagSvc.resolveToName(raw);
				if (parts.length === 2) return tagSvc.resolveToName(parts[1]);
				return tagSvc.resolveToName(parts.slice(1).join('-'));
			});
		} else {
			tags = rawTags.map((raw, i) => mappedTags[i] ?? raw.toLowerCase().replace(/[/\s]+/g, '-').replace(/-+/g, '-'));
		}
	
		// File-save, editor-line, and full Synchronize all come through here.
		// Hydrate the projects list before routing, because only a full pull used to set it.
		if (!hasParent && this.plugin.projectScheme?.enabled?.() && !this.plugin.projectScheme.listId) {
			await this.plugin.projectScheme.ensurePushContext?.();
		}
		let projectOf = hasParent ? undefined : this.plugin.projectScheme?.resolveForFile?.(filepath);
		if (!hasParent && !projectOf && TickTick_id && this.plugin.projectScheme?.enabled?.()) {
			// A project subtask stays in its project wherever its line lives (file location
			// must not drop the TickTick parent).
			if (savedForStage?.parentId && this.plugin.projectScheme.isParentId(savedForStage.parentId)) {
				projectOf = { parentId: savedForStage.parentId, listId: savedForStage.projectId };
			}
		}
		const stageWinner = (!useStatusList && getSettings().tagListMappings?.length)
			? pickWinningStageTag(rawTags, getSettings().tagListMappings, stageProjects, savedForStage?.projectId)
			: undefined;
		if (projectOf) {
			parentId = projectOf.parentId; // project task = subtask of the project parent
			// No source tag yet: the line was written in Obsidian.
			const hasSource = tags.some(t => t === 'obsidian' || t === 'ticktick' || t === markerName());
			if (!hasSource) tags = [...tags, 'obsidian'];
		} else if (!useStatusList && getSettings().tagListMappings?.length && (getSettings().gtdStageVia ?? 'list') === 'tag') {
			const tt = stageWinner ? tickTickTagForStage(stageWinner, getSettings().tagListMappings) : undefined;
			tags = tags.filter((t, i) => !isStageToken(rawTags[i], getSettings().tagListMappings) && !isStageToken(t, getSettings().tagListMappings));
			if (tt) tags = [...tags.filter(x => x !== tt), tt];
		} else if (getSettings().tagListMappings?.length) {
			// Always drop list-mapped stage tags from the TT payload (list or status SoT represents stage).
			tags = tags.filter((_, i) => !isListTag(rawTags[i], getSettings().tagListMappings));
		}
		let projectId = await this.plugin.fileTaskQueries?.getDefaultProjectIdForFilepath(filepath);
	
		if (hasParent) {
			if (parentTaskObject) {
				projectId = parentTaskObject.projectId;
			}
		} else {
			if (projectOf) projectId = projectOf.listId;
			const listMap = getSettings().tagListMappings;
			const stChForList = checkboxChar(textWithoutIndentation);
			const statusMappedList = (!projectOf && useStatusList && !isTerminalStatusChar(stChForList))
				? listForStatusChar(stChForList, statusListMap, stageProjects.length ? stageProjects : await getAllProjects())
				: undefined;
			// Status->list SoT wins over tagListMappings. Terminal chars keep current/default list.
			const mappedList = statusMappedList
				?? ((!projectOf && !useStatusList && (getSettings().gtdStageVia ?? 'list') !== 'tag' && listMap?.length)
					? listForTags(rawTags, listMap, stageProjects.length ? stageProjects : await getAllProjects(), savedForStage?.projectId)
					: undefined);
			if (mappedList) {
				projectId = mappedList;
			} else if (useStatusList && isTerminalStatusChar(stChForList) && savedForStage?.projectId) {
				// [x]/[-]: complete/cancel — list unchanged
				projectId = savedForStage.projectId;
			} else
			// A tag that merely shares a list's name (e.g. #inbox → the real Inbox)
			// must not override the file default once the mapping table is in use.
			if (!listMap?.length && !useStatusList && rawTags) {
				for (const rawTag of rawTags) {
					const labelName = rawTag.replace(/[/_]/g, ' ');
	
					const hasProjectId = (await getAllProjects()).find(obj => obj.name.toLowerCase() === labelName.toLowerCase())?.id;
					if (!hasProjectId) {
						continue;
					}
					projectId = hasProjectId;
					break;
				}
			}
		}
	
		if (projectId && (getSettings().gtdStageVia ?? 'list') === 'list' && !useStatusList) {
			tags = tagsForCurrentList(tags, projectId, getSettings().tagListMappings, {
				defaultProjectId: getSettings().defaultProjectId,
				via: 'list',
			});
		}
	
		const title = this.getTaskContentFromLineText(textWithoutIndentation);
		if ((getSettings().debugMode) && (!projectId)) {
			log.error('Converting line to Object, could not find project Id: ', title);
		}
	
		if (!projectOf && scopePushWithoutMarker() && isPathInPushScope(filepath) && !isBlankTitle(title)) {
			const hasSource = tags.some(t => t === 'obsidian' || t === 'ticktick' || t === markerName());
			if (!hasSource) tags = [...tags, 'obsidian'];
		}
	
		if (getSettings().syncNoteContextTags && getSettings().abyssTasksFormat && filepath) {
			const schemePid = projectOf?.parentId
				?? (parentId && this.plugin.projectScheme?.isParentId?.(parentId) ? parentId : undefined);
			const projectNotePath = schemePid
				? this.plugin.projectScheme?.noteForParent?.(schemePid)
				: undefined;
			tags = appendContextTags(tags, { filePath: filepath, projectNotePath });
		}
		tags = dedupeTags(tags);
	
		const isCompleted = this.isTaskCheckboxChecked(textWithoutIndentation);
	
		const priority = this.getTaskPriority(textWithoutIndentation);
	
		let actualStartDate = allDatesStruct?.startDate ?
			allDatesStruct?.startDate.isoDate : //there's a start date
			(getSettings().scheduledAsStartDate && allDatesStruct?.scheduled_date) ?
				allDatesStruct.scheduled_date.isoDate : // ⏳ mapped to TickTick start date
			allDatesStruct?.dueDate ? //there are neither start date nor scheduled date.
				allDatesStruct?.dueDate.isoDate : '';  //use the due date if there is one.
	
		const task: ITask = {
			id: TickTick_id || '',
			projectId: projectId ?? '',
			title: title.trim() + (taskURL ? ' ' + taskURL : ''),
			content: content ? content : '',
			desc: description ? description : '',
			items: taskItems || [],
			parentId: parentId || '',
			childIds: [],
			sortOrder: 0,
			reminder: '',
			reminders: reminderResult.clear ? [] : reminderResult.reminders,
			clearReminders: reminderResult.clear || undefined,
			progress: 0,
			deleted: 0,
			lineHash: '',
			dueDate: allDatesStruct?.dueDate?.isoDate || '',
			startDate: actualStartDate || '',
			completedTime: allDatesStruct?.completedTime?.isoDate || '',
			isAllDay: allDatesStruct?.isAllDay || false,
			tags: tags || [],
			priority: Number(priority),
			modifiedTime: this.plugin.dateMan?.formatDateToISO(new Date()) || '',
			status: isCompleted ? 2 : 0, //Status: 0 is no completed. Anything else is completed.
			timeZone: timeZone,
			repeatFlag: recurrenceResult?.repeatFlag || '',
			repeatFrom: recurrenceResult?.repeatFrom,
			dateHolder: allDatesStruct //Assume that there's a dateStruct of some kind
		};

		// AF-GTD-TAG-ADD: Abyss tag-tree may leave several stage tags; push rewrites the vault line.
		// UX-STATUS-MAP: when status->list is SoT, strip leftover #gtd stage tags entirely.
		if (useStatusList && getSettings().tagListMappings?.length
			&& rawTags.some(t => isListTag(t, getSettings().tagListMappings))) {
			Object.defineProperty(task, '__stripStageTagsRewrite', {
				value: true,
				enumerable: false,
				configurable: true,
			});
		} else if (hasMultipleStageTags(rawTags, getSettings().tagListMappings) && stageWinner) {
			Object.defineProperty(task, '__exclusiveStageRewrite', {
				value: true,
				enumerable: false,
				configurable: true,
			});
			Object.defineProperty(task, '__exclusiveStageWinner', {
				value: stageWinner,
				enumerable: false,
				configurable: true,
			});
		}
	
		return task;
	
	}
}
