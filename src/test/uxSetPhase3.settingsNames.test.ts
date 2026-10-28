/**
 * UX-SET Phase 3 (#193) — Settings names, safer defaults, warnings.
 * Failing-test-first; no sync-semantics asserts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '@/settings';
import {
	BKUP_FOLDER_HELP,
	BKUP_ROOT_WARN,
	DEFAULT_BKUP_FOLDER,
	FULL_VAULT_CONFIRM_MESSAGE,
	FULL_VAULT_SYNC_HELP,
	LEAN_PROJECT_TEMPLATE_WARN,
	NOTEBOOK_INBOX_WARN,
	QUIET_READING_DEFAULTS_NOTE,
	STATUS_LIST_MAPPING_LABEL,
	STATUS_LIST_WINS_BANNER,
	STATUS_TAG_MAPPING_LABEL,
	SYNC_TASK_DESCRIPTIONS_HELP,
	SYNC_TASK_DESCRIPTIONS_LABEL,
	bkupFolderIsVaultRoot,
	notebookFolderLooksLikeInboxOrCapture,
	projectTemplateLooksHeavyMoc,
} from '@/ui/settings/settingsUxNames';

const SETTINGS_SVELTE_ROOT = join(__dirname, '../ui/settings');
const SETTINGS_TS = join(__dirname, '../settings.ts');

describe('UX-SET-SYNC-NOTES', () => {
	it('label is Sync task descriptions (not Sync Notes)', () => {
		expect(SYNC_TASK_DESCRIPTIONS_LABEL.toLowerCase()).toContain('task description');
		expect(SYNC_TASK_DESCRIPTIONS_LABEL.toLowerCase()).not.toBe('sync notes');
	});

	it('help distinguishes Notebook / NOTE-BODY', () => {
		const h = SYNC_TASK_DESCRIPTIONS_HELP.toLowerCase();
		expect(h).toMatch(/description|content|note-body/);
		expect(h).toMatch(/notebook/);
	});

	it('NotesSettings uses Sync task descriptions copy', () => {
		const src = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/NotesSettings.svelte'), 'utf8');
		expect(src).toContain('SYNC_TASK_DESCRIPTIONS_LABEL');
		expect(src).not.toMatch(/>\s*Sync Notes\s*</);
	});
});

describe('UX-SET-NOTEBOOK-WARN', () => {
	it('detects Inbox / capture folder paths', () => {
		expect(notebookFolderLooksLikeInboxOrCapture('00 Inbox')).toBe(true);
		expect(notebookFolderLooksLikeInboxOrCapture('00 Inbox/')).toBe(true);
		expect(notebookFolderLooksLikeInboxOrCapture('Inbox')).toBe(true);
		expect(notebookFolderLooksLikeInboxOrCapture('capture')).toBe(true);
		expect(notebookFolderLooksLikeInboxOrCapture('TickTick Notebook')).toBe(false);
		expect(notebookFolderLooksLikeInboxOrCapture('30 Notes/Notebook')).toBe(false);
	});

	it('warn copy names Inbox/capture', () => {
		const w = NOTEBOOK_INBOX_WARN.toLowerCase();
		expect(w).toMatch(/inbox|capture/);
		expect(w).toMatch(/notebook/);
	});

	it('NotesSettings surfaces notebook warn helper', () => {
		const src = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/NotesSettings.svelte'), 'utf8');
		expect(src).toContain('notebookFolderLooksLikeInboxOrCapture');
		expect(src).toContain('NOTEBOOK_INBOX_WARN');
	});
});

describe('UX-SET-BKUP-DEFAULT', () => {
	it('new-install default is a subfolder, not vault root', () => {
		expect(DEFAULT_BKUP_FOLDER).not.toBe('/');
		expect(DEFAULT_BKUP_FOLDER.length).toBeGreaterThan(1);
		expect(DEFAULT_SETTINGS.bkupFolder).toBe(DEFAULT_BKUP_FOLDER);
		expect(bkupFolderIsVaultRoot('/')).toBe(true);
		expect(bkupFolderIsVaultRoot(DEFAULT_BKUP_FOLDER)).toBe(false);
	});

	it('root warn mentions vault root and safer path', () => {
		const w = BKUP_ROOT_WARN.toLowerCase();
		expect(w).toMatch(/root|\/|vault/);
		expect(w).toMatch(/backup/);
		expect(BKUP_FOLDER_HELP.toLowerCase()).toMatch(/tickticksync\/backups|subfolder|default/);
	});

	it('Maintenance surfaces bkup root warn', () => {
		const src = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/ManualSyncOperations.svelte'), 'utf8');
		expect(src).toContain('bkupFolderIsVaultRoot');
		expect(src).toContain('BKUP_ROOT_WARN');
	});
});

describe('UX-SET-LEAN-WARN', () => {
	it('detects heavy MOC template paths', () => {
		expect(projectTemplateLooksHeavyMoc('60 templates/MOC.md')).toBe(true);
		expect(projectTemplateLooksHeavyMoc('templates/moc.md')).toBe(true);
		expect(projectTemplateLooksHeavyMoc('')).toBe(false);
		expect(projectTemplateLooksHeavyMoc('60 templates/lean-project.md')).toBe(false);
	});

	it('warn mentions lean / 1/2/3 soak P0', () => {
		const w = LEAN_PROJECT_TEMPLATE_WARN.toLowerCase();
		expect(w).toMatch(/lean|moc/);
		expect(w).toMatch(/1\/2\/3|placeholder/);
	});

	it('GtdSection surfaces lean warn', () => {
		const src = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/sections/GtdSection.svelte'), 'utf8');
		expect(src).toContain('projectTemplateLooksHeavyMoc');
		expect(src).toContain('LEAN_PROJECT_TEMPLATE_WARN');
	});
});

describe('Phase 3 #193 — Status headers / Full vault / quiet reading', () => {
	it('Status → tag and Status → list labels are explicit; list-wins banner present', () => {
		expect(STATUS_TAG_MAPPING_LABEL.toLowerCase()).toMatch(/status.*tag/);
		expect(STATUS_LIST_MAPPING_LABEL.toLowerCase()).toMatch(/status.*list/);
		expect(STATUS_LIST_WINS_BANNER.toLowerCase()).toMatch(/list wins|source of truth/);
		const notes = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/NotesSettings.svelte'), 'utf8');
		expect(notes).toContain('STATUS_TAG_MAPPING_LABEL');
		expect(notes).toContain('STATUS_LIST_MAPPING_LABEL');
		expect(notes).toContain('STATUS_LIST_WINS_BANNER');
	});

	it('Full vault help is Abyss-aware; confirm kept', () => {
		const h = FULL_VAULT_SYNC_HELP.toLowerCase();
		expect(h).toMatch(/abyss|gtd|synced lists/);
		expect(FULL_VAULT_CONFIRM_MESSAGE.toLowerCase()).toMatch(/abyss|gtd|synced lists/);
		const full = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/sections/FullVaultSyncSection.svelte'), 'utf8');
		expect(full).toContain('FULL_VAULT_SYNC_HELP');
		const modal = readFileSync(join(__dirname, '../modals/ConfirmFullSyncModal.ts'), 'utf8');
		expect(modal).toContain('FULL_VAULT_CONFIRM');
	});

	it('quiet reading defaults hide id and sync tag in Reading mode', () => {
		expect(DEFAULT_SETTINGS.taskDisplay.reading.id).toBe(false);
		expect(DEFAULT_SETTINGS.taskDisplay.reading.tag).toBe(false);
		expect(QUIET_READING_DEFAULTS_NOTE.toLowerCase()).toMatch(/reading/);
		const tasks = readFileSync(join(SETTINGS_SVELTE_ROOT, 'svelte/TasksSettings.svelte'), 'utf8');
		expect(tasks).toContain('QUIET_READING_DEFAULTS_NOTE');
		const settingsSrc = readFileSync(SETTINGS_TS, 'utf8');
		expect(settingsSrc).toMatch(/reading:\s*\{[^}]*tag:\s*false/s);
	});
});
