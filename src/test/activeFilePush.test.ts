import { afterEach, describe, expect, it, vi } from 'vitest';
import { createActiveFilePushScheduler, planActiveFilePush, type ActiveFilePushContext } from '@/services/activeFilePush';

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
		expect(planActiveFilePush(ready)).toEqual({ push: true, skipLines: [] });
		expect(planActiveFilePush({
			...ready,
			caretLine: 4,
			caretTitle: '%%',
			caretRaw: '- [ ] %%',
		})).toEqual({ push: true, skipLines: [4] });
	});

	it('does not push while sync is running or the file is out of scope', () => {
		expect(planActiveFilePush({ ...ready, syncRunning: true }).push).toBe(false);
		expect(planActiveFilePush({ ...ready, inScope: false }).push).toBe(false);
		expect(planActiveFilePush({ ...ready, hasToken: false }).push).toBe(false);
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
});
