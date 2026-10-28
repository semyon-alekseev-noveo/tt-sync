import { App, Modal, Notice, Setting } from 'obsidian';
import { deletionPromptTimeoutMs } from '@/modals/TaskDeletionModal';
import {
	canOfferRematch,
	formatPlannedDeletionLabel,
	previewItems,
	type GuardDecision,
	type PlannedDeletion,
} from '@/sync/massDeleteGuard';

export type MassDeletePromptChoice = 'apply-once' | 'skip' | 'open-report' | 'rematch';

/**
 * Manual sync only. Timeout skips, same as the single-task deletion dialog:
 * a missed prompt must not delete.
 */
export class MassDeleteGuardModal extends Modal {
	private choice: MassDeletePromptChoice = 'skip';
	private resolvePromise: ((choice: MassDeletePromptChoice) => void) | null = null;

	constructor(
		app: App,
		private readonly decision: GuardDecision,
		private readonly items: PlannedDeletion[],
		private readonly previewCount: number,
	) {
		super(app);
	}

	onOpen() {
		const { titleEl, contentEl } = this;
		titleEl.setText('TickTickSync held deletions');
		const vaultWipeTt = this.items.some(
			item => item.kind === 'task' && item.direction === 'vault-to-ticktick' && item.action === 'delete',
		);
		contentEl.createEl('p', {
			text: `${this.decision.taskDeletions} task deletion(s) and ${this.decision.commentDeletions} comment deletion(s) (${this.decision.reason}). `
				+ `${this.decision.percent.toFixed(1)}% of ${this.decision.trackedTasks} tracked task(s). `
				+ 'Creates and updates still run. The checkpoint stays until you apply deletions.',
		});
		if (vaultWipeTt) {
			contentEl.createEl('p', {
				text: 'Lines labeled “Would delete from TickTick” mean the vault is missing line markers — Apply would wipe those tasks in TickTick. Prefer Skip or Rematch after a restore.',
			});
		}
		const shown = previewItems(this.items, this.previewCount);
		const list = contentEl.createEl('ul');
		for (const item of shown) {
			list.createEl('li', { text: formatPlannedDeletionLabel(item) });
		}
		if (this.items.length > shown.length) {
			contentEl.createEl('p', { text: `And ${this.items.length - shown.length} more. The report lists all of them.` });
		}
		new Setting(contentEl)
			.addButton(button => {
				button.setButtonText('Skip deletions this run');
				button.onClick(() => this.finish('skip'));
			})
			.addButton(button => {
				button.setButtonText('Open report');
				button.onClick(() => this.finish('open-report'));
			});
		if (canOfferRematch(this.items)) {
			new Setting(contentEl)
				.setDesc('Rewrite missing vault lines from TickTick/local cache. Does not delete TickTick tasks.')
				.addButton(button => {
					button.setButtonText('Rematch into vault (keep TickTick)');
					button.setCta();
					button.onClick(() => this.finish('rematch'));
				});
		}
		new Setting(contentEl)
			.addButton(button => {
				button.setButtonText('Apply once');
				button.setWarning();
				button.onClick(() => this.finish('apply-once'));
			});
	}

	onClose() {
		this.contentEl.empty();
		this.resolvePromise?.(this.choice);
		this.resolvePromise = null;
	}

	show(): Promise<MassDeletePromptChoice> {
		this.open();
		return new Promise(resolve => {
			let done = false;
			const timer = window.setTimeout(() => {
				if (done) return;
				this.choice = 'skip';
				new Notice('TickTickSync: deletion guard closed with no answer. Deletions skipped.', 8000);
				this.close();
			}, deletionPromptTimeoutMs(this.items.length));
			this.resolvePromise = choice => {
				if (done) return;
				done = true;
				window.clearTimeout(timer);
				resolve(choice);
			};
		});
	}

	private finish(choice: MassDeletePromptChoice) {
		this.choice = choice;
		this.close();
	}
}
