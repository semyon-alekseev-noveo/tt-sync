/**
 * UX-NOTICE-REATTACH — create vs re-attach owner notice must differ.
 * UX-NOTICE-MODAL-COPY — orphan / cleanup modals use local sync cache wording.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
	formatTaskCreatedNotice,
	formatTaskReattachedNotice,
} from '@/ui/notices/taskLifecycleNotices';
import {
	CLEANUP_CACHE_FILES_MESSAGE,
	CLEANUP_CACHE_FILES_TITLE,
	CLEANUP_SOFT_DELETED_MESSAGE,
	CLEANUP_SOFT_DELETED_TITLE,
	LOCAL_SYNC_CACHE,
	ORPHAN_ADD_LABEL,
	ORPHAN_CANCEL_LABEL,
	ORPHAN_DELETE_LABEL,
	ORPHAN_MODAL_MESSAGE,
} from '@/ui/settings/settingsUxCopy';

describe('UX-NOTICE-REATTACH', () => {
	it('create notice says created; reattach notice does not', () => {
		const created = formatTaskCreatedNotice('Watch talk', 'abc123');
		const reattached = formatTaskReattachedNotice('Watch talk', 'abc123');
		expect(created.toLowerCase()).toContain('created');
		expect(created).toContain('abc123');
		expect(reattached.toLowerCase()).toMatch(/reattach/);
		expect(reattached.toLowerCase()).not.toContain('created');
		expect(reattached).toContain('abc123');
	});

	it('newTasks.ts wires orphan ? reattach : create', () => {
		const src = readFileSync(
			join(__dirname, '../sync/vault-push/taskModification/newTasks.ts'),
			'utf8',
		);
		expect(src).toContain('formatTaskReattachedNotice');
		expect(src).toContain('formatTaskCreatedNotice');
		expect(src).toMatch(/orphan\s*\?\s*formatTaskReattachedNotice/);
		expect(src).not.toMatch(/New task created:/);
	});
});

describe('UX-NOTICE-ORPHAN-CLEAR', () => {
	it('orphan modal explains id mismatch and that paths are Add targets', () => {
		expect(ORPHAN_MODAL_MESSAGE.toLowerCase()).toMatch(/ticktick_id|matching/);
		expect(ORPHAN_MODAL_MESSAGE).toContain(LOCAL_SYNC_CACHE);
		expect(ORPHAN_MODAL_MESSAGE.toLowerCase()).not.toMatch(/\bdatabase\b/);
		expect(ORPHAN_CANCEL_LABEL.toLowerCase()).toContain('leave');
		expect(ORPHAN_ADD_LABEL.toLowerCase()).toMatch(/duplicate/);
		expect(ORPHAN_DELETE_LABEL).toMatch(/TickTick/);
	});

	it('modal source includes paths heading and restore hint', () => {
		const orphan = readFileSync(join(__dirname, '../modals/OrphanTaskModal.ts'), 'utf8');
		expect(orphan).toContain('ORPHAN_MODAL_PATHS_HEADING');
		expect(orphan).toContain('ORPHAN_MODAL_RESTORE_HINT');
		expect(orphan).toContain('setCta()');
		expect(orphan).toMatch(/cancelBtn[\s\S]*setCta/);
	});
});

describe('UX-NOTICE-MODAL-COPY', () => {
	it('orphan modal copy uses cache wording and clear Cancel', () => {
		expect(ORPHAN_MODAL_MESSAGE).toContain(LOCAL_SYNC_CACHE);
		expect(ORPHAN_MODAL_MESSAGE.toLowerCase()).not.toMatch(/\bdatabase\b/);
		expect(ORPHAN_CANCEL_LABEL.toLowerCase()).toContain('leave');
		expect(ORPHAN_ADD_LABEL.toLowerCase()).toContain('vault');
		expect(ORPHAN_DELETE_LABEL).toMatch(/TickTick/);
	});

	it('cleanup modals say local sync cache / soft-deleted, not bare database wipe', () => {
		expect(CLEANUP_CACHE_FILES_TITLE).toContain(LOCAL_SYNC_CACHE);
		expect(CLEANUP_CACHE_FILES_MESSAGE).toContain(LOCAL_SYNC_CACHE);
		expect(CLEANUP_SOFT_DELETED_TITLE.toLowerCase()).toContain('soft-deleted');
		expect(CLEANUP_SOFT_DELETED_MESSAGE).toContain(LOCAL_SYNC_CACHE);
		expect(CLEANUP_SOFT_DELETED_MESSAGE.toLowerCase()).toContain('not live');
	});

	it('OrphanTaskModal and Cleanup* modals import shared copy', () => {
		const orphan = readFileSync(join(__dirname, '../modals/OrphanTaskModal.ts'), 'utf8');
		const cleanupDb = readFileSync(join(__dirname, '../modals/CleanupDatabaseModal.ts'), 'utf8');
		const cleanupDel = readFileSync(join(__dirname, '../modals/CleanupDeletedTasksModal.ts'), 'utf8');
		expect(orphan).toContain('ORPHAN_MODAL_MESSAGE');
		expect(orphan).toContain('ORPHAN_CANCEL_LABEL');
		expect(cleanupDb).toContain('CLEANUP_CACHE_FILES_TITLE');
		expect(cleanupDel).toContain('CLEANUP_SOFT_DELETED_TITLE');
	});
});
