import { App, Modal, Setting } from 'obsidian';
import {
	PASSWORD_PLAINTEXT_CONFIRM_LABEL,
	PASSWORD_PLAINTEXT_CONFIRM_MESSAGE,
	PASSWORD_PLAINTEXT_CONFIRM_TITLE,
} from '@/ui/settings/settingsUxPolish';

/** UX-SET-PW-CONFIRM — explicit confirm before storing plaintext password. */
export class ConfirmPasswordPlaintextModal extends Modal {
	title = PASSWORD_PLAINTEXT_CONFIRM_TITLE;
	message = PASSWORD_PLAINTEXT_CONFIRM_MESSAGE;
	cancelLabel = 'Cancel';
	confirmLabel = PASSWORD_PLAINTEXT_CONFIRM_LABEL;
	result: boolean = false;
	onSubmit: (result: boolean) => void;
	resolvePromise!: (value: PromiseLike<boolean> | boolean) => void;

	constructor(app: App, onSubmit: (result: boolean) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { titleEl, contentEl } = this;
		titleEl.setText(this.title);
		for (const line of this.message.split('\n')) {
			contentEl.createEl('p', { text: line });
		}

		new Setting(contentEl)
			.addButton((cancelBtn) => {
				cancelBtn.setClass('ts_button');
				cancelBtn.setButtonText(this.cancelLabel);
				cancelBtn.onClick(() => {
					this.result = false;
					this.onSubmit(this.result);
					this.close();
				});
			})
			.addButton((confirmBtn) => {
				confirmBtn.setClass('ts_button');
				confirmBtn.buttonEl.addClass('mod-warning');
				confirmBtn.setButtonText(this.confirmLabel);
				confirmBtn.onClick(() => {
					this.result = true;
					this.onSubmit(this.result);
					this.close();
				});
			});
	}

	onClose() {
		this.titleEl.empty();
		this.contentEl.empty();
		super.onClose();
		this.resolvePromise(this.result);
	}

	public showModal(): Promise<boolean> {
		this.open();
		return new Promise((resolve) => (this.resolvePromise = resolve));
	}
}
