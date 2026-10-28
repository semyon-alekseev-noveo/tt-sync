import { App, Modal, Setting } from 'obsidian';
import {
	FULL_VAULT_CONFIRM_LABEL,
	FULL_VAULT_CONFIRM_MESSAGE,
	FULL_VAULT_CONFIRM_TITLE,
} from '@/ui/settings/settingsUxNames';


export class ConfirmFullSyncModal extends Modal {
	title = FULL_VAULT_CONFIRM_TITLE;
	message = FULL_VAULT_CONFIRM_MESSAGE;
	cancelLabel = 'Cancel';
	confirmLabel = FULL_VAULT_CONFIRM_LABEL;
	result: boolean = false;
	onSubmit: (result: boolean) => void;
	resolvePromise!: (value: (PromiseLike<boolean> | boolean)) => void;

	constructor(app: App, onSubmit: (result: boolean) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	/**
	 * Called automatically by the Modal class when modal is opened.
	 */
	onOpen() {
		const { titleEl, contentEl } = this;

		titleEl.setText(this.title);
		const arrMessage = this.message.split('\n');
		arrMessage.forEach(message => {
		contentEl.createEl('p', { text: message });
		})

		new Setting(contentEl).addButton(cancelBtn => {
			cancelBtn.setClass('ts_button');
			cancelBtn.setButtonText(this.cancelLabel);
				cancelBtn.onClick(() => {
					this.result = false;
					this.onSubmit(this.result);
					this.close();
				});
		})
			.addButton(confirmBtn => {
				confirmBtn.setClass('ts_button');
				confirmBtn.buttonEl.addClass('mod-destructive');
				confirmBtn.setButtonText(this.confirmLabel);
				confirmBtn.onClick(() => {
					this.result = true;
					this.onSubmit(this.result);
					this.close();
				});
			});

	}

	/**
	 * Called automatically by the Modal class when modal is closed.
	 */
	onClose() {
		this.titleEl.empty();
		this.contentEl.empty();
		super.onClose();
		this.resolvePromise(this.result);
	}

	public showModal(): Promise<boolean> {
		this.open();
		return new Promise(
			(resolve) => (this.resolvePromise = resolve)
		);
	}
}
