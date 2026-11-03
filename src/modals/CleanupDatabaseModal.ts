import { App, Modal, Setting } from 'obsidian';
import {
	CLEANUP_CACHE_FILES_CONFIRM,
	CLEANUP_CACHE_FILES_MESSAGE,
	CLEANUP_CACHE_FILES_TITLE,
} from '@/ui/settings/settingsUxCopy';

export class CleanupDatabaseModal extends Modal {
	resolvePromise!: (value: boolean) => void;

	constructor(app: App, private files: string[]) {
		super(app);
	}

	onOpen() {
		const { titleEl, contentEl } = this;

		titleEl.setText(CLEANUP_CACHE_FILES_TITLE);

		contentEl.createEl('p', { text: CLEANUP_CACHE_FILES_MESSAGE });

		const listEl = contentEl.createDiv({ attr: { style: 'max-height: 400px; overflow-y: auto; margin-bottom: 10px;' } });
		for (const file of this.files) {
			listEl.createDiv({ text: file, cls: 'ts-database-cleanup-file' });
		}

		new Setting(contentEl)
			.addButton(cancelBtn => {
				cancelBtn.setClass('ts_button');
				cancelBtn.setButtonText('Cancel');
				cancelBtn.onClick(() => {
					this.resolvePromise(false);
					this.close();
				});
			})
			.addButton(confirmBtn => {
				confirmBtn.setClass('ts_button');
				confirmBtn.buttonEl.addClass('mod-destructive');
				confirmBtn.setButtonText(CLEANUP_CACHE_FILES_CONFIRM(this.files.length));
				confirmBtn.onClick(() => {
					this.resolvePromise(true);
					this.close();
				});
			});
	}

	onClose() {
		this.titleEl.empty();
		this.contentEl.empty();
		super.onClose();
	}

	public showModal(): Promise<boolean> {
		this.open();
		return new Promise(resolve => (this.resolvePromise = resolve));
	}
}
