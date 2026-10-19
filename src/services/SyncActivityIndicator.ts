import type TickTickSync from '@/main';
import { SyncProgressModal } from '@/modals/SyncProgressModal';
import { getSettings } from '@/settings';

/** What started a full `synchronization()` run. */
export type SyncTrigger = 'manual' | 'scheduled' | 'startup';

export function shouldShowFullSyncProgress(trigger: SyncTrigger): boolean {
	if (trigger !== 'scheduled') return true;
	return getSettings().showSyncProgressOnScheduledSync;
}

/**
 * UI for sync activity: modal for full Synchronize, status bar for inline TickTick API work.
 */
export class SyncActivityIndicator {
	private modal?: SyncProgressModal;
	private inlineDepth = 0;
	private statusEl?: HTMLElement;

	constructor(private plugin: TickTickSync) {}

	private ensureStatusEl(): HTMLElement {
		if (!this.statusEl) {
			this.statusEl = this.plugin.addStatusBarItem();
			this.statusEl.addClass('tts-sync-status');
		}
		return this.statusEl;
	}

	beginFull(trigger: SyncTrigger): void {
		if (!shouldShowFullSyncProgress(trigger)) return;
		this.modal = new SyncProgressModal(this.plugin.app);
		this.modal.open();
	}

	setFullStep(step: string, detail?: string): void {
		this.modal?.setStep(step, detail);
	}

	endFull(ok: boolean): void {
		if (!this.modal) return;
		this.modal.finish(ok);
		const m = this.modal;
		this.modal = undefined;
		window.setTimeout(() => m.close(), ok ? 400 : 1500);
	}

	beginInline(label: string): void {
		const el = this.ensureStatusEl();
		this.inlineDepth++;
		el.setText(`⟳ ${label}`);
		el.toggleClass('is-active', true);
	}

	endInline(): void {
		this.inlineDepth = Math.max(0, this.inlineDepth - 1);
		if (this.inlineDepth === 0 && this.statusEl) {
			this.statusEl.setText('');
			this.statusEl.toggleClass('is-active', false);
		}
	}

	async runInline<T>(label: string, fn: () => Promise<T>): Promise<T> {
		this.beginInline(label);
		try {
			return await fn();
		} finally {
			this.endInline();
		}
	}
}
