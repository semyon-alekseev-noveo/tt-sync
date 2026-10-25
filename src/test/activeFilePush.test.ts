import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	createActiveFilePushScheduler,
	planActiveFilePush,
	shouldNotifyPushOnVaultModify,
	type ActiveFilePushContext,
} from '@/services/activeFilePush';

const ready: ActiveFilePushContext = {
	hasToken: true,
	syncRunning: false,
	inScope: true,
	isMarkdown: true,
	caretLine: 2,
	caretIsTask: true,
	caretTitle: 'call home',
	caretRaw: '- [ ] call home %%[ticktick_id:: abcdefabcdefabcdefabcdef]%%',
};

describe('RISK-OPEN-FILE-EDIT', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('plans a push and skips only an unfinished caret line', () => {
		expect(planActiveFilePush(ready)).toEqual({ push: true, skipLines: [], retryAfterSync: false });
		expect(planActiveFilePush({
			...ready,
			caretLine: 4,
			caretTitle: '%%',
			caretRaw: '- [ ] %%',
		})).toEqual({ push: true, skipLines: [4], retryAfterSync: false });
	});

	it('does not push while sync is running or the file is out of scope', () => {
		expect(planActiveFilePush({ ...ready, syncRunning: true }).push).toBe(false);
		expect(planActiveFilePush({ ...ready, inScope: false }).push).toBe(false);
		expect(planActiveFilePush({ ...ready, hasToken: false }).push).toBe(false);
	});

	it('TP-ACTIVE-PUSH-DURING-SYNC reschedules a push that comes due while sync is running', () => {
		const during = planActiveFilePush({ ...ready, syncRunning: true }) as { push: boolean; retryAfterSync?: boolean };
		expect(during.push).toBe(false);
		expect(during.retryAfterSync).toBe(true);
		expect((planActiveFilePush(ready) as { retryAfterSync?: boolean }).retryAfterSync).toBe(false);
	});

	it('debounces to a single push after the quiet period', () => {
		vi.useFakeTimers();
		const push = vi.fn();
		const scheduler = createActiveFilePushScheduler({ debounceMs: 5000, push });
		scheduler.notify('notes/a.md');
		scheduler.notify('notes/a.md');
		vi.advanceTimersByTime(4999);
		expect(push).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(push).toHaveBeenCalledTimes(1);
		expect(push).toHaveBeenCalledWith('notes/a.md');
		scheduler.dispose();
	});

	it('AF-GTD-TAG-ADD: vault.modify can use a shorter quiet period', () => {
		vi.useFakeTimers();
		const push = vi.fn();
		const scheduler = createActiveFilePushScheduler({ debounceMs: 5000, push });
		scheduler.notify('notes/a.md', 1200);
		vi.advanceTimersByTime(1199);
		expect(push).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(push).toHaveBeenCalledTimes(1);
		scheduler.dispose();
	});

	it('BUG-COMMENT-ABYSS-VIEW schedules push on vault.modify for in-scope notes', () => {
		expect(shouldNotifyPushOnVaultModify({
			hasToken: true,
			isMarkdown: true,
			inScope: true,
		})).toBe(true);
		expect(shouldNotifyPushOnVaultModify({
			hasToken: true,
			isMarkdown: true,
			inScope: false,
		})).toBe(false);
		expect(shouldNotifyPushOnVaultModify({
			hasToken: false,
			isMarkdown: true,
			inScope: true,
		})).toBe(false);
	});

	it('BUG-COMMENT-ABYSS-VIEW still plans a push when there is no markdown caret (Abyss leaf)', () => {
		expect(planActiveFilePush({
			...ready,
			caretLine: null,
			caretIsTask: false,
			caretTitle: '',
			caretRaw: '',
		})).toEqual({ push: true, skipLines: [], retryAfterSync: false });
	});
});
