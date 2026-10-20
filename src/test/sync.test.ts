import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pullFromTickTick } from '../sync/pull';
import { db } from '../db/dexie';

// Mock the dependencies
vi.mock('../db/dexie', () => ({
	db: {
		tasks: {
			get: vi.fn(),
			put: vi.fn(),
			update: vi.fn(),
			bulkPut: vi.fn(),
			where: vi.fn(() => ({
				anyOf: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
				equals: vi.fn(() => ({ first: vi.fn(), toArray: vi.fn().mockResolvedValue([]) })),
				first: vi.fn(),
				toArray: vi.fn().mockResolvedValue([]),
			})),
		},
		meta: {
			update: vi.fn(),
		},
		transaction: vi.fn((_mode, _table, callback) => callback()),
	},
}));

vi.mock('@/db/taskCommentMaps', () => ({
	deleteCommentMapsForTask: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../sync/journal', () => ({
	logSyncEvent: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
	default: {
		debug: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	},
}));

vi.mock('./conflicts', () => ({
	resolveTaskConflict: vi.fn((local, remote) => ({
		resolved: remote,
		conflictDetected: false,
		winner: "remote" as const,
	})),
}));

const mockSaveSettings = vi.fn().mockResolvedValue(undefined);
vi.mock('../settings', () => ({
	updateSettings: vi.fn(),
}));

describe('pullFromTickTick', () => {
	const mockApi = {
		getUpdatedTasks: vi.fn(),
		checkpoint: 123456789,
		plugin: {
			dateMan: { addDateHolderToTask: vi.fn() },
			saveSettings: mockSaveSettings,
		},
	} as any;

	const mockMeta = {
		deviceId: 'test-device',
		lastFullSync: 0,
		lastDeltaSync: 0,
		schemaVersion: 2,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	function makeMockWhere(options?: { anyOfResult?: any[]; firstResult?: any }) {
		const anyOfToArray = vi.fn().mockResolvedValue(options?.anyOfResult ?? []);
		const anyOf = vi.fn(() => ({ toArray: anyOfToArray }));
		const first = vi.fn().mockResolvedValue(options?.firstResult ?? undefined);
		const equals = vi.fn(() => ({ first, toArray: vi.fn().mockResolvedValue([]) }));
		const mockWhere = vi.fn(() => ({ anyOf, equals, first: vi.fn(), toArray: vi.fn().mockResolvedValue([]) }));
		return { mockWhere, anyOf, anyOfToArray, equals, first };
	}

	it('should get task by taskId index', async () => {
		const remoteTask = {
			id: 'remote-task-id',
			modifiedTime: new Date().toISOString(),
			deleted: 0,
		};

		mockApi.getUpdatedTasks.mockResolvedValue({ update: [remoteTask], delete: [] });

		const { mockWhere, anyOf } = makeMockWhere();
		(db.tasks.where as any) = mockWhere;

		await pullFromTickTick(mockApi, mockMeta, false);

		expect(mockWhere).toHaveBeenCalledWith('taskId');
		expect(anyOf).toHaveBeenCalledWith(['remote-task-id']);
	});

	it('should include localId in put task', async () => {
		const remoteTask = {
			id: 'remote-task-id',
			modifiedTime: new Date().toISOString(),
			deleted: 0,
		};

		mockApi.getUpdatedTasks.mockResolvedValue({ update: [remoteTask], delete: [] });
		
		const { mockWhere } = makeMockWhere();
		(db.tasks.where as any) = mockWhere;
		
		await pullFromTickTick(mockApi, mockMeta, false);
		
		const bulkPutCall = (db.tasks.bulkPut as any).mock.calls[0][0];
		expect(bulkPutCall).toHaveLength(1);
		expect(bulkPutCall[0]).toHaveProperty('localId');
		expect(bulkPutCall[0].localId).toBe('tt:remote-task-id');
	});

	it('should handle remote deletions', async () => {
		const deletedId = 'deleted-task-id';
		mockApi.getUpdatedTasks.mockResolvedValue({ update: [], delete: [deletedId] });

		const localTask = { localId: 'local-uuid', taskId: deletedId, deleted: false };
		
		const { mockWhere, anyOfToArray } = makeMockWhere();
		anyOfToArray.mockResolvedValue([localTask]);
		(db.tasks.where as any) = mockWhere;

		await pullFromTickTick(mockApi, mockMeta, false);

		expect(db.tasks.bulkPut).toHaveBeenCalledWith([expect.objectContaining({
			localId: 'local-uuid',
			deleted: true,
		})]);
	});

	it('TP-ECHO-ETAG skips a delta row when the stored etag matches', async () => {
		const remoteTask = {
			id: 'remote-task-id',
			etag: 'same',
			modifiedTime: '2026-10-18T00:00:00.000+0000',
			deleted: 0,
		};
		mockApi.getUpdatedTasks.mockResolvedValue({ update: [remoteTask], delete: [] });
		const { mockWhere, anyOfToArray } = makeMockWhere();
		anyOfToArray.mockResolvedValue([{
			localId: 'tt:remote-task-id',
			taskId: 'remote-task-id',
			task: { id: 'remote-task-id', etag: 'same', modifiedTime: remoteTask.modifiedTime },
			lastModifiedByDeviceId: 'test-device',
		}]);
		(db.tasks.where as any) = mockWhere;
		await pullFromTickTick(mockApi, mockMeta, false);
		expect(db.tasks.bulkPut).not.toHaveBeenCalled();
	});

	it('TP-ECHO-ETAG applies a delta row when etag changed and modifiedTime did not', async () => {
		const remoteTask = {
			id: 'remote-task-id',
			etag: 'new',
			title: 'renamed via api',
			modifiedTime: '2026-10-18T00:00:00.000+0000',
			deleted: 0,
		};
		mockApi.getUpdatedTasks.mockResolvedValue({ update: [remoteTask], delete: [] });
		const { mockWhere, anyOfToArray } = makeMockWhere();
		anyOfToArray.mockResolvedValue([{
			localId: 'tt:remote-task-id',
			taskId: 'remote-task-id',
			task: { id: 'remote-task-id', etag: 'old', title: 'old', modifiedTime: remoteTask.modifiedTime },
			lastModifiedByDeviceId: 'test-device',
		}]);
		(db.tasks.where as any) = mockWhere;
		await pullFromTickTick(mockApi, mockMeta, false);
		expect(db.tasks.bulkPut).toHaveBeenCalled();
		const rows = (db.tasks.bulkPut as any).mock.calls[0][0];
		expect(rows[0].task.etag).toBe('new');
		expect(rows[0].task.title).toBe('renamed via api');
	});

	it('should skip invalid updates', async () => {
		mockApi.getUpdatedTasks.mockResolvedValue({ update: [{ id: undefined, taskId: undefined } as any], delete: [] });

		const { mockWhere } = makeMockWhere();
		(db.tasks.where as any) = mockWhere;

		await pullFromTickTick(mockApi, mockMeta, false);
	});

	it('should handle updates with taskId instead of id', async () => {
		const remoteTask = {
			taskId: 'remote-task-id',
			modifiedTime: new Date().toISOString(),
			deleted: 0,
		};

		mockApi.getUpdatedTasks.mockResolvedValue({ update: [remoteTask], delete: [] });

		const { mockWhere, anyOf } = makeMockWhere();
		(db.tasks.where as any) = mockWhere;

		await pullFromTickTick(mockApi, mockMeta, false);

		expect(mockWhere).toHaveBeenCalledWith('taskId');
		expect(anyOf).toHaveBeenCalledWith(['remote-task-id']);
	});

	it('should skip invalid deletedIds', async () => {
		mockApi.getUpdatedTasks.mockResolvedValue({ update: [], delete: [undefined, null, { notId: 'test' } as any] });

		const { mockWhere } = makeMockWhere();
		(db.tasks.where as any) = mockWhere;

		await pullFromTickTick(mockApi, mockMeta, false);
	});

	it('should handle deletion objects with taskId', async () => {
		const deletedId = 'deleted-task-id';
		mockApi.getUpdatedTasks.mockResolvedValue({ update: [], delete: [{ taskId: deletedId }] });

		const localTask = { localId: 'local-uuid', taskId: deletedId, deleted: false };
		
		const { mockWhere, anyOfToArray, anyOf } = makeMockWhere();
		anyOfToArray.mockResolvedValue([localTask]);
		(db.tasks.where as any) = mockWhere;

		await pullFromTickTick(mockApi, mockMeta, false);

		expect(mockWhere).toHaveBeenCalledWith('taskId');
		expect(anyOf).toHaveBeenCalledWith([deletedId]);
		expect(db.tasks.bulkPut).toHaveBeenCalledWith([expect.objectContaining({
			deleted: true
		})]);
	});

	it('should handle deletion objects with id', async () => {
		const deletedId = 'deleted-task-id';
		mockApi.getUpdatedTasks.mockResolvedValue({ update: [], delete: [{ id: deletedId }] });

		const localTask = { localId: 'local-uuid', taskId: deletedId, deleted: false };
		
		const { mockWhere, anyOfToArray, anyOf } = makeMockWhere();
		anyOfToArray.mockResolvedValue([localTask]);
		(db.tasks.where as any) = mockWhere;

		await pullFromTickTick(mockApi, mockMeta, false);

		expect(mockWhere).toHaveBeenCalledWith('taskId');
		expect(anyOf).toHaveBeenCalledWith([deletedId]);
		expect(db.tasks.bulkPut).toHaveBeenCalledWith([expect.objectContaining({
			deleted: true
		})]);
	});

	it('BUG-SYNC-SILENT-FAIL does not advance the checkpoint when getUpdatedTasks fails', async () => {
		mockApi.getUpdatedTasks.mockRejectedValue(new Error('network down'));
		mockApi.checkpoint = 999;
		const { mockWhere } = makeMockWhere();
		(db.tasks.where as any) = mockWhere;

		await expect(pullFromTickTick(mockApi, mockMeta, false)).rejects.toThrow('network down');

		expect(db.meta.update).not.toHaveBeenCalled();
	});

});
