import type { TaskParser } from '@/taskParser/TaskParser';
import type { ITask, ITaskItem } from '@/api/types/Task';
import type { ITaskComment } from '@/api/types/TaskComment';
import type { TagService } from '@/services/TagService';
import type { MetadataCache } from 'obsidian';
import { noteToAbyssLines, childIndent } from '@/abyssFormat';
import { formatApiCommentAsAbyssLines, useAbyssCommentsApi } from '@/abyssCommentSync';
import { mapTickTickTag } from '@/tagMapping';
import { isListTag, isStageToken, obsidianTagForStageTag, tagForList, tagsForCurrentList } from '@/listMapping';
import { isStatusTag, restoreStatus } from '@/statusMapping';
import { charForList, isStatusListMapActive, restoreStatusFromList } from '@/statusListMapping';
import { getSettings } from '@/settings';
import { getAllProjects } from '@/db/projects';
import { rruleToTasksText } from '@/utils/RecurrenceConverter';
import { keywords, REGEX, markerName } from '@/taskParser/regex';
import { flatTagName } from '@/taskParser/tags';
import { scopePushWithoutMarker } from '@/syncScope';
import { stripInjectedContextTags } from '@/contextTags';

/** ITask → markdown line (and tag render helpers used only on that path). */
export class TaskParserConvertToLine {
	async convertTaskToLine(this: TaskParser, task: ITask, numTabs: number): Promise<string> {
	
		const tabs = '\t'.repeat(numTabs);
		let resultLine = tabs;
	
		task.title = this.stripOBSUrl(task.title);
	
		let checkChar = task.status > 0 ? 'x' : ' ';
		let lineTags = stripInjectedContextTags(task.tags);
		const statusListMap = getSettings().statusListMappings;
		const useStatusList = getSettings().abyssTasksFormat && isStatusListMapActive(statusListMap);
		if (getSettings().abyssTasksFormat) {
			const smap = getSettings().statusMappings;
			const cancelMap = smap?.filter(m => m.char === '-') ?? [];
			if (useStatusList) {
				const projects = await getAllProjects();
				const r = restoreStatusFromList(
					task.status,
					task.tags,
					task.projectId,
					statusListMap,
					projects,
					(t) => !!isStatusTag(t, cancelMap),
				);
				checkChar = r.char;
				lineTags = r.tags.filter(t => !isStatusTag(t, smap));
				if (checkChar === ' ' && task.status === 0 && !charForList(task.projectId, statusListMap, projects)) {
					const fromTag = restoreStatus(task.status, task.tags, smap);
					if (fromTag.char !== ' ') checkChar = fromTag.char;
				}
			} else {
				const r = restoreStatus(task.status, task.tags, smap);
				checkChar = r.char;
				lineTags = r.tags;
			}
		}
		const listMapP = getSettings().tagListMappings;
		if (listMapP?.length && !this.plugin?.projectScheme?.isParentId?.(task.parentId)) {
			if (useStatusList) {
				lineTags = (lineTags ?? []).filter(t => !isListTag(t, listMapP) && !isStageToken(t, listMapP));
			} else if ((getSettings().gtdStageVia ?? 'list') === 'tag') {
				const stage = (lineTags ?? []).map(t => obsidianTagForStageTag(t, listMapP)).find((t): t is string => !!t);
				lineTags = (lineTags ?? []).filter(t => !isStageToken(t, listMapP));
				if (stage) lineTags = [...lineTags, stage];
			} else {
				const projects = await getAllProjects();
				const lt = tagForList(task.projectId, listMapP, projects);
				lineTags = tagsForCurrentList(lineTags, task.projectId, listMapP, {
					defaultProjectId: getSettings().defaultProjectId,
					via: 'list',
				}).filter(t => !isListTag(t, listMapP));
				if (lt && !lineTags.some(t => t.toLowerCase() === lt.toLowerCase())) lineTags = [...lineTags, lt];
			}
		}
		if ((getSettings().gtdStageVia ?? 'list') !== 'tag'
			&& getSettings().defaultProjectId
			&& task.projectId === getSettings().defaultProjectId
			&& !this.plugin?.projectScheme?.isParentId?.(task.parentId)
			&& !(lineTags ?? []).some(t => t.toLowerCase() === 'inbox')) {
			lineTags = [...(lineTags ?? []), 'inbox'];
		}
		resultLine += `- [${checkChar}] ${task.title}`;
	
	
		//add Tags
		const fromObsidian = !!task.parentId && this.plugin?.projectScheme?.isParentId?.(task.parentId)
			&& (lineTags ?? []).some(t => t.toLowerCase() === 'obsidian');
		if (lineTags) {
			resultLine = this.addTagsToLine(resultLine, lineTags);
		}
		// Project children show one source tag: #obsidian (born in the vault) or #ticktick (pulled).
		if (!fromObsidian) {
			if (getSettings().stopInjectingTickTickTag && scopePushWithoutMarker()) {
				const vaultBorn = (task.tags ?? []).some(t => t.toLowerCase() === 'obsidian');
				if (vaultBorn) {
					if (!/\s#obsidian(?![\w/-])/i.test(resultLine)) resultLine += ' #obsidian';
				} else if (!REGEX.TickTick_TAG.test(resultLine)) {
					resultLine = this.addTickTickTag(resultLine);
				}
			} else {
				resultLine = this.addTickTickTag(resultLine);
			}
		}
	
		if (getSettings().taskLinksInObsidian === 'taskLink') {
			resultLine = this.addTickTickLink(resultLine, task.id, task.projectId);
		}
	
		resultLine = this.addTickTickId(resultLine, task.id);
	
		//add reminders
		//Reminders are not a signifier emoji the Obsidian Tasks plugin
		//understands. Tasks reads back from the end of the line and stops at
		//unrecognized text, so `⏰ ...` must be emitted *before* the priority /
		//recurrence / date cluster or those emojis would be unreadable.
		resultLine = this.addRemindersToLine(resultLine, task);
	
		//add priority
		resultLine = this.addPriorityToLine(resultLine, task);
	
		//add recurrence
		if (task.repeatFlag) {
			const recurrenceText = rruleToTasksText(task.repeatFlag);
			if (recurrenceText) {
				const suffix = task.repeatFrom === 'completedDate' ? ' when done' : '';
				resultLine += ` ${keywords.RECURRENCE} ${recurrenceText}${suffix}`;
			}
		}
	
		//add dates
		resultLine = this.plugin.dateMan?.addDatesToLine(resultLine, task);
	
	
		if (getSettings().syncNotes || getSettings().taskLinksInObsidian === 'noteLink') {
			if (this.plugin.taskParser.hasDescription(task)) {
				resultLine = await this.addNote(resultLine, task.desc, numTabs, 'Description', task.id, task.projectId);
			} else if (this.plugin.taskParser.hasNote(task)) {
				resultLine = await this.addNote(resultLine, task.content, numTabs, 'Note', task.id, task.projectId);
			} else if (getSettings().taskLinksInObsidian === 'noteLink') {
				resultLine = await this.addNote(resultLine, task.content, numTabs, 'Note', task.id, task.projectId);
			}
		}
	
		if (useAbyssCommentsApi()) {
			const apiComments = (task as ITask & { _apiComments?: ITaskComment[] })._apiComments;
			if (apiComments?.length) {
				const ind = childIndent(numTabs, getSettings().abyssIndent);
				const extra = apiComments.flatMap(c => formatApiCommentAsAbyssLines(c, ind));
				if (extra.length) resultLine = `${resultLine}\n${extra.join('\n')}`;
			}
		}
	
		if (this.plugin.taskParser.hasItems(task)) {
			resultLine = this.addItems(resultLine, task.items, numTabs);
		}
	
		return resultLine;
	}
	
	addTagsToLine(this: TaskParser, resultLine: string, tags: string[]) {
		//we're looking for the ticktick tag without the #
		const regEx = new RegExp(keywords.TickTick_TAG.substring(1), 'i');
		const tagSvc = this.plugin?.tagService;
		// Snapshot the vault's tags once so we can decide whether a hyphenated
		// tag's leading segment is an existing parent (hierarchy) or a literal
		// flat tag. Doing it once per line avoids N metadataCache lookups.
		const vaultTags = this.getVaultTags();
		tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0).forEach((tag: string) => {
			//TickTick tag, if present, will be added at the end.
			if (!tag.match(regEx)) {
				let display: string;
				const mapped = mapTickTickTag(tag, getSettings().tagMappings);
				const pathBack = getSettings().abyssTasksFormat ? (getSettings().tagPathMap?.[tag.toLowerCase()]
					?? [...(getSettings().tagListMappings ?? []).map(m => m.tag), ...(getSettings().statusMappings ?? []).map(m => m.tag)]
						.map(t => t.replace(/^#/, '')).find(t => t.includes('/') && flatTagName(t) === tag.toLowerCase())) : undefined;
				if (mapped) {
					display = mapped;
				} else if (pathBack) {
					display = pathBack; // full Abyss path pushed as foo-bar -> back to foo/bar
				} else if (tagSvc) {
					// Try hierarchical display (parent/child) first
					const hierarchical = tagSvc.resolveHierarchicalLabel(tag);
					if (hierarchical) {
						display = hierarchical.trim();
					} else {
						// Fallback: only convert - → / when the tag genuinely
						// belongs to a known hierarchy (its leading segment is an
						// existing parent). Otherwise keep the flat hyphenated
						// label verbatim — e.g. `a12s-2026-q2` must stay flat,
						// not become `a12s/2026/q2`.
						display = (tagSvc.getLabel(tag) ?? tag).trim();
						if (this.tagIsHierarchical(tag, tagSvc, vaultTags)) {
							display = display.replace(/-/g, '/');
						}
					}
				} else {
					display = tag.trim();
					if (this.tagIsHierarchical(tag, undefined, vaultTags)) {
						display = display.replace(/-/g, '/');
					}
				}
				const hash = `#${display}`;
				if (!new RegExp(`${hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w/-])`, 'i').test(resultLine)) {
					resultLine = resultLine + ' ' + hash;
				}
			}
		});
		return resultLine;
	}
	
	tagIsHierarchical(this: TaskParser, name: string, tagSvc: TagService | undefined, vaultTags: Record<string, number>): boolean {
		// Already known as a child in TickTick's cache.
		if (tagSvc?.getParent(name)) return true;
	
		// Leading hyphen-segment (e.g. "a12s" from "a12s-2026-q2").
		const segments = name.split('-');
		if (!segments.length || !segments[0]) return false;
		const needle = segments[0].trim().toLowerCase() + '/';
	
		// Any vault tag that starts with "<seg>/" means <seg> is used as a parent.
		for (const key of Object.keys(vaultTags)) {
			if (key.toLowerCase().startsWith(needle)) return true;
		}
		return false;
	}
	
	getVaultTags(this: TaskParser): Record<string, number> {
		const mc = this.app?.metadataCache as (MetadataCache & { getTags?: () => Record<string, number> }) | undefined;
		return mc?.getTags?.() ?? {};
	}

	/**
	 * Returns the slash form of a raw Obsidian tag for the purpose of hierarchy
	 * splitting. A tag containing an explicit `/` is already hierarchical and is
	 * returned unchanged. A bare hyphenated tag (`a12s-2026-q2`) only gains
	 * hierarchy when its leading hyphen-segment (`a12s`) is an existing parent
	 * tag — matching the render direction and the "explicit slash form" rule for
	 * creating brand-new hierarchies. Otherwise it stays flat.
	 */
	effectiveTagForHierarchy(this: TaskParser, raw: string): string {
		if (raw.includes('/')) return raw;
		const segments = raw.split('-');
		if (!segments.length || !segments[0]) return raw;
		const seg = segments[0].trim().toLowerCase();
		const vaultTags = this.getVaultTags();
		const needle = seg + '/';
		for (const key of Object.keys(vaultTags)) {
			if (key.toLowerCase().startsWith(needle)) return raw.replace(/-/g, '/');
		}
		return raw;
	}

	addPriorityToLine(this: TaskParser, resultLine: string, task: ITask) {
		let priority = this.translateTickTickToObsidian(task.priority);
		if (priority != null) {
			// log.debug("task pri: ", task.priority, " emoji num: ", priority, priorityEmojis[priority])
			// log.debug("task pri: ", task.priority, " emoji num: ", priority)
			resultLine = `${resultLine} ${priority}`;
		}
		// else
		// {
		//     log.debug("task pri: ", task.priority, " undefined: ", priority)
		// }
		return resultLine;
	}
}
