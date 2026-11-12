/**
 * BUG-SYNC-SKIP-COMPLETED-IMPORT / UX-ORPHAN-SKIP-DONE / BUG-ORPHAN-STALE-REMATCH
 */
import { describe, expect, it } from 'vitest';
import {
	ABYSS_CAPTURE_FALLBACK,
	fileHasSameTitleOtherId,
	isOpenTaskEligibleForVaultImport,
	contextTagSlug,
	normalizeVaultImportTitle,
	resolveOrphanAddFilepath,
} from '@/sync/vaultImportEligibility';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('BUG-SYNC-SKIP-COMPLETED-IMPORT', () => {
	it('allows open tasks; rejects completed, abandoned, deleted, NOTE, recurrence instances', () => {
		expect(isOpenTaskEligibleForVaultImport({ status: 0 })).toBe(true);
		expect(isOpenTaskEligibleForVaultImport({ status: 2 })).toBe(false);
		expect(isOpenTaskEligibleForVaultImport({ status: -1 })).toBe(false);
		expect(isOpenTaskEligibleForVaultImport({ status: 0, deleted: 1 })).toBe(false);
		expect(isOpenTaskEligibleForVaultImport({ status: 0, kind: 'NOTE' })).toBe(false);
		expect(isOpenTaskEligibleForVaultImport({ status: 0, repeatTaskId: 'series-id' })).toBe(false);
	});

	it('orphan scan and syncModule filter with the helper', () => {
		const checkDb = readFileSync(join(__dirname, '../services/checkDatabase.ts'), 'utf8');
		const sync = readFileSync(join(__dirname, '../services/syncModule.ts'), 'utf8');
		expect(checkDb).toContain('isOpenTaskEligibleForVaultImport');
		expect(sync).toContain('isOpenTaskEligibleForVaultImport');
		expect(sync).toMatch(/newTickTickTasks\s*=\s*newTickTickTasks\.filter/);
	});
});

describe('UX-ORPHAN-SYNCED-LISTS', () => {
	it('checkDatabase TT-scan respects syncedLists allow-list', () => {
		const checkDb = readFileSync(join(__dirname, '../services/checkDatabase.ts'), 'utf8');
		expect(checkDb).toContain('resolveSyncedListIds');
		expect(checkDb).toContain('allowedListIds.has(ttTask.projectId)');
		expect(checkDb).toMatch(/syncedLists empty/);
	});
});

describe('BUG-ORPHAN-ADD-STICKY', () => {
	it('resolveOrphanAddFilepath falls back to abyss-active when no map', async () => {
		const path = await resolveOrphanAddFilepath({ projectId: 'x' });
		expect(path).toBe(ABYSS_CAPTURE_FALLBACK);
	});

	it('prefer explicit filepath then parent note then mapped', async () => {
		expect(await resolveOrphanAddFilepath({ filepath: 'a.md' })).toBe('a.md');
		expect(await resolveOrphanAddFilepath({ parentNote: '10 Projects/P.md' })).toBe('10 Projects/P.md');
		expect(await resolveOrphanAddFilepath({ projectMappedFile: 'hub.md' })).toBe('hub.md');
	});

	it('checkDatabase seeds Dexie ids and uses resolveOrphanAddFilepath on Add', () => {
		const checkDb = readFileSync(join(__dirname, '../services/checkDatabase.ts'), 'utf8');
		expect(checkDb).toContain('resolveOrphanAddFilepath');
		expect(checkDb).toContain('db.tasks.toArray');
		expect(checkDb).toContain('BUG-ORPHAN-ADD-STICKY');
		expect(checkDb).toContain('newTasksFile: getSettings().newTasksFile');
	});

	it('BUG-ORPHAN-NO-SETTINGS-CYCLE: eligibility module does not import @/settings', () => {
		const src = readFileSync(join(__dirname, '../sync/vaultImportEligibility.ts'), 'utf8');
		expect(src).not.toMatch(/from ['"]@\/settings['"]/);
	});
});

describe('BUG-ORPHAN-STALE-REMATCH', () => {
	it('fileHasSameTitleOtherId detects rematched title under a new id', () => {
		expect(normalizeVaultImportTitle('  Подумать над механикой  ')).toBe('подумать над механикой');
		expect(fileHasSameTitleOtherId(
			[{ id: 'new-id', title: 'Подумать над механикой' }],
			'old-id',
			'Подумать над механикой',
		)).toBe(true);
		expect(fileHasSameTitleOtherId(
			[{ id: 'old-id', title: 'Подумать над механикой' }],
			'old-id',
			'Подумать над механикой',
		)).toBe(false);
		expect(fileHasSameTitleOtherId(
			[{ id: 'other', title: 'Different' }],
			'old-id',
			'Подумать над механикой',
		)).toBe(false);
	});

	it('checkDatabase prunes stale rematch on metadata path and TT-scan', () => {
		const checkDb = readFileSync(join(__dirname, '../services/checkDatabase.ts'), 'utf8');
		expect(checkDb).toContain('BUG-ORPHAN-STALE-REMATCH');
		expect(checkDb).toContain('fileHasSameTitleOtherId');
		expect(checkDb).toContain('vaultLinkedTitles');
		expect(checkDb).toContain('STALE-REMATCH prune');
	});

	it('metadata orphan path applies isOpenTaskEligibleForVaultImport', () => {
		const checkDb = readFileSync(join(__dirname, '../services/checkDatabase.ts'), 'utf8');
		// eligibility must run before tasksToResolve.push on the getTaskById path
		const orphanBlock = checkDb.slice(
			checkDb.indexOf('getTaskById(taskId)'),
			checkDb.indexOf('tasksToResolve.push', checkDb.indexOf('getTaskById(taskId)')),
		);
		expect(orphanBlock).toContain('isOpenTaskEligibleForVaultImport');
	});
});

describe('BUG-TT-TAGFILTER-INBOX', () => {
	it('contextTagSlug maps note/<slug> and proj/<slug> context tags to a slug', () => {
		expect(contextTagSlug('note/don-253')).toBe('don-253');
		expect(contextTagSlug('note/Don-253')).toBe('don-253');
		expect(contextTagSlug('proj/work-x')).toBe('work-x');
		expect(contextTagSlug('gtd/next')).toBeNull();
		expect(contextTagSlug(null)).toBeNull();
	});

	it('resolveOrphanAddFilepath prefers the context-tagged note file over the Inbox fallback', async () => {
		expect(await resolveOrphanAddFilepath({ contextNoteFile: '30 Tasks/don-253.md', projectId: 'inbox130382745' })).toBe('30 Tasks/don-253.md');
	});

	it('resolveOrphanAddFilepath keeps explicit filepath / parent note ahead of context', async () => {
		expect(await resolveOrphanAddFilepath({ filepath: 'explicit.md', contextNoteFile: '30 Tasks/don-253.md' })).toBe('explicit.md');
		expect(await resolveOrphanAddFilepath({ parentNote: '10 Projects/P.md', contextNoteFile: '30 Tasks/don-253.md' })).toBe('10 Projects/P.md');
	});
});
