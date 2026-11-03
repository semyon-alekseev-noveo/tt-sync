/**
 * BUG-SYNC-SKIP-COMPLETED-IMPORT / UX-ORPHAN-SKIP-DONE
 */
import { describe, expect, it } from 'vitest';
import {
	ABYSS_CAPTURE_FALLBACK,
	isOpenTaskEligibleForVaultImport,
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
	});
});
