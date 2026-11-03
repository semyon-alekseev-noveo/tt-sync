/**
 * UX-SYNC-ONE-FLOW — Option A: Synchronize is day-to-day discrepancy path;
 * Check sync cache is rare diagnostic.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
	guardNotice,
	SYNC_DISCREPANCY_APPLY_LABEL,
	SYNC_DISCREPANCY_MODAL_LEAD,
	SYNC_DISCREPANCY_MODAL_TITLE,
	SYNC_DISCREPANCY_NOTIFY_HINT,
	SYNC_DISCREPANCY_REPORT_LABEL,
	SYNC_DISCREPANCY_SKIP_LABEL,
} from '@/sync/massDeleteGuard';
import {
	CHECK_DATABASE_HELP,
	MAINT_SYNC_PRIMARY_HELP,
} from '@/ui/settings/settingsUxCopy';

describe('UX-SYNC-ONE-FLOW', () => {
	it('Synchronize help is day-to-day; Check help is rare diagnostic', () => {
		const sync = MAINT_SYNC_PRIMARY_HELP.toLowerCase();
		expect(sync).toMatch(/day-to-day|don.?t delete|rebind/);
		expect(sync).toMatch(/check sync cache/);
		const check = CHECK_DATABASE_HELP.toLowerCase();
		expect(check).toMatch(/rare/);
		expect(check).toMatch(/not a second synchronize|not a second sync/);
		expect(check).toMatch(/synchronize/);
	});

	it('discrepancy modal copy is clear and wired into MassDeleteGuardModal', () => {
		expect(SYNC_DISCREPANCY_MODAL_TITLE.toLowerCase()).toContain('discrepan');
		expect(SYNC_DISCREPANCY_MODAL_LEAD.toLowerCase()).toMatch(/mismatch|destructive|residual/);
		expect(SYNC_DISCREPANCY_SKIP_LABEL.toLowerCase()).toMatch(/don.?t delete/);
		expect(SYNC_DISCREPANCY_APPLY_LABEL.toLowerCase()).toContain('apply once');
		expect(SYNC_DISCREPANCY_REPORT_LABEL.toLowerCase()).toMatch(/detail/);
		const modal = readFileSync(join(__dirname, '../modals/MassDeleteGuardModal.ts'), 'utf8');
		expect(modal).toContain('SYNC_DISCREPANCY_MODAL_TITLE');
		expect(modal).toContain('SYNC_DISCREPANCY_SKIP_LABEL');
		expect(modal).toContain('SYNC_DISCREPANCY_APPLY_LABEL');
		expect(modal).toMatch(/UX-SYNC-ONE-FLOW|ARCH-SYNC #259/);
	});

	it('Confirm under-threshold also wires Don’t delete / Rebind / Apply (UX-SYNC-CONFIRM-REBIND)', () => {
		const confirm = readFileSync(join(__dirname, '../modals/TaskDeletionModal.ts'), 'utf8');
		expect(confirm).toContain('SYNC_DISCREPANCY_MODAL_TITLE');
		expect(confirm).toContain('REBIND_BUTTON_LABEL');
		expect(confirm).toContain('confirmOffersRematch');
		expect(confirm).toContain('UX-SYNC-CONFIRM-REBIND');
	});

	it('notify-only toast points back to Synchronize choices', () => {
		const notice = guardNotice(
			{ block: true, reason: 'threshold', taskDeletions: 40, commentDeletions: 0, percent: 50, trackedTasks: 80 },
			'notify-only',
		);
		expect(notice).toContain(SYNC_DISCREPANCY_NOTIFY_HINT);
		expect(notice.toLowerCase()).toMatch(/synchronize/);
	});
});
