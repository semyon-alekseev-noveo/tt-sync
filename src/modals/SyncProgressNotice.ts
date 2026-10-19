import { Notice } from 'obsidian';

/** Non-blocking sync progress in Obsidian's top-right notice stack (timeout 0 until hidden). */
export class SyncProgressNotice {
	private notice?: Notice;
	private openedAt = 0;

	isOpen(): boolean {
		return !!this.notice;
	}

	show(title: string, step: string, detail?: string): void {
		const text = detail ? `${title}: ${step} — ${detail}` : `${title}: ${step}`;
		if (!this.notice) {
			this.openedAt = Date.now();
			this.notice = new Notice(text, 0);
			this.notice.noticeEl.addClass('tts-sync-notice');
		} else {
			this.setText(text);
		}
	}

	private setText(text: string): void {
		const root = this.notice?.noticeEl;
		if (!root) return;
		const msg = root.querySelector('.notice-message');
		if (msg instanceof HTMLElement) {
			msg.setText(text);
		} else {
			root.setText(text);
		}
	}

	elapsedLabel(ok: boolean): string {
		const sec = ((Date.now() - this.openedAt) / 1000).toFixed(1);
		return ok ? `Done (${sec}s)` : `Finished with errors (${sec}s)`;
	}

	hide(): void {
		this.notice?.hide();
		this.notice = undefined;
	}
}
