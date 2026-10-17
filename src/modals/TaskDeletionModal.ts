import { App, Modal, Notice, Setting } from 'obsidian';

/** Prompts never block the sync queue: unanswered within this time = skip (nothing deleted). */
/** Large vault-wide batches need time to read the list; cap at 3 minutes. */
export const PROMPT_TIMEOUT_MS = { value: 15_000 };

export function deletionPromptTimeoutMs(itemCount: number): number {
	return Math.min(180_000, Math.max(PROMPT_TIMEOUT_MS.value, 15_000 + itemCount * 400));
}
/** Deletions skipped by timeout, for the user to review later. */
export const pendingDeletions: DeletionItem[] = [];

export type DeletionPromptResult = {
	confirmed: boolean;
	/** Modal not shown: these ids were skipped earlier (timeout) in this session. */
	suppressedPending?: boolean;
	timedOut?: boolean;
};

/** Cleared at the start of each sync Phase 2 so manual sync always re-prompts. */
export function clearPendingDeletions(): void {
	pendingDeletions.length = 0;
}


export interface DeletionItem {
	title: string;
	filePath?: string;
	id?: string;
	line?: string;
}

export class TaskDeletionModal extends Modal {
	title = 'Task Deletion Confirmation';

	message = 'The following Task(s) will be deleted because: ';
	cancelLabel = 'Cancel';
	confirmLabel = 'Confirm Deletion';
	items: DeletionItem [] = [];
	result!: boolean;
	reason: string;
	onSubmit: (result: boolean) => void;
	resolvePromise!: (value: (PromiseLike<boolean> | boolean)) => void;

	constructor(app: App, items: DeletionItem[], reason: string, onSubmit: (result: boolean) => void) {
		super(app);
		this.items = items;
		this.reason = reason;

		this.onSubmit = onSubmit;
	}

	/**
	 * Called automatically by the Modal class when modal is opened.
	 */
	onOpen() {
		const { titleEl, contentEl } = this;

		titleEl.setText(this.title);

		contentEl.createEl('p', { text: `${this.message}${this.reason}` });

		// Group items by filePath
		const groupedItems: Record<string, DeletionItem[]> = {};
		this.items.forEach(item => {
			const path = item.filePath || 'Unknown File';
			if (!groupedItems[path]) {
				groupedItems[path] = [];
			}
			groupedItems[path].push(item);
		});

		for (const [filePath, titles] of Object.entries(groupedItems)) {
			if (filePath !== 'Unknown File' || Object.keys(groupedItems).length > 1) {
				contentEl.createEl('strong', { text: filePath, attr: { style: 'display: block; margin-top: 10px;' } });
			}
			const unorderedList = contentEl.createEl('ul', { attr: { style: 'margin-top: 5px;' } });
			titles.forEach((item) => {
				const li = unorderedList.createEl('li', { text: item.title });
				if (item.id) li.createEl('div', { text: `id: ${item.id}`, attr: { style: 'font-size: smaller; opacity: 0.7;' } });
				if (item.line) li.createEl('code', { text: item.line, attr: { style: 'display: block; white-space: pre-wrap; font-size: smaller;' } });
			});
		}


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

	public showModal(): Promise<DeletionPromptResult> {
		// Same sync pass only: avoid duplicate modals for ids that just timed out.
		if (this.items.length && this.items.every(it => pendingDeletions.some(p => p.id === it.id))) {
			return Promise.resolve({ confirmed: false, suppressedPending: true });
		}
		this.open();
		return new Promise((resolve) => {
			let done = false;
			const timer = window.setTimeout(() => {
				if (done) return;
				this.result = false;
				for (const it of this.items) if (!pendingDeletions.some(p => p.id === it.id)) pendingDeletions.push(it);
				new Notice(`TickTickSync: deletion of ${this.items.length} task(s) skipped (no answer within ${PROMPT_TIMEOUT_MS.value / 1000}s). Sync again to retry.`, 10000);
				this.close();
			}, deletionPromptTimeoutMs(this.items.length));
			this.resolvePromise = (v) => {
				if (done) return;
				done = true;
				window.clearTimeout(timer);
				resolve({
					confirmed: Boolean(v),
					timedOut: !v && this.items.some(it => pendingDeletions.some(p => p.id === it.id)),
				});
			};
		});
	}
}
