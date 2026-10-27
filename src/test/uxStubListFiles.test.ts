/**
 * UX-STUB-1 / BUG-LIST-STUB-RECREATE — Abyss/GTD skips per-list mirror stubs;
 * parked Dexie paths must not recreate empty banners.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const settings = vi.hoisted(() => ({
	newTasksFile: '',
	projectSchemeEnabled: false,
	abyssTasksFormat: false,
	syncScopeFolders: [] as string[],
}));

vi.mock('@/settings', () => ({
	getSettings: () => settings,
	getDefaultFolder: () => '30 Tasks/TickTick',
	updateSettings: vi.fn(),
}));

import { isParkedVaultPath, listStubFilesEnabled } from '@/syncScope';

describe('UX-STUB-1 listStubFilesEnabled', () => {
	beforeEach(() => {
		settings.newTasksFile = '';
		settings.projectSchemeEnabled = false;
		settings.abyssTasksFormat = false;
		settings.syncScopeFolders = [];
	});

	it('stays on for classic allow-listed list files', () => {
		expect(listStubFilesEnabled()).toBe(true);
	});

	it('turns off when newTasksFile hub is set', () => {
		settings.newTasksFile = '00 Inbox/TickTick-capture.md';
		expect(listStubFilesEnabled()).toBe(false);
	});

	it('turns off for Abyss/GTD predicate (scheme + abyssTasksFormat + syncScopeFolders)', () => {
		settings.projectSchemeEnabled = true;
		settings.abyssTasksFormat = true;
		settings.syncScopeFolders = ['00 Inbox/', '10 Projects/', '30 Tasks/'];
		expect(listStubFilesEnabled()).toBe(false);
	});

	it('stays on when only projectSchemeEnabled is set (classic stubs still apply)', () => {
		settings.projectSchemeEnabled = true;
		expect(listStubFilesEnabled()).toBe(true);
	});

	it('stays on when abyssTasksFormat lacks configured syncScopeFolders', () => {
		settings.projectSchemeEnabled = true;
		settings.abyssTasksFormat = true;
		settings.syncScopeFolders = [];
		expect(listStubFilesEnabled()).toBe(true);
	});
});

describe('BUG-LIST-STUB-RECREATE isParkedVaultPath', () => {
	it('matches zz-parked-* top segment', () => {
		expect(isParkedVaultPath('zz-parked-17/30 Tasks/TickTick/TTS-Inbox.md')).toBe(true);
		expect(isParkedVaultPath('/zz-parked/foo.md')).toBe(true);
		expect(isParkedVaultPath('zz-parked.md')).toBe(true);
	});

	it('does not match live TickTickTasksFilePath stubs', () => {
		expect(isParkedVaultPath('30 Tasks/TickTick/TTS-Inbox.md')).toBe(false);
		expect(isParkedVaultPath('10 Projects/TTS-PILOT.md')).toBe(false);
		expect(isParkedVaultPath('')).toBe(false);
		expect(isParkedVaultPath(undefined)).toBe(false);
	});
});
