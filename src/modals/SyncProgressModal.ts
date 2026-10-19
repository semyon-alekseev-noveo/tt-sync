import { Modal } from 'obsidian';

/** Lightweight, non-interactive progress window for the main sync pipeline. */
export class SyncProgressModal extends Modal {
	private stepEl!: HTMLElement;
	private detailEl!: HTMLElement;
	private openedAt = 0;

	onOpen(): void {
		this.openedAt = Date.now();
		this.titleEl.setText('TickTick sync');
		const row = this.contentEl.createDiv({ cls: 'tts-sync-progress' });
		row.createDiv({ cls: 'tts-sync-progress-spinner' });
		const text = row.createDiv({ cls: 'tts-sync-progress-text' });
		this.stepEl = text.createEl('p', { cls: 'tts-sync-progress-step' });
		this.detailEl = text.createEl('p', { cls: 'tts-sync-progress-detail' });
		this.setStep('Starting…');
		this.modalEl.addClass('tts-sync-progress-modal');
		// Sync must finish or fail before the user dismisses; accidental click-out is ok.
	}

	setStep(step: string, detail?: string): void {
		if (!this.stepEl) return;
		this.stepEl.setText(step);
		if (this.detailEl) {
			this.detailEl.setText(detail ?? '');
			this.detailEl.style.display = detail ? 'block' : 'none';
		}
	}

	finish(ok: boolean): void {
		const sec = ((Date.now() - this.openedAt) / 1000).toFixed(1);
		this.setStep(ok ? `Done (${sec}s)` : `Finished with errors (${sec}s)`);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
