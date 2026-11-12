import { describe, expect, it } from 'vitest';
import {
	TASKS_FOLDER_HELP_ABYSS,
	TASKS_FOLDER_HELP_CLASSIC,
	tasksFolderHelp,
} from '@/ui/settings/settingsUxVisibility';

/**
 * UX-SET-TASKS-FOLDER-COPY (#202): on the Abyss/GTD path no per-list files are created,
 * so the classic «Folder for list files … Move Existing Files» help is wrong there.
 */
describe('UX-SET-TASKS-FOLDER-COPY (#202)', () => {
	const classic = {
		projectSchemeEnabled: false,
		abyssTasksFormat: false,
		syncScopeFolders: [] as string[],
	};
	const abyss = {
		projectSchemeEnabled: true,
		abyssTasksFormat: true,
		syncScopeFolders: ['00 Inbox/'],
	};

	it('keeps the classic list-file copy on the classic path', () => {
		expect(tasksFolderHelp(classic)).toBe(TASKS_FOLDER_HELP_CLASSIC);
		expect(tasksFolderHelp(classic)).toContain('list files');
	});

	it('switches to the Abyss copy when scheme + Abyss format + scope folders are all on', () => {
		expect(tasksFolderHelp(abyss)).toBe(TASKS_FOLDER_HELP_ABYSS);
		expect(tasksFolderHelp(abyss)).not.toContain('Folder for list files');
		expect(tasksFolderHelp(abyss)).not.toContain('Move Existing Files');
	});

	it('Abyss copy explains push scope and that list mirrors are not created', () => {
		expect(TASKS_FOLDER_HELP_ABYSS).toContain('No per-list files');
		expect(TASKS_FOLDER_HELP_ABYSS).toContain('push scope');
	});

	it('falls back to the classic copy when any Abyss condition is missing', () => {
		expect(tasksFolderHelp({ ...abyss, abyssTasksFormat: false })).toBe(TASKS_FOLDER_HELP_CLASSIC);
		expect(tasksFolderHelp({ ...abyss, syncScopeFolders: [] })).toBe(TASKS_FOLDER_HELP_CLASSIC);
		expect(tasksFolderHelp({ ...abyss, projectSchemeEnabled: false })).toBe(TASKS_FOLDER_HELP_CLASSIC);
	});
});
