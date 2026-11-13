import { describe, expect, it, vi } from 'vitest';

/**
 * BUG-TT-TAGFILTER-INBOX (#299).
 *
 * A task created in a TickTick tag-filtered view keeps the `note/<slug>` (or
 * `proj/<slug>`) context tag; the orphan Add must land in that note file
 * instead of the Abyss capture file.
 *
 * Live found on 2.0.97: the fix shipped inert because the DB lookup compared a
 * slug (`don-253`) against a `db.files` path basename that still carried the
 * extension (`don-253.md`), so it always returned undefined and fell back to
 * `00 Inbox/abyss-active.md`. These tests drive the real lookup with realistic
 * vault paths, which the 2.0.97 tests did not.
 */

const VAULT_FILES = [
	{ path: '00 Inbox/abyss-active.md' },
	{ path: '30 Tasks/301 Noveo_tasks/DON-253.md' },
	{ path: '10 Projects/Work X.md' },
	{ path: 'zz-parked/Parked Note.md' },
];

vi.mock('@/db/files', () => ({
	getAllFiles: vi.fn(async () => VAULT_FILES),
	getFile: vi.fn(),
	upsertFile: vi.fn(),
	deleteFile: vi.fn(),
}));

describe('BUG-TT-TAGFILTER-INBOX', () => {
	it('resolves note/<slug> to a vault note whose filename carries .md', async () => {
		const { FileMetadataService } = await import('@/repositories/FileMetadataService');
		const svc = new FileMetadataService();

		expect(await svc.getFilepathForNoteTag('note/don-253')).toBe('30 Tasks/301 Noveo_tasks/DON-253.md');
		expect(await svc.getFilepathForNoteTag('note/DON-253')).toBe('30 Tasks/301 Noveo_tasks/DON-253.md');
	});

	it('resolves proj/<slug> to the matching note file', async () => {
		const { FileMetadataService } = await import('@/repositories/FileMetadataService');
		const svc = new FileMetadataService();

		expect(await svc.getFilepathForNoteTag('proj/work-x')).toBe('10 Projects/Work X.md');
	});

	it('ignores parked notes and non-context tags', async () => {
		const { FileMetadataService } = await import('@/repositories/FileMetadataService');
		const svc = new FileMetadataService();

		expect(await svc.getFilepathForNoteTag('note/parked-note')).toBeUndefined();
		expect(await svc.getFilepathForNoteTag('gtd/next')).toBeUndefined();
		expect(await svc.getFilepathForNoteTag('')).toBeUndefined();
	});

	it('does not match a prefix or a partial filename', async () => {
		const { FileMetadataService } = await import('@/repositories/FileMetadataService');
		const svc = new FileMetadataService();

		expect(await svc.getFilepathForNoteTag('note/don')).toBeUndefined();
		expect(await svc.getFilepathForNoteTag('note/don-2530')).toBeUndefined();
	});
});

describe('BUG-TT-TAGFILTER-INBOX: new-task file precedence', () => {
	it('prefers the context note over the inbox capture file', async () => {
		const { fileForNewTickTickTask } = await import('@/syncScope');

		expect(
			fileForNewTickTickTask('inbox1', 'inbox1', '00 Inbox/abyss-active.md', undefined, '30 Tasks/DON-253.md'),
		).toBe('30 Tasks/DON-253.md');
	});

	it('still uses the capture file for an inbox task with no context tag', async () => {
		const { fileForNewTickTickTask } = await import('@/syncScope');

		expect(
			fileForNewTickTickTask('inbox1', 'inbox1', '00 Inbox/abyss-active.md', undefined, undefined),
		).toBe('00 Inbox/abyss-active.md');
	});

	it('ignores a blank context path', async () => {
		const { fileForNewTickTickTask } = await import('@/syncScope');

		expect(
			fileForNewTickTickTask('inbox1', 'inbox1', '00 Inbox/abyss-active.md', undefined, '   '),
		).toBe('00 Inbox/abyss-active.md');
	});
});
