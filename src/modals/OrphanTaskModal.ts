import { App, Modal, Setting } from 'obsidian';
import {
	ORPHAN_ADD_LABEL,
	ORPHAN_CANCEL_LABEL,
	ORPHAN_DELETE_LABEL,
	ORPHAN_MODAL_MESSAGE,
	ORPHAN_MODAL_PATHS_HEADING,
	ORPHAN_MODAL_PROMPT,
	ORPHAN_MODAL_RESTORE_HINT,
	ORPHAN_MODAL_TITLE,
} from '@/ui/settings/settingsUxCopy';

export interface OrphanItem {
	title: string;
	filePath?: string;
	projectName?: string;
}

export type OrphanAction = 'add' | 'delete' | 'cancel';

export class OrphanTaskModal extends Modal {
	title = ORPHAN_MODAL_TITLE;

	message = ORPHAN_MODAL_MESSAGE;
	items: OrphanItem[] = [];
	action: OrphanAction = 'cancel';
	resolvePromise!: (value: OrphanAction) => void;

	constructor(app: App, items: OrphanItem[]) {
		super(app);
		this.items = items;
	}

	onOpen() {
		const { titleEl, contentEl } = this;

		titleEl.setText(this.title);

		contentEl.createEl('p', { text: this.message });
		contentEl.createEl('p', {
			text: ORPHAN_MODAL_RESTORE_HINT,
			attr: { style: 'opacity: 0.85; font-size: 0.95em;' },
		});

		contentEl.createEl('strong', {
			text: ORPHAN_MODAL_PATHS_HEADING,
			attr: { style: 'display: block; margin-top: 12px;' },
		});

		const groupedItems: Record<string, string[]> = {};
		this.items.forEach(item => {
			const group = item.filePath || item.projectName || 'Unknown list (no mapped file)';
			if (!groupedItems[group]) {
				groupedItems[group] = [];
			}
			groupedItems[group].push(item.title);
		});

		for (const [group, titles] of Object.entries(groupedItems)) {
			contentEl.createEl('strong', {
				text: group,
				attr: { style: 'display: block; margin-top: 10px; font-weight: 600;' },
			});
			const unorderedList = contentEl.createEl('ul', { attr: { style: 'margin-top: 5px;' } });
			titles.forEach((title) => {
				unorderedList.createEl('li', { text: title });
			});
		}

		contentEl.createEl('hr');

		contentEl.createEl('p', { text: ORPHAN_MODAL_PROMPT, attr: { style: 'margin-bottom: 10px;' } });

		// Safe default first (Cancel); destructive middle; Add last and not CTA — avoid accidental import after restore.
		new Setting(contentEl)
			.addButton(cancelBtn => {
				cancelBtn.setClass('ts_button');
				cancelBtn.setCta();
				cancelBtn.setButtonText(ORPHAN_CANCEL_LABEL);
				cancelBtn.onClick(() => {
					this.action = 'cancel';
					this.close();
				});
			})
			.addButton(deleteBtn => {
				deleteBtn.setClass('ts_button');
				deleteBtn.buttonEl.addClass('mod-destructive');
				deleteBtn.setButtonText(ORPHAN_DELETE_LABEL);
				deleteBtn.onClick(() => {
					this.action = 'delete';
					this.close();
				});
			})
			.addButton(addBtn => {
				addBtn.setClass('ts_button');
				addBtn.setButtonText(ORPHAN_ADD_LABEL);
				addBtn.onClick(() => {
					this.action = 'add';
					this.close();
				});
			});
	}

	onClose() {
		this.titleEl.empty();
		this.contentEl.empty();
		super.onClose();
		this.resolvePromise(this.action);
	}

	public showModal(): Promise<OrphanAction> {
		this.open();
		return new Promise((resolve) => (this.resolvePromise = resolve));
	}
}
