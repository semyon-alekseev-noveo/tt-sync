/**
 * UX-SET Phase 1 (#191) — Settings copy / layout contracts.
 * Failing-test-first for labels/visibility; no sync-semantics asserts.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
	CHECK_DATABASE_ORPHAN_HELP,
	DELETION_GLOSSARY_TERMS,
	MAINT_PRIMARY_CTA_CLASS,
	MAINT_SYNC_PRIMARY_LABEL,
	PULL_FILTER_EMPTY_BADGE,
	PULL_FILTER_TAG_HELP,
	PULL_FILTER_TAG_LABEL,
	PURGE_TRASH_DB_BUTTON,
	PURGE_TRASH_DB_HELP,
	PURGE_TRASH_DB_LABEL,
	RESET_CONTROL_HOSTS,
	RESET_CONTROL_LABEL,
	RESET_DANGER_ZONE_TITLE,
	RESET_VAULT_TT_INTACT_COPY,
	SYNCED_LISTS_HELP,
	SYNCED_LISTS_LABEL,
	syncTagEmptyBadgeVisible,
} from '@/ui/settings/settingsUxCopy';

const SETTINGS_SVELTE_ROOT = join(__dirname, '../ui/settings');

function listSvelteFiles(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) out.push(...listSvelteFiles(p));
		else if (name.endsWith('.svelte')) out.push(p);
	}
	return out;
}

function filesImportingResetControl(): string[] {
	return listSvelteFiles(SETTINGS_SVELTE_ROOT).filter((p) => {
		const src = readFileSync(p, 'utf8');
		return /import\s+ResetTasksControl\s+from/.test(src);
	});
}

describe('UX-SET-SYNCTAG-EMPTY', () => {
	it('label leans toward Pull filter tag', () => {
		expect(PULL_FILTER_TAG_LABEL.toLowerCase()).toContain('pull filter');
	});

	it('empty badge says pull ALL', () => {
		expect(PULL_FILTER_EMPTY_BADGE.toLowerCase()).toContain('pull all');
	});

	it('help says empty pulls all allow-listed tasks', () => {
		expect(PULL_FILTER_TAG_HELP.toLowerCase()).toMatch(/pull all/);
	});

	it('badge visible only when SyncTag is empty', () => {
		expect(syncTagEmptyBadgeVisible('')).toBe(true);
		expect(syncTagEmptyBadgeVisible('   ')).toBe(true);
		expect(syncTagEmptyBadgeVisible(null)).toBe(true);
		expect(syncTagEmptyBadgeVisible('tts-test')).toBe(false);
	});

	it('GtdSection surfaces Pull filter label and empty badge copy', () => {
		const src = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/sections/GtdSection.svelte'), 'utf8');
		expect(src).toContain('PULL_FILTER_TAG_LABEL');
		expect(src).toContain('PULL_FILTER_EMPTY_BADGE');
		expect(src).toContain('syncTagEmptyBadgeVisible');
	});
});

describe('UX-SET-SYNCED-LISTS-HELP', () => {
	it('help is allow-list; empty → nothing; new TT list not synced until ticked', () => {
		expect(SYNCED_LISTS_LABEL.toLowerCase()).toContain('synced lists');
		const h = SYNCED_LISTS_HELP.toLowerCase();
		expect(h).toMatch(/allow-list|allow list/);
		expect(h).toMatch(/nothing (is )?pulled|empty/);
		expect(h).toMatch(/tick/);
	});

	it('GtdSection uses SYNCED_LISTS_HELP', () => {
		const src = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/sections/GtdSection.svelte'), 'utf8');
		expect(src).toContain('SYNCED_LISTS_HELP');
	});
});

describe('UX-SET-MANAGE-DELETED', () => {
	it('Purge soft-deleted cache rows — when/what; no Dexie; ≠ held', () => {
		expect(PURGE_TRASH_DB_LABEL.toLowerCase()).toMatch(/soft-deleted/);
		expect(PURGE_TRASH_DB_BUTTON.toLowerCase()).toMatch(/soft-deleted/);
		const h = PURGE_TRASH_DB_HELP.toLowerCase();
		expect(h).toMatch(/soft-deleted/);
		expect(h).toMatch(/local sync cache/);
		expect(h).not.toMatch(/dexie/);
		expect(h).toMatch(/held|apply once/);
		expect(h).toMatch(/does not delete live ticktick/);
	});

	it('Maintenance uses Purge soft-deleted copy (not Manage Deleted Tasks)', () => {
		const src = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/ManualSyncOperations.svelte'), 'utf8');
		expect(src).toContain('PURGE_TRASH_DB');
		expect(src).not.toMatch(/Manage Deleted Tasks/);
	});
});

describe('UX-SET-RESET-ONE', () => {
	it('Danger zone copy: vault and TickTick intact', () => {
		expect(RESET_DANGER_ZONE_TITLE.toLowerCase()).toContain('danger');
		expect(RESET_CONTROL_LABEL.toLowerCase()).toContain('reset local sync');
		const c = RESET_VAULT_TT_INTACT_COPY.toLowerCase();
		expect(c).toMatch(/vault/);
		expect(c).toMatch(/ticktick/);
		expect(c).toMatch(/intact|stay|not deleted|not changed/);
	});

	it('only Maintenance hosts ResetTasksControl', () => {
		expect([...RESET_CONTROL_HOSTS]).toEqual(['maintenance']);
		const hosts = filesImportingResetControl().map((p) => p.replace(/\\/g, '/'));
		expect(hosts).toHaveLength(1);
		expect(hosts[0]).toMatch(/ManualSyncOperations\.svelte$/);
	});

	it('ResetTasksControl uses vault/TT intact copy', () => {
		const src = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/ResetTasksControl.svelte'), 'utf8');
		expect(src).toContain('RESET_VAULT_TT_INTACT_COPY');
	});
});

describe('UX-SET-MAINT-SYNC-PRIMARY', () => {
	it('primary label is Synchronize', () => {
		expect(MAINT_SYNC_PRIMARY_LABEL).toBe('Synchronize');
		expect(MAINT_PRIMARY_CTA_CLASS).toBe('mod-cta');
	});

	it('Maintenance: Synchronize is sole mod-cta among sync/check/backup/purge', () => {
		const src = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/ManualSyncOperations.svelte'), 'utf8');
		expect(src).toContain('MAINT_SYNC_PRIMARY_LABEL');
		expect(src).toContain('MAINT_PRIMARY_CTA_CLASS');
		// Check / Backup / Purge must not use mod-cta
		expect(src).not.toMatch(/Check Database[\s\S]{0,200}mod-cta/);
		expect(src).not.toMatch(/class="mod-cta"[\s\S]{0,80}Backup/);
		expect(src).not.toMatch(/PURGE_TRASH_DB_BUTTON[\s\S]{0,40}mod-cta|mod-cta[\s\S]{0,80}PURGE_TRASH_DB_BUTTON/);
	});
});

describe('UX-SET-GLOSSARY (Phase 1 surface)', () => {
	it('glossary stays short (≤4) and covers Held/Skip, Confirm/Cancel, Purge, Reset', () => {
		expect(DELETION_GLOSSARY_TERMS.length).toBeLessThanOrEqual(4);
		const terms = DELETION_GLOSSARY_TERMS.map((t) => t.term.toLowerCase()).join(' | ');
		expect(terms).toMatch(/held/);
		expect(terms).toMatch(/skip/);
		expect(terms).toMatch(/confirm|cancel/);
		expect(terms).toMatch(/purge/);
		expect(terms).toMatch(/reset/);
	});

	it('Maintenance and Guard mount DeletionGlossary', () => {
		const maint = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/ManualSyncOperations.svelte'), 'utf8');
		const guard = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/sections/MassDeleteGuardSection.svelte'), 'utf8');
		expect(maint).toContain('DeletionGlossary');
		expect(guard).toContain('DeletionGlossary');
	});

	it('Check Database help says what to do with orphans', () => {
		expect(CHECK_DATABASE_ORPHAN_HELP.toLowerCase()).toMatch(/cancel/);
		expect(CHECK_DATABASE_ORPHAN_HELP.toLowerCase()).toMatch(/delete from ticktick/);
		expect(CHECK_DATABASE_ORPHAN_HELP.toLowerCase()).toMatch(/add to file/);
		const maint = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/ManualSyncOperations.svelte'), 'utf8');
		expect(maint).toContain('CHECK_DATABASE_ORPHAN_HELP');
	});
});
