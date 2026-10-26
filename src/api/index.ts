'use strict';
import ObjectID from 'bson-objectid';
import type { IProjectGroup } from './types/ProjectGroup';
import type { IProject, ISections } from './types/Project';
import type { ITask } from './types/Task';
import type { ITag } from './types/Tag';
import type { ITaskComment } from './types/TaskComment';
import { API_ENDPOINTS } from './utils/get-api-endpoints';
import log from '@/utils/logger';
import { getSettings, updateSettings } from '@/settings';
import { normalizeTrigger } from '@/utils/ReminderConverter';
import {
	tickMakeRequest,
	tickSetError,
	getTickUserAgent,
	getTickXDevice,
	type TickHttpHost,
} from '@/api/tickHttp';
export {
	buildAddTaskCommentBody,
	buildUpdateTaskCommentBody,
	parseTaskCommentFromApiResponse,
} from '@/api/taskComments';
import {
	buildAddTaskCommentBody,
	buildUpdateTaskCommentBody,
	parseTaskCommentFromApiResponse,
} from '@/api/taskComments';

const {
	TaskEndPoint,
	updateTaskEndPoint,
	allProjectGroupsEndPoint,
	allProjectsEndPoint,
	updateProjectEndPoint,
	allTasksEndPoint,
	allTagsEndPoint,
	batchTagEndPoint,
	signInEndPoint,
	userPreferencesEndPoint,
	getSections,
	getAllCompletedItems,
	exportData,
	projectMove,
	parentMove,
	userStatus,
	taskComments,
	taskComment,
	taskCommentDelete,
} = API_ENDPOINTS;


interface IoptionsProps {
	token: string;
	username?: string;
	password?: string;
	baseUrl?: string;
	checkPoint?: number;
}

export interface IBatch {
	checkPoint: number;
	inboxId: string;
	projectGroups: unknown[];
	projectProfiles: unknown[];
	syncTaskBean: unknown;
	tags: unknown[];
}

interface UpdatePayload {
	add: unknown[];
	addAttachments: unknown[];
	delete: unknown[];
	deleteAttachments: unknown[];
	updateAttachments: unknown[];
	update: unknown[];
}

/** Pull could not read the TickTick delta. Callers must not treat this as an empty change set. */
export class TickTickPullError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'TickTickPullError';
	}
}

export class Tick {
	username: string | undefined;
	password: string | undefined;
	inboxProperties: {
		id: string; sortOrder: number;
	};
	token: string;
	apiUrl: string;
	loginUrl: string;
	cookies: string[] = [];
	cookieHeader: string = '';
	ticktickServer: string = 'ticktick.com';
	protocol: string = 'https://';
	apiProtocol: string = 'https://api.';
	apiVersion: string = '/api/v2';
	originUrl: string;
	userAgent: string;
	deviceAgent: string;

	constructor({ username, password, baseUrl, token, checkPoint }: IoptionsProps) {
		this.username = username;
		this.password = password;
		this.token = token;
		this.inboxProperties = {
			id: '', sortOrder: 0
		};
		this.userAgent = getTickUserAgent();
		this.deviceAgent = getTickXDevice();

		if (baseUrl) {
			this.apiUrl = `${this.apiProtocol}${baseUrl}${this.apiVersion}`;
			this.loginUrl = `${this.protocol}${baseUrl}${this.apiVersion}`;
			this.originUrl = `${this.protocol}${baseUrl}`;
		} else {
			this.apiUrl = `${this.apiProtocol}${this.ticktickServer}${this.apiVersion}`;
			this.loginUrl = `${this.protocol}${this.ticktickServer}${this.apiVersion}`;
			this.originUrl = `${this.protocol}${this.ticktickServer}`;
		}

		if (checkPoint != undefined) {
			this._checkpoint = checkPoint;
		} else {
			this.getPreviousCheckPoint();
		}

	}

	private _checkpoint: number = 0;

	get checkpoint(): number {
		return this._checkpoint;
	}

	set checkpoint(value: number) {
		this._checkpoint = value;
	}

	get inboxId(): string {
		return this.inboxProperties.id;
	}

	private _lastError: unknown;

	get lastError(): unknown {
		return this._lastError;
	}

	set lastError(value: unknown) {
		this._lastError = value;
	}

	// USER ======================================================================
	async login(): Promise<{ inboxId: string; token: string } | null> {
		try {
			const url = `${this.loginUrl}/${signInEndPoint}`;
			const body = {
				username: this.username,
				password: this.password
			};
			const response = await this.makeRequest('Login', url, 'POST', body);
			log.debug('Signed in Response: ', response);
			if (response) {
				const r = response as { token: string; inboxId: string };
				this._checkpoint = 0;
				return {
					token: r.token,
					inboxId: r.inboxId
				};
			}
		} catch (error) {
			tickSetError(this, 'Login', null, error);
			log.error(error);
		}
		return null;
	}

	async getUserSettings(): Promise<Record<string, unknown>[] | null> {
		try {

			const url = `${this.apiUrl}/${userPreferencesEndPoint}`;

			const response = await this.makeRequest('Get User Settings', url, 'GET', undefined);
			if (response) {
				return response as Record<string, unknown>[];
			} else {
				return null;
			}
		} catch (e) {
			log.error('Get Inbox Properties failed: ', e);
			tickSetError(this, 'Get Inbox Properties', null, e);
			return null;
		}
	}

	async getUserStatus(): Promise<{ token: string; inboxId: string; userID: string } | null> {
		try {

			const url = `${this.apiUrl}/${userStatus}`;
			const response = await this.makeRequest('Get User status', url, 'GET', undefined);
			if (response) {
				const r = response as { inboxId: string; username: string };
				return {
					token: this.token,
					inboxId: r.inboxId,
					userID: r.username
				};
			} else {
				return null;
			}
		} catch (e) {
			log.error('Get User Status failed: ', e);
			tickSetError(this, 'Get User Status', null, e);
			return null;
		}
	}

	async getInboxProperties(): Promise<boolean> {
		try {
			for (let i = 0; i < 10; i++) {
				if (i !== 0) this.reset();
				const url = `${this.apiUrl}/${allTasksEndPoint}` + this._checkpoint;
				const response = await this.makeRequest('Get Inbox Properties', url, 'GET');
				if (!response) continue;

				const bean = response as { syncTaskBean: { update: { projectId: string; sortOrder: number }[] } };
				bean.syncTaskBean.update.forEach((task: { projectId: string; sortOrder: number }) => {
					if (task.projectId == this.inboxProperties.id && task.sortOrder < this.inboxProperties.sortOrder) {
						this.inboxProperties.sortOrder = task.sortOrder;
					}
				});
				this.inboxProperties.sortOrder--;
				return true;
			}
		} catch (e) {
			log.error('Get Inbox Properties failed: ', e);
			tickSetError(this, 'Get Inbox Properties', null, e);
		}
		return false;
	}

	// FILTERS ===================================================================

	// TODO: If Filters required at some point, they come from allTasksEndPoint

	// TAGS ======================================================================

	async getTags(): Promise<ITag[]> {
		try {
			const url = `${this.apiUrl}/${allTagsEndPoint}`;
			const response = await this.makeRequest('Get Tags', url, 'GET', undefined);
			if (response) {
				return response as ITag[];
			}
		} catch (e) {
			log.error('Get Tags failed: ', e);
			tickSetError(this, 'Get Tags', null, e);
		}
		return [];
	}

	async createTags(tags: { label: string; name: string; parent: string | null }[]): Promise<unknown> {
		try {
			const url = `${this.apiUrl}/${batchTagEndPoint}`;
			const payload = { add: tags };
			const response = await this.makeRequest('Create Tags', url, 'POST', payload);
			return response;
		} catch (e) {
			log.error('Create Tags failed: ', e);
			tickSetError(this, 'Create Tags', null, e);
			return null;
		}
	}

	// HABITS ====================================================================

	//TODO: if Habits required, they come from allHabitsEndPoint

	// PROJECTS ==================================================================

	//TODO, we could get all the project related information in one swell foop.
	async getProjectGroups(): Promise<IProjectGroup[]> {
		try {
			const url = `${this.apiUrl}/${allProjectGroupsEndPoint}/0`;
			const response = await this.makeRequest('Get Project Groups', url, 'GET', undefined);
			if (response) {
				// API returns wrapped format: { projectGroups: [{ id, group: IProjectGroup }, ...] }
				// We need to unwrap to get the actual IProjectGroup objects
				const raw = (response as { projectGroups: unknown[] }).projectGroups;
				if (Array.isArray(raw)) {
					return raw.map(g => ((g as Record<string, unknown>)?.group ?? g)) as IProjectGroup[];
				}
			}
		} catch (e) {
			log.error('Get ProjectF Groups failed: ', e);
			tickSetError(this, 'Get Project Groups', null, e);
		}
		return [];
	}

	async getProjects(): Promise<IProject[]> {
		try {
			const url = `${this.apiUrl}/${allProjectsEndPoint}`;
			const response = await this.makeRequest('Get Projects', url, 'GET', undefined);
			if (response) {
				return response as IProject[];
			}
		} catch (e) {
			log.error('Get Projects failed: ', e);
			tickSetError(this, 'Get Projects', null, e);
		}
		return [];
	}


	async getProjectSections(projectId: string): Promise<ISections[]> {
		try {
			const url = `${this.apiUrl}/${getSections}/${projectId}`;
			const response = await this.makeRequest('Get Project Sections', url, 'GET', undefined);
			if (response) {
				return response as ISections[];
			} else {
				return [];
			}
		} catch (e) {
			log.error('Get Project Sections failed: ', e);
			tickSetError(this, 'Get Project Sections', null, e);
			return [];
		}
	}

	async updateProject(project: IProject): Promise<unknown> {
		try {
			const updatePayload: UpdatePayload = {
				add: [],
				addAttachments: [],
				delete: [],
				deleteAttachments: [],
				updateAttachments: [],
				update: [project]
			};
			const url = `${this.apiUrl}/${updateProjectEndPoint}`;
			const response = await this.makeRequest('Update project', url, 'POST', updatePayload);
			if (response) {
				return response;
			} else {
				return null;
			}
		} catch (e) {
			log.error('Get Project Sections failed: ', e);
			tickSetError(this, 'Get Project Sections', null, e);
			return [];
		}
	}

	async getUpdatedTasks(since: number): Promise<{ update: ITask[], delete: string[] }> {
		log.debug('Get updated tasks', 'Since', since > 0 ? new Date(since).toISOString() : 'from the beginning of time.');
		const url = `${this.apiUrl}/${allTasksEndPoint}` + since;
		const response = await this.makeRequest('Get All Resources', url, 'GET', undefined);
		if (!response) {
			const err = new TickTickPullError('Get Updated Tasks failed: no response');
			log.error(err.message);
			tickSetError(this, 'Get All Resources', null, err);
			throw err;
		}
		const r = response as {
			checkPoint?: number;
			syncTaskBean?: { update?: ITask[]; add?: ITask[]; delete?: string[] };
		};
		if (!r.syncTaskBean) {
			const err = new TickTickPullError('Get Updated Tasks failed: malformed response');
			log.error(err.message);
			tickSetError(this, 'Get All Resources', null, err);
			throw err;
		}
		// Advance the checkpoint only after a readable delta. A failure leaves the previous value.
		if (typeof r.checkPoint === 'number') this._checkpoint = r.checkPoint;
		const update = r.syncTaskBean.update ?? [];
		const add = r.syncTaskBean.add ?? [];
		return {
			update: add.length ? [...update, ...add] : update,
			delete: r.syncTaskBean.delete ?? [],
		};
	}

	// RESOURCES =================================================================
	async getAllResources(): Promise<IBatch | null> {
		try {
			let retry = 10;
			while (retry > 0) {
				const checkpointDate = new Date(this._checkpoint);
				log.debug('Get All Resources', this._checkpoint ? 'as of: ' + checkpointDate.toISOString() : 'from the beginning of time. ');
				const url = `${this.apiUrl}/${allTasksEndPoint}` + this._checkpoint;
				const response = await this.makeRequest('Get All Resources', url, 'GET', undefined);
				if (response) {
					return response as IBatch;
				}
				retry -= 1;
				this.getPreviousCheckPoint();
			}
		} catch (e) {
			log.error('Get All Resources failed: ', e);
			tickSetError(this, 'Get All Resources', null, e);
		}
		return null;
	}

	// TASKS =====================================================================
	async getTaskDetails(): Promise<ITask[]> {
		try {
			let retry = 10;
			while (retry > 0) {
				const url = `${this.apiUrl}/${allTasksEndPoint}` + this._checkpoint;
				const response = await this.makeRequest('Get Task Details', url, 'GET', undefined);
				if (response) {
					const r = response as { checkPoint: number; syncTaskBean: { update: ITask[] } };
					const numReturns = r.syncTaskBean.update.length;
					if (numReturns > 0) {
						if (getSettings().checkPoint != r.checkPoint) {
							this._checkpoint = r.checkPoint;
							getSettings().checkPoint = this._checkpoint;
							updateSettings({ checkPoint: this._checkpoint });
						}
						return r.syncTaskBean as unknown as ITask[];
					} else {
						retry -= 1;
						this.getPreviousCheckPoint();
					}
				} else {
					retry -= 1;
					this.getPreviousCheckPoint();
				}
			}
			return [];
		} catch (e) {
			log.error('Get Tasks Details failed: ', e);
			tickSetError(this, 'Get Tasks', null, e);
			return [];
		}
	}


	//TODO: I believe this is a leftover. I further believe it can safely go away. But I don't believe it strongly
	//      enough to actually do the deletion.
	async getTasks(): Promise<ITask[]> {
		try {
			let retry = 3;
			while (retry > 0) {
				const url = `${this.apiUrl}/${allTasksEndPoint}` + this._checkpoint;
				const response = await this.makeRequest('Get Tasks', url, 'GET', undefined);
				if (response) {
					const r = response as { syncTaskBean: { update: ITask[] } };
					return r.syncTaskBean.update;
				} else {
					if (retry > 0) {
						this.getPreviousCheckPoint();
						retry = retry - 1;
					} else {
						return [];
					}
				}
			}
			return [];
		} catch (e) {
			log.error('Get Tasks failed: ', e);
			tickSetError(this, 'Get Tasks', null, e);
			return [];
		}
	}

	async getTask(taskID: string, projectID: string | undefined | null): Promise<ITask | null> {
		try {
			let url = `${this.apiUrl}/${TaskEndPoint}/${taskID}`;


			if (projectID) {
				const projectParam = `?projectID=${projectID}`;
				url = url + projectParam;
			}
			const response = await this.makeRequest('Get Tasks', url, 'GET', undefined);
			if (response) {
				return response as ITask;
			} else {
				return null;
			}
		} catch (e) {
			log.error('Get Tasks failed: ', e);
			tickSetError(this, 'Get Tasks', null, e);
			return null;
		}
	}

	async getAllCompletedItems(): Promise<ITask[]> {
		try {
			const url = `${this.apiUrl}/${getAllCompletedItems}`;
			const response = await this.makeRequest('Get All Completed Items', url, 'GET', undefined);
			if (response) {
				return (response as { syncTaskBean: { update: ITask[] } }).syncTaskBean.update;
			} else {
				return [];
			}
		} catch (e) {
			log.error('Get All Completed Items failed: ', e);
			tickSetError(this, 'Get All Completed Tasks', null, e);
			return [];
		}
	}

	async addTask(task: ITask): Promise<unknown> {
		try {
			let bIsAllDay = true;
			if (task.isAllDay == null) {
				bIsAllDay = true;
			} else {
				bIsAllDay = task.isAllDay;
			}
			// Canonical positive triggers (e.g. TRIGGER:PT30M, TRIGGER:P1D)
			// for both the singular and plural reminder fields.
			const triggers = (task.reminders || []).map(r => normalizeTrigger(r.trigger));
			const thisTask = {
				id: task.id ? task.id : ObjectID().toHexString(),
				projectId: task.projectId ? task.projectId : this.inboxProperties.id,
				sortOrder: task.sortOrder ? task.sortOrder : this.inboxProperties.sortOrder,
				title: task.title,
				content: task.content ? task.content : '',
				desc: task.desc ? task.desc : '',
				startDate: task.startDate ? task.startDate : null as unknown as string,
				dueDate: task.dueDate ? task.dueDate : null as unknown as string,
				timeZone: task.timeZone,
				isAllDay: bIsAllDay,
				// Send the completion time so a completed task's completion
				// date survives a push. Omitting it makes TickTick reset the
				// date to "now" (issue #209).
				completedTime: task.completedTime ?? null,
				// POST /task uses the legacy web API's native {id, trigger}
				// reminder shape (same as batch/check). Generate reminder ids
				// client-side, matching the TickTick/Dida web client. The singular
				// `reminder` field must carry the first (or only) trigger.
				reminder: triggers[0] || task.reminder || null,
				reminders: triggers.map(t => ({ id: ObjectID().toHexString(), trigger: t })),
				repeatFlag: task.repeatFlag ? task.repeatFlag : null as unknown as string,
				priority: task.priority ? task.priority : 0,
				status: task.status ? task.status : 0,
				items: task.items ? task.items : [],
				progress: task.progress ? task.progress : 0,
				modifiedTime: task.modifiedTime ? task.modifiedTime : new Date().toISOString().replace('Z', '+0000'),
				deleted: task.deleted ? task.deleted : 0,
				assignee: task.assignee ? task.assignee : null,
				isDirty: task.isDirty ? task.isDirty as boolean : true,
				local: task.local ? task.local as boolean : true,
				remindTime: task.remindTime ? task.remindTime : null as unknown as string,
				tags: task.tags ? task.tags : [],
				childIds: task.childIds ? task.childIds : [],
				parentId: task.parentId ? task.parentId : null as unknown as string
			} as unknown as ITask;

			const url = `${this.apiUrl}/${TaskEndPoint}`;
			// TEMP DEBUG: dump the exact create payload sent to POST /task.
			// log.info('Add Task payload:', JSON.stringify(thisTask, null, 2));
			const response = await this.makeRequest('Add Task', url, 'POST', thisTask);
			// TEMP DEBUG: dump the raw response (and the API error when rejected).
			// log.info('Add Task response:', JSON.stringify(response), this.lastError ? `lastError: ${JSON.stringify(this.lastError)}` : '');
			if (response) {
				// POST /task sometimes wraps the created task in {ok, result} —
				// unwrap it so callers get the task object directly.
				const raw = response as { ok?: boolean; result?: { sortOrder?: number } };
				const created = raw.ok && raw.result ? raw.result : response;
				this.inboxProperties.sortOrder = ((created as { sortOrder?: number }).sortOrder ?? 0) - 1;

				return created;
			} else {
				return [];
			}
		} catch (e) {
			log.error('Add Task failed: ', e);
			tickSetError(this, 'Add Task', null, e);
			return [];
		}

	}

	async updateTask(jsonOptions: ITask): Promise<unknown> {
		try {
			let bIsAllDay = true;
			if (jsonOptions.isAllDay == null) {
				bIsAllDay = true;
			} else {
				bIsAllDay = jsonOptions.isAllDay;
			}
			const thisTask = {
				id: jsonOptions.id ? jsonOptions.id : ObjectID().toHexString(),
				projectId: jsonOptions.projectId ? jsonOptions.projectId : this.inboxProperties.id,
				sortOrder: jsonOptions.sortOrder ? jsonOptions.sortOrder : this.inboxProperties.sortOrder,
				title: jsonOptions.title,
				content: jsonOptions.content ? jsonOptions.content : '',
				desc: jsonOptions.desc ? jsonOptions.desc : '',
				startDate: jsonOptions.startDate ? jsonOptions.startDate : null as unknown as string,
				dueDate: jsonOptions.dueDate ? jsonOptions.dueDate : null as unknown as string,
				timeZone: jsonOptions.timeZone,
				isAllDay: bIsAllDay,
				// Send the completion time so a completed task's completion
				// date survives a push. Omitting it makes TickTick reset the
				// date to "now" (issue #209).
				completedTime: jsonOptions.completedTime ?? null,
				// Populated from the first trigger in the reminders array,
				// matching the legacy create path. Without this, TickTick
				// silently drops all reminders on update.
				reminder: jsonOptions.reminders?.[0] ? normalizeTrigger(jsonOptions.reminders[0].trigger) : (jsonOptions.reminder || null),
				// batch/task uses the {id, trigger} object form returned by the web sync API.
				// Existing reminders keep their TickTick id; new ones get a client-generated
				// ObjectId, matching reminders created by the TickTick/Dida web client.
				// Triggers are normalized to the positive canonical form TickTick accepts.
				reminders: (jsonOptions.reminders || []).map(r => ({
					id: r.id || ObjectID().toHexString(),
					trigger: r.id ? r.trigger : normalizeTrigger(r.trigger),
				})),
				repeatFlag: jsonOptions.repeatFlag ? jsonOptions.repeatFlag : null as unknown as string,
				priority: jsonOptions.priority ? jsonOptions.priority : 0,
				status: jsonOptions.status ? jsonOptions.status : 0,
				items: jsonOptions.items ? jsonOptions.items : [],
				progress: jsonOptions.progress ? jsonOptions.progress : 0,
				modifiedTime: jsonOptions.modifiedTime ? jsonOptions.modifiedTime : new Date().toISOString().replace('Z', '+0000'),
				deleted: jsonOptions.deleted ? jsonOptions.deleted : 0,
				assignee: jsonOptions.assignee ? jsonOptions.assignee : null,
				isDirty: jsonOptions.isDirty ? jsonOptions.isDirty as boolean : true,
				local: jsonOptions.local ? jsonOptions.local as boolean : true,
				remindTime: jsonOptions.remindTime ? jsonOptions.remindTime : null as unknown as string,
				tags: jsonOptions.tags ? jsonOptions.tags : [],
				childIds: jsonOptions.childIds ? jsonOptions.childIds : [],
				parentId: jsonOptions.parentId ? jsonOptions.parentId : null as unknown as string
			} as unknown as ITask;

			const updatePayload: UpdatePayload = {
				add: [],
				addAttachments: [],
				delete: [],
				deleteAttachments: [],
				updateAttachments: [],
				update: [thisTask]
			};
			const url = `${this.apiUrl}/${updateTaskEndPoint}`;
			const response = await this.makeRequest('Update Task', url, 'POST', updatePayload);
			if (response) {
				return response;
			} else {
				return null;
			}
		} catch (e) {
			log.error('Update Task failed: ', e);
			tickSetError(this, 'Update Task', null, e);
			return null;
		}
	}


	/** Partial batch update that only moves tasks (sortOrder); other fields stay untouched in TickTick. */
	async setSortOrders(items: { id: string; projectId: string; sortOrder: number }[]): Promise<unknown> {
		if (!items.length) return null;
		const payload = { add: [], addAttachments: [], delete: [], deleteAttachments: [], updateAttachments: [], update: items } as unknown as UpdatePayload;
		return this.makeRequest('Set Sort Orders', `${this.apiUrl}/${updateTaskEndPoint}`, 'POST', payload);
	}

	async deleteTask(deleteTaskId: string, deletedTaskprojectId: string): Promise<unknown> {
		if (!deleteTaskId || !deletedTaskprojectId) {
			throw new Error('Both Task Id and Project ID are required for a delete, otherwise TickTick will fail silently.');
		}
		try {
			const taskToDelete = { taskId: deleteTaskId, projectId: deletedTaskprojectId };

			const deletePayload: UpdatePayload = {
				add: [],
				addAttachments: [],
				delete: [taskToDelete],
				deleteAttachments: [],
				updateAttachments: [],
				update: []
			};

			const url = `${this.apiUrl}/${updateTaskEndPoint}`;
			const response = await this.makeRequest('Delete Task', url, 'POST', deletePayload);
			if (response) {
				const r = response as { sortOrder: number };
				this.inboxProperties.sortOrder = r.sortOrder - 1;
				return response;
			} else {
				return null;
			}
		} catch (e) {
			log.error('Delete Task  failed: ', e);
			tickSetError(this, 'Delete Task Tasks', null, e);
			return null;
		}
	}

	async batchUpdate(payload: { add?: unknown[]; update?: unknown[]; delete?: unknown[] }): Promise<unknown> {
		try {
			const updatePayload: UpdatePayload = {
				add: payload.add || [],
				addAttachments: [],
				delete: payload.delete || [],
				deleteAttachments: [],
				updateAttachments: [],
				update: payload.update || []
			};
			const url = `${this.apiUrl}/${updateTaskEndPoint}`;
			const response = await this.makeRequest('Batch Update', url, 'POST', updatePayload);
			return response;
		} catch (e) {
			log.error('Batch Update failed: ', e);
			tickSetError(this, 'Batch Update', null, e);
			return null;
		}
	}


	async exportData(): Promise<string | null> {
		try {
			const url = `${this.apiUrl}/${exportData}`;
			const response = await this.makeRequest('Export', url, 'GET', undefined);
			if (response) {
				let body = response as string;
				body = body.substring(1);
				body = body.substring(0, body.length - 1);

				body = body.replace(/\\"/g, '"');
				body = body.replace(/\\n/g, '\n');

				return body;
			} else {
				return null;
			}
		} catch (e) {
			log.error('Export failed: ', e);
			tickSetError(this, 'Export', null, e);
			return null;
		}
	}


	async projectMove(taskId: string, fromProjectId: string, toProjectId: string): Promise<string | null> {
		try {
			const url = `${this.apiUrl}/${projectMove}`;

			const projectMovePayload = [{
				fromProjectId: fromProjectId,
				toProjectId: toProjectId,
				taskId: taskId,
				sortOrder: this.inboxProperties.sortOrder
			}];

			const response = await this.makeRequest('Project Move', url, 'POST', projectMovePayload);
			if (!response || (Array.isArray(response) && response.length === 0)) {
				return null;
			}
			if (response) {
				const r = response as { sortOrder: number };
				this.inboxProperties.sortOrder = r.sortOrder - 1;
				return response as string;
			} else {
				return null;
			}
		} catch (e) {
			log.error('Project Move failed: ', e);
			tickSetError(this, 'Project Move', null, e);
			return null;
		}
	}

	/**
	 * Fetch TickTick comments for a task.
	 * Returns `null` when the remote state is unknown (HTTP/network failure or
	 * unparseable body) so callers fail closed instead of treating the miss as
	 * an empty list (BUG-COMMENT-GET-FAIL-OPEN).
	 */
	async getTaskComments(projectId: string, taskId: string): Promise<ITaskComment[] | null> {
		try {
			const url = `${this.apiUrl}/${taskComments(projectId, taskId)}`;
			const response = await this.makeRequest('Get Task Comments', url, 'GET', undefined);
			if (!response) return null;
			if (Array.isArray(response)) return response as ITaskComment[];
			if (typeof response !== 'object') return null;
			const wrapped = response as {
				comments?: ITaskComment[];
				data?: ITaskComment[];
				result?: ITaskComment[] | { comments?: ITaskComment[] };
			};
			if (Array.isArray(wrapped.comments)) return wrapped.comments;
			if (Array.isArray(wrapped.data)) return wrapped.data;
			const r = wrapped.result;
			if (Array.isArray(r)) return r;
			if (r && typeof r === 'object' && Array.isArray((r as { comments?: ITaskComment[] }).comments)) {
				return (r as { comments: ITaskComment[] }).comments;
			}
			// Non-empty body we cannot parse → unknown, not empty.
			return null;
		} catch (e) {
			log.error('Get Task Comments failed: ', e);
			tickSetError(this, 'Get Task Comments', null, e);
			return null;
		}
	}

	async addTaskComment(projectId: string, taskId: string, title: string): Promise<ITaskComment | null> {
		try {
			const url = `${this.apiUrl}/${taskComment(projectId, taskId)}`;
			const body = buildAddTaskCommentBody(projectId, taskId, title);
			const response = await this.makeRequest('Add Task Comment', url, 'POST', body);
			if (this._lastError) return null;
			const parsed = parseTaskCommentFromApiResponse(response, String(body.title));
			if (parsed) return parsed;
			// TickTick often returns HTTP 200 with an empty body; the client id is the comment id.
			return { id: String(body.id), title: String(body.title) };
		} catch (e) {
			log.error('Add Task Comment failed: ', e);
			tickSetError(this, 'Add Task Comment', null, e);
			return null;
		}
	}

	/**
	 * PUT the same path DELETE uses. Empty HTTP 200 keeps `commentId` (GAP-COMMENT-EDIT).
	 * Live TickTick.com confirm is still not run; dida-cli marks this PUT stable.
	 */
	async updateTaskComment(projectId: string, taskId: string, commentId: string, title: string): Promise<ITaskComment | null> {
		try {
			const url = `${this.apiUrl}/${taskCommentDelete(projectId, taskId, commentId)}`;
			const body = buildUpdateTaskCommentBody(title);
			const response = await this.makeRequest('Update Task Comment', url, 'PUT', body);
			if (this._lastError) return null;
			const parsed = parseTaskCommentFromApiResponse(response, String(body.title));
			if (parsed) return parsed;
			if (response && typeof response === 'object') {
				return { id: commentId, title: String(body.title) };
			}
			return null;
		} catch (e) {
			log.error('Update Task Comment failed: ', e);
			tickSetError(this, 'Update Task Comment', null, e);
			return null;
		}
	}

	async deleteTaskComment(projectId: string, taskId: string, commentId: string): Promise<boolean> {
		try {
			const url = `${this.apiUrl}/${taskCommentDelete(projectId, taskId, commentId)}`;
			const response = await this.makeRequest('Delete Task Comment', url, 'DELETE', undefined);
			return response !== null;
		} catch (e) {
			log.error('Delete Task Comment failed: ', e);
			tickSetError(this, 'Delete Task Comment', null, e);
			return false;
		}
	}

	async parentMove(taskId: string, newParentId: string, projectId: string): Promise<string | null> {
		try {
			const url = `${this.apiUrl}/${parentMove}`;
			const parentMovePayLoad = [{
				parentId: newParentId, projectId: projectId, taskId: taskId
			}];

			const response = await this.makeRequest('Project Move', url, 'POST', parentMovePayLoad);
			if (response) {
				const r = response as { sortOrder: number };
				this.inboxProperties.sortOrder = r.sortOrder - 1;
				return response as string;
			}
			return null;
		} catch (e) {
			log.error('Parent Move failed: ', e);
			tickSetError(this, 'Parent Move', null, e);
			return null;
		}
	}


	async makeRequest(operation: string, url: string, method: string, body: unknown = undefined): Promise<unknown> {
		return tickMakeRequest(this as TickHttpHost, operation, url, method, body);
	}

	private getPreviousCheckPoint() {
		let dtDate = new Date();
		dtDate.setDate(dtDate.getDate() - 15);
		this._checkpoint = dtDate.getTime();
		log.debug('Checkpoint has been changed.', this._checkpoint);
		return this._checkpoint;
	}

	private reset() {
		this._checkpoint = this.getPreviousCheckPoint();
	}

}
