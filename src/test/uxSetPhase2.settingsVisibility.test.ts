/**
 * UX-SET Phase 2 (#192) — Settings visibility when Abyss/GTD mode is active.
 * Failing-test-first; no sync-semantics asserts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
	DEFAULTS_FOLDER_MERGED_NOTE,
	EXTRA_FILTERS_HIDDEN_NOTE,
	GTD_STAGE_INACTIVE_BANNER,
	hideDefaultsTasksFolderTwin,
	hideExtraFilters,
	hideHubSingleTasksFile,
	hideKeepTickTickFolders,
	hideOrInactiveGtdStageMapping,
	hideStripTickTickOnReset,
	isAbyssGtdPathActive,
	statusListIsSourceOfTruth,
} from '@/ui/settings/settingsUxVisibility';

const SETTINGS_SVELTE_ROOT = join(__dirname, '../ui/settings');

const abyssOn = {
	projectSchemeEnabled: true,
	abyssTasksFormat: true,
	syncScopeFolders: ['00 Inbox/', '10 Projects/', '30 Tasks/'],
	syncedLists: ['TTS-Inbox', 'TTS-nextAction'],
	statusListMappings: [{ status: '!', list: 'TTS-nextAction' }],
};

const classic = {
	projectSchemeEnabled: false,
	abyssTasksFormat: false,
	syncScopeFolders: [] as string[],
	syncedLists: [] as string[],
	statusListMappings: [] as unknown[],
};

describe('UX-SET-HIDE-DEFAULTS', () => {
	it('Abyss/GTD path uses UX-STUB-1 predicate', () => {
		expect(isAbyssGtdPathActive(abyssOn)).toBe(true);
		expect(isAbyssGtdPathActive({ ...abyssOn, projectSchemeEnabled: false })).toBe(false);
		expect(isAbyssGtdPathActive({ ...abyssOn, abyssTasksFormat: false })).toBe(false);
		expect(isAbyssGtdPathActive({ ...abyssOn, syncScopeFolders: [] })).toBe(false);
		expect(isAbyssGtdPathActive(classic)).toBe(false);
	});

	it('hides Defaults Tasks folder twin when Abyss path active', () => {
		expect(hideDefaultsTasksFolderTwin(abyssOn)).toBe(true);
		expect(hideDefaultsTasksFolderTwin(classic)).toBe(false);
	});

	it('DefaultsSection uses hideDefaultsTasksFolderTwin', () => {
		const src = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/sections/DefaultsSection.svelte'), 'utf8');
		expect(src).toContain('hideDefaultsTasksFolderTwin');
		expect(src).toContain('DEFAULTS_FOLDER_MERGED_NOTE');
	});
});

describe('UX-SET-EXTRA-FILTERS', () => {
	it('hides Extra filters when syncedLists non-empty', () => {
		expect(hideExtraFilters({ syncedLists: ['TTS-Inbox'] })).toBe(true);
		expect(hideExtraFilters({ syncedLists: [] })).toBe(false);
		expect(hideExtraFilters(classic)).toBe(false);
	});

	it('SyncControlSettings / LimitSyncSection honor hideExtraFilters', () => {
		const sync = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/sections/SyncControlSettings.svelte'), 'utf8');
		const limit = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/sections/LimitSyncSection.svelte'), 'utf8');
		expect(sync).toContain('hideExtraFilters');
		expect(limit).toContain('hideExtraFilters');
		expect(EXTRA_FILTERS_HIDDEN_NOTE.toLowerCase()).toMatch(/extra filters|synced lists/);
	});
});

describe('UX-SET-STATUS-VS-STAGE', () => {
	it('status→list non-empty is SoT; stage→list inactive', () => {
		expect(statusListIsSourceOfTruth(abyssOn)).toBe(true);
		expect(hideOrInactiveGtdStageMapping(abyssOn)).toBe(true);
		expect(statusListIsSourceOfTruth(classic)).toBe(false);
		expect(hideOrInactiveGtdStageMapping(classic)).toBe(false);
	});

	it('banner copy names status→list as SoT', () => {
		const b = GTD_STAGE_INACTIVE_BANNER.toLowerCase();
		expect(b).toMatch(/status/);
		expect(b).toMatch(/inactive|source of truth/);
		expect(b).toMatch(/stage|gtd/);
	});

	it('GtdSection uses hideOrInactiveGtdStageMapping / banner', () => {
		const src = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/sections/GtdSection.svelte'), 'utf8');
		expect(src).toContain('hideOrInactiveGtdStageMapping');
		expect(src).toContain('GTD_STAGE_INACTIVE_BANNER');
	});
});

describe('Phase 2 #192 — hub / strip / Keep TickTick folders', () => {
	it('hides hub single-tasks file on Abyss path', () => {
		expect(hideHubSingleTasksFile(abyssOn)).toBe(true);
		expect(hideHubSingleTasksFile(classic)).toBe(false);
	});

	it('always hides strip-ticktick-on-reset (wipe-only Reset)', () => {
		expect(hideStripTickTickOnReset()).toBe(true);
	});

	it('hides Keep TickTick folders when project scheme on', () => {
		expect(hideKeepTickTickFolders({ projectSchemeEnabled: true })).toBe(true);
		expect(hideKeepTickTickFolders({ projectSchemeEnabled: false })).toBe(false);
	});

	it('GtdSection / TasksSettings wire hub, strip, keep helpers', () => {
		const gtd = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/sections/GtdSection.svelte'), 'utf8');
		const tasks = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/TasksSettings.svelte'), 'utf8');
		expect(gtd).toContain('hideHubSingleTasksFile');
		expect(tasks).toContain('hideStripTickTickOnReset');
		expect(tasks).toContain('hideKeepTickTickFolders');
	});
});
