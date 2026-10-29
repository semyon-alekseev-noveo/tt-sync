import { App, Modal, Notice, Setting } from 'obsidian';
import { deletionPromptTimeoutMs } from '@/modals/TaskDeletionModal';
import {
	canOfferRematch,
	formatPlannedDeletionLabel,
	isRestoreShapedHold,
	previewItems,
	REBIND_BUTTON_DESC,
	REBIND_BUTTON_LABEL,
	REBIND_VAULT_WIPE_HINT,
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
		const restoreShaped = isRestoreShapedHold(this.items);
		contentEl.createEl('p', {
			text: `${this.decision.taskDeletions} task deletion(s) and ${this.decision.commentDeletions} comment deletion(s) (${this.decision.reason}). `
				+ `${this.decision.percent.toFixed(1)}% of ${this.decision.trackedTasks} tracked task(s). `
				+ 'Creates and updates still run. The checkpoint stays until you apply deletions.',
		});
		if (vaultWipeTt) {
			contentEl.createEl('p', { text: REBIND_VAULT_WIPE_HINT });
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
				.setDesc(REBIND_BUTTON_DESC)
				.addButton(button => {
					button.setButtonText(REBIND_BUTTON_LABEL);
					button.setCta();
					button.onClick(() => this.finish('rematch'));
				});
		}
		new Setting(contentEl)
			.setDesc(
				restoreShaped
					? 'Not recommended after restore/reset — wipes TickTick for missing vault markers.'
					: '',
			)
			.addButton(button => {
				button.setButtonText('Apply once');
				// ID-REBIND-UX: never warn/CTA Apply when vault→TT (restore-shaped) dominates
				if (!restoreShaped) button.setWarning();
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
