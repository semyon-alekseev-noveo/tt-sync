import type TickTickSync from '@/main';
import { SyncProgressNotice } from '@/modals/SyncProgressNotice';
import { getSettings } from '@/settings';

/** What started a full `synchronization()` run. */
export type SyncTrigger = 'manual' | 'scheduled' | 'startup';

export function shouldShowFullSyncProgress(trigger: SyncTrigger): boolean {
	if (trigger !== 'scheduled') return true;
	return getSettings().showSyncProgressOnScheduledSync;
}

/**
 * Sync activity UI: persistent Notice (top-right) for full Synchronize and inline TickTick API work.
 */
export class SyncActivityIndicator {
	private readonly notice = new SyncProgressNotice();
	private fullActive = false;
	private inlineDepth = 0;

	constructor(_plugin: TickTickSync) {}

	beginFull(trigger: SyncTrigger): void {
		if (!shouldShowFullSyncProgress(trigger)) return;
		this.fullActive = true;
		this.notice.show('TickTick sync', 'Starting…');
	}

	setFullStep(step: string, detail?: string): void {
		if (!this.fullActive && !this.notice.isOpen()) return;
		this.notice.show('TickTick sync', step, detail);
	}

	endFull(ok: boolean): void {
		if (!this.fullActive && !this.notice.isOpen()) return;
		this.notice.show('TickTick sync', this.notice.elapsedLabel(ok));
		this.fullActive = false;
		const delay = ok ? 2500 : 4000;
		if (this.inlineDepth === 0) {
			window.setTimeout(() => this.notice.hide(), delay);
		}
	}

	beginInline(label: string): void {
		this.inlineDepth++;
		if (!this.fullActive) {
			this.notice.show('TickTick', `⟳ ${label}`);
		}
	}

	endInline(): void {
		this.inlineDepth = Math.max(0, this.inlineDepth - 1);
		if (this.inlineDepth === 0 && !this.fullActive) {
			this.notice.hide();
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
