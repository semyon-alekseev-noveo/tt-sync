/**
 * BUG-SYNC-SKIP-COMPLETED-IMPORT / UX-ORPHAN-SKIP-DONE
 */
import { describe, expect, it } from 'vitest';
import { isOpenTaskEligibleForVaultImport } from '@/sync/vaultImportEligibility';
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
