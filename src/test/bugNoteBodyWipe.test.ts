/**
 * BUG-NOTE-BODY-WIPE: incidental vault→TT update must not clear TickTick body
 * when the vault line did not intentionally change notes.
 * Spec: NOTE-BODY / docs/pilot/NOTE-BODY.md
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TaskModificationDetector } from '@/services/TaskModificationDetector';
import type { ITask } from '@/api/types/Task';
import { getSettings } from '@/settings';

vi.mock('@/utils/logger', () => ({
	default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const S = () => (getSettings as unknown as () => Record<string, unknown>)();

function task(partial: Partial<ITask>): ITask {
	return {
		id: 'abcdefabcdefabcdefabcdef',
		projectId: 'proj-1',
		title: 'same title',
		status: 0,
		tags: [],
		priority: 0,
		content: '',
		desc: '',
		items: [],
		...partial,
	} as ITask;
}

function stubParser() {
	return {
		areNotesChanged: (a: string, b: string) => (a ?? '') !== (b ?? ''),
		isTitleChanged: () => false,
		isTagsChanged: () => false,
		isStatusChanged: () => false,
		isParentIdChanged: () => false,
		areItemsChanged: () => false,
		areRemindersChanged: () => false,
		preserveReminders: () => undefined,
	};
}

describe('BUG-NOTE-BODY-WIPE', () => {
	beforeEach(() => {
		Object.assign(S(), { syncNotes: true, abyssTasksFormat: false, syncAbyssCommentsViaApi: false });
	});

	it('detectNotesModification: empty vault note vs non-empty TT body is a notes change', () => {
		const detector = new TaskModificationDetector({} as never, {
			taskParser: stubParser(),
			dateMan: { areDatesChanged: () => false },
		} as never);

		expect(detector.detectNotesModification(
			task({ content: '' }),
			task({ content: 'Hello from TickTick' }),
		)).toBe(true);
	});

	it('detectNotesModification: empty both sides is not a notes change', () => {
		const detector = new TaskModificationDetector({} as never, {
			taskParser: stubParser(),
			dateMan: { areDatesChanged: () => false },
		} as never);

		expect(detector.detectNotesModification(
			task({ content: '' }),
			task({ content: '' }),
		)).toBe(false);
	});

	it('BUG-NOTE-BODY-WIPE: tag-only push preserves saved content when notesModified is false', async () => {
		const updateTask = vi.fn(async (t: ITask) => ({ ...t }));
		const upsertTask = vi.fn(async () => undefined);
		const markVaultInSync = vi.fn(async () => undefined);

		const detector = new TaskModificationDetector(
			{ vault: { getAbstractFileByPath: () => null } } as never,
			{
				taskParser: { ...stubParser(), isTagsChanged: () => true },
				dateMan: {
					areDatesChanged: () => false,
					formatDateToISO: () => '2026-10-26T00:00:00.000+0000',
				},
				fileMetadataService: { getFilepathForTask: async () => 'Inbox/a.md' },
				tickTickRestAPI: { updateTask, getTaskById: async () => null },
				taskRepository: { upsertTask, markVaultInSync },
			} as never,
		);

		const line = task({ content: '', tags: ['gtd-next'] });
		const saved = task({ content: 'Keep this TT note', tags: ['gtd-next', 'old'] });
		const mods = detector.detectModifications(line, saved, { task: '', parentId: '', taskLines: [] });
		mods.notesModified = false;
		mods.tagsModified = true;

		await detector.applyModifications(line, saved, mods, 'Inbox/a.md', line.id, 'hash', {
			task: line.title,
			parentId: '',
			taskLines: [],
		});

		expect(updateTask).toHaveBeenCalled();
		const sent = updateTask.mock.calls[0][0] as ITask;
		expect(sent.content).toBe('Keep this TT note');
	});

	it('BUG-NOTE-BODY-WIPE: Abyss delimiter children must not wipe TT body', async () => {
		Object.assign(S(), { syncNotes: true, abyssTasksFormat: true, syncAbyssCommentsViaApi: true });
		const updateTask = vi.fn(async (t: ITask) => ({ ...t }));
		const detector = new TaskModificationDetector(
			{ vault: { getAbstractFileByPath: () => null } } as never,
			{
				taskParser: { ...stubParser(), isTagsChanged: () => true },
				dateMan: {
					areDatesChanged: () => false,
					formatDateToISO: () => '2026-10-26T00:00:00.000+0000',
				},
				fileMetadataService: { getFilepathForTask: async () => 'Inbox/a.md' },
				tickTickRestAPI: { updateTask, getTaskById: async () => null },
				taskRepository: { upsertTask: vi.fn(), markVaultInSync: vi.fn() },
			} as never,
		);

		const DELIM = '-------------------------------------------------------------';
		const line = task({ content: '', tags: ['gtd-next'] });
		const saved = task({ content: 'Keep this TT note', tags: [] });
		const mods = detector.detectModifications(line, saved, {
			task: '',
			parentId: '',
			taskLines: [`\t${DELIM}`, '\tHello delimiter', `\t${DELIM}`],
		});
		expect(mods.notesModified).toBe(true);
		mods.tagsModified = true;

		await detector.applyModifications(line, saved, mods, 'Inbox/a.md', line.id, 'hash', {
			task: line.title,
			parentId: '',
			taskLines: [`\t${DELIM}`, '\tHello delimiter', `\t${DELIM}`],
		});

		const sent = updateTask.mock.calls[0][0] as ITask;
		expect(sent.content).toBe('Keep this TT note');
	});
});
