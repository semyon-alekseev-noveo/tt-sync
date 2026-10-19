import { describe, it, expect } from 'vitest';
import { resolveTaskConflict } from '../sync/conflicts';
import type { LocalTask } from '../db/schema';

function makeTask(overrides: Partial<LocalTask> = {}): LocalTask {
	return {
		localId: 'test-local',
		taskId: 'test-task',
		task: { id: 'test-task', title: 'test', projectId: '' } as unknown,
		updatedAt: 1000,
		lastModifiedByDeviceId: 'device-a',
		file: '',
		source: 'obsidian',
		...overrides
	};
}

describe('resolveTaskConflict', () => {

	it('returns remote when no local exists', () => {
		const remote = makeTask({ updatedAt: 500 });
		const result = resolveTaskConflict(undefined, remote);
		expect(result.resolved).toBe(remote);
		expect(result.conflictDetected).toBe(false);
		expect(result.winner).toBe('remote');
	});

	it('resolves local when local TickTick modifiedTime is newer', () => {
		const local = makeTask({
			updatedAt: 2000,
			task: { id: 'test-task', title: 'local', projectId: '', modifiedTime: '2026-10-19T12:00:00.000Z' } as unknown,
		});
		const remote = makeTask({
			updatedAt: 9000,
			task: { id: 'test-task', title: 'remote', projectId: '', modifiedTime: '2026-10-19T11:00:00.000Z' } as unknown,
		});
		const result = resolveTaskConflict(local, remote);
		expect(result.resolved).toBe(local);
		expect(result.winner).toBe('local');
	});

	it('resolves remote when remote TickTick modifiedTime is newer (ignores inflated local.updatedAt)', () => {
		const local = makeTask({
			updatedAt: 9_000_000,
			file: '00 Inbox/abyss-active.md',
			task: { id: 'test-task', title: 'stale vault', projectId: '', modifiedTime: '2026-10-19T11:00:00.000Z' } as unknown,
		});
		const remote = makeTask({
			updatedAt: 1000,
			task: { id: 'test-task', title: 'from phone', projectId: '', modifiedTime: '2026-10-19T12:00:00.000Z' } as unknown,
		});
		const result = resolveTaskConflict(local, remote);
		expect(result.winner).toBe('remote');
		expect(result.resolved.task.title).toBe('from phone');
		expect(result.resolved.file).toBe('00 Inbox/abyss-active.md');
	});

	it('on tie prefers remote task body but keeps local file path', () => {
		const local = makeTask({
			updatedAt: 1000,
			file: 'note.md',
			task: { id: 'test-task', title: 'old', projectId: '', modifiedTime: '2026-10-19T12:00:00.000Z' } as unknown,
		});
		const remote = makeTask({
			updatedAt: 1000,
			task: { id: 'test-task', title: 'new', projectId: '', modifiedTime: '2026-10-19T12:00:00.000Z' } as unknown,
		});
		const result = resolveTaskConflict(local, remote);
		expect(result.winner).toBe('remote');
		expect(result.resolved.task.title).toBe('new');
		expect(result.resolved.file).toBe('note.md');
	});
});
