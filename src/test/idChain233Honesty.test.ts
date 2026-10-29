/**
 * ID-CHAIN #233 — TEXT-NO-MARKER policy + omit-from-backup honesty (E14/E15/C9).
 */
import { describe, expect, it } from 'vitest';
import {
	TEXT_NO_MARKER_POLICY,
	TT_GONE_DETACH_NOTICE,
	formatTtGoneDetachNotice,
	formatPlannedDeletionLabel,
	canOfferRematch,
	isRestoreShapedHold,
	planVaultTaskDeletions,
	planRemoteTaskDeletions,
	REBIND_BUTTON_LABEL,
} from '@/sync/massDeleteGuard';
import { rebindFileContent } from '@/sync/rebindVault';

describe('ID-TEXT-NO-MARKER', () => {
	it('policy: bind unmarked only via Rebind — no Apply / no silent auto-bind copy', () => {
		expect(TEXT_NO_MARKER_POLICY.toLowerCase()).toMatch(/not auto-bound/);
		expect(TEXT_NO_MARKER_POLICY.toLowerCase()).toMatch(/rebind/);
		expect(TEXT_NO_MARKER_POLICY.toLowerCase()).not.toMatch(/apply once to bind/);
		expect(REBIND_BUTTON_LABEL.toLowerCase()).toContain('no tt deletes');
	});

	it('unmarked matching Dexie → held Rebind path, not allow-by-default', () => {
		const planned = planVaultTaskDeletions({
			tasks: [{
				taskId: 'live01live01live01live01li',
				title: 'Unmarked title',
				file: '30 Tasks/n.md',
				inPushScope: true,
			}],
			presentIds: new Set(),
			untrustedFiles: new Set(),
			indexIncomplete: false,
		});
		expect(planned).toHaveLength(1);
		expect(canOfferRematch(planned)).toBe(true);
		expect(isRestoreShapedHold(planned)).toBe(true);
		const id = 'live01live01live01live01li';
		const r = rebindFileContent(
			'# n\n- [ ] Unmarked title\n',
			[{ id, title: 'Unmarked title', projectId: 'p', content: '', items: [] }] as never,
			new Set([id]),
		);
		expect(r.rebound).toBe(1);
		expect(r.needInsert).toHaveLength(0);
	});
});

describe('ID-MISSING-FROM-TT-BACKUP / ID-TT-RESTORE-OMITTED', () => {
	it('honest detach label and notice — never invent TT wording', () => {
		const label = formatPlannedDeletionLabel({
			id: 'gone1gone1gone1gone1gone1go',
			kind: 'task',
			direction: 'ticktick-to-vault',
			action: 'detach',
			title: 'Omitted',
			file: 'n.md',
			taskId: 'gone1gone1gone1gone1gone1go',
		});
		expect(label.toLowerCase()).toContain('not in backup');
		expect(label.toLowerCase()).toContain('detach');
		expect(formatTtGoneDetachNotice(3)).toContain('3');
		expect(formatTtGoneDetachNotice(3)).toContain(TT_GONE_DETACH_NOTICE);
		expect(TT_GONE_DETACH_NOTICE.toLowerCase()).toMatch(/not recreated from the vault/);
	});

	it('remote omit plans detach (keep text path), not vault invent creates', () => {
		const planned = planRemoteTaskDeletions(
			['omit01omit01omit01omit01om'],
			new Map([['omit01omit01omit01omit01om', { title: 'Omitted', file: 'n.md' }]]),
			'detach',
		);
		expect(planned).toEqual([
			expect.objectContaining({
				direction: 'ticktick-to-vault',
				action: 'detach',
				taskId: 'omit01omit01omit01omit01om',
			}),
		]);
		// Rebind candidates are vault→TT only — omit-from-backup does not become invent-via-Rematch.
		expect(canOfferRematch(planned)).toBe(false);
	});
});
