import { it, expect, vi } from 'vitest';
import { TaskDeletionModal, PROMPT_TIMEOUT_MS, pendingDeletions, deletionPromptTimeoutMs } from '@/modals/TaskDeletionModal';
import { Modal } from 'obsidian';
(Modal.prototype as unknown as { onClose?: () => void }).onClose ??= () => {};

it('unanswered deletion prompt resolves to skip and records pending items', async () => {
	vi.useFakeTimers();
	PROMPT_TIMEOUT_MS.value = 1000;
	const timeout = deletionPromptTimeoutMs(1);
	const m = new TaskDeletionModal({} as never, [{ title: 't', id: 'x1' }], 'r', () => {});
	(m as unknown as { open: () => void }).open = () => {};
	const e = { empty: () => {} }; Object.assign(m, { titleEl: e, contentEl: e }); (m as unknown as { close: () => void }).close = () => m.onClose();
	const p = m.showModal();
	vi.advanceTimersByTime(timeout + 500);
	await expect(p).resolves.toMatchObject({ confirmed: false, timedOut: true });
	expect(pendingDeletions.map(d => d.id)).toContain('x1');
	vi.useRealTimers();
});

it('does not re-prompt for items already pending in the same sync pass', async () => {
	const m = new TaskDeletionModal({} as never, [{ title: 't', id: 'x1' }], 'r', () => {});
	let opened = false;
	(m as unknown as { open: () => void }).open = () => { opened = true; };
	await expect(m.showModal()).resolves.toMatchObject({ confirmed: false, suppressedPending: true });
	expect(opened).toBe(false);
});
