/**
 * AF-FMT-OFF-WARN (R1) + UX-SET-FMT-OFF-COPY (R2) — decision sheet
 * docs/pilot/FMT-OFF-R1-R3-DECISIONS.md, accepted 2026-11-22.
 *
 * R1 predicate unit + wiring source asserts + session-once behavior.
 * R2 copy source asserts on NotesSettings.svelte.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	confirmFmtOffSyncBeforeRun,
	fmtOffWarnPredicate,
	resetFmtOffWarnSessionForTest,
	FMT_OFF_WARN_TITLE,
	FMT_OFF_WARN_SYNC_ANYWAY,
	FMT_OFF_WARN_CANCEL,
} from '@/sync/fmtOffWarn';

const abyssConfig = {
	projectSchemeEnabled: true,
	statusListMappings: [{ char: '!', list: 'nextAction', listId: 'x' }],
	syncScopeFolders: ['30 Tasks/'],
};

describe('AF-FMT-OFF-WARN fmtOffWarnPredicate', () => {
	it('fires while flag OFF + Abyss config present', () => {
		expect(fmtOffWarnPredicate({ ...abyssConfig, abyssTasksFormat: false })).toBe(true);
	});
	it('silent when flag ON', () => {
		expect(fmtOffWarnPredicate({ ...abyssConfig, abyssTasksFormat: true })).toBe(false);
	});
	it('silent without status→list map', () => {
		expect(
			fmtOffWarnPredicate({
				projectSchemeEnabled: true,
				statusListMappings: [],
				syncScopeFolders: ['30 Tasks/'],
				abyssTasksFormat: false,
			}),
		).toBe(false);
	});
	it('silent without scheme', () => {
		expect(
			fmtOffWarnPredicate({
				...abyssConfig,
				projectSchemeEnabled: false,
				abyssTasksFormat: false,
			}),
		).toBe(false);
	});
	it('silent without push scope folders (classic whole-vault path is not a surprise)', () => {
		expect(
			fmtOffWarnPredicate({
				projectSchemeEnabled: true,
				statusListMappings: [{ char: '!', list: 'n', listId: 'x' }],
				syncScopeFolders: [],
				abyssTasksFormat: false,
			}),
		).toBe(false);
	});
});

describe('AF-FMT-OFF-WARN confirmFmtOffSyncBeforeRun', () => {
	beforeEach(() => resetFmtOffWarnSessionForTest());

	it('returns true without asking when predicate is false (ask not called)', async () => {
		let asked = 0;
		const ok = await confirmFmtOffSyncBeforeRun({} as never, {
			predicate: () => false,
			ask: async () => {
				asked++;
				return true;
			},
		});
		expect(ok).toBe(true);
		expect(asked).toBe(0);
	});

	it('Cancel blocks the run', async () => {
		let asked = 0;
		const ok = await confirmFmtOffSyncBeforeRun({} as never, {
			predicate: () => true,
			ask: async () => {
				asked++;
				return false;
			},
		});
		expect(ok).toBe(false);
		expect(asked).toBe(1);
		// a Cancel is not remembered — the next run asks again
		const ok2 = await confirmFmtOffSyncBeforeRun({} as never, {
			predicate: () => true,
			ask: async () => {
				asked++;
				return false;
			},
		});
		expect(ok2).toBe(false);
		expect(asked).toBe(2);
	});

	it('Accept is remembered per session — second run does not ask', async () => {
		let asked = 0;
		const ask = async () => {
			asked++;
			return true;
		};
		expect(await confirmFmtOffSyncBeforeRun({} as never, { predicate: () => true, ask })).toBe(true);
		expect(asked).toBe(1);
		expect(await confirmFmtOffSyncBeforeRun({} as never, { predicate: () => true, ask })).toBe(true);
		expect(asked).toBe(1);
	});
});

describe('AF-FMT-OFF-WARN wiring (source asserts, precedent uxSyncConfirmRebind)', () => {
	const read = (rel: string) => readFileSync(join(__dirname, rel), 'utf8');

	it('modal strings exist', () => {
		expect(FMT_OFF_WARN_TITLE).toMatch(/Abyss format is OFF/i);
		expect(FMT_OFF_WARN_SYNC_ANYWAY).toBe('Sync anyway');
		expect(FMT_OFF_WARN_CANCEL).toBe('Cancel');
	});

	it('palette/ribbon path gates in synchronizeNow', () => {
		const main = read('../main.ts');
		const fn = main.match(/private async synchronizeNow\(\)[\s\S]*?\n\t\}/)?.[0] ?? '';
		expect(fn).toContain('confirmFmtOffSyncBeforeRun');
	});

	it('Maintenance button path gates in handleManualSync', () => {
		const svelte = read('../ui/settings/svelte/ManualSyncOperations.svelte');
		const fn = svelte.match(/async function handleManualSync\(\)[\s\S]*?\n\t\}/)?.[0] ?? '';
		expect(fn).toContain('confirmFmtOffSyncBeforeRun');
	});

	it('scheduled/reactive paths are NOT gated', () => {
		const main = read('../main.ts');
		// scheduledSynchronization itself must not contain the gate — only the manual entry points.
		const sched = main.match(/async scheduledSynchronization[\s\S]*?\n\t\}/)?.[0] ?? '';
		expect(sched).not.toContain('confirmFmtOffSyncBeforeRun');
	});
});

describe('UX-SET-FMT-OFF-COPY toggle rename + effects summary (R2)', () => {
	const svelte = readFileSync(join(__dirname, '../ui/settings/svelte/NotesSettings.svelte'), 'utf8');

	it('label states the off-mode danger', () => {
		expect(svelte).toContain(
			'Abyss Tasks format — turning this off changes how lists and symbols sync',
		);
	});

	it('effects line covers the four lossy families', () => {
		expect(svelte).toMatch(/symbols follow the status → list map/i);
		expect(svelte).toMatch(/bodies\s+under checkboxes may detach/i);
		expect(svelte).toMatch(/tags\s+rewrite in classic style/i);
		expect(svelte).toMatch(/list stubs\s+can reappear/i);
	});
});
