<script lang="ts">
	import { getSettings, updateSettings } from '@/settings';
	import { settingsStore } from '@/ui/settings/settingsstore';
	import type TickTickSync from '@/main';
	import { Notice, Setting } from 'obsidian';
	import { FolderSuggest } from '@/utils/FolderSuggester';
	import { onMount } from 'svelte';
	import { validateNewFolder } from '@/utils/FolderUtils';
	import DeletionGlossary from '@/ui/settings/svelte/DeletionGlossary.svelte';
	import ResetTasksControl from '@/ui/settings/svelte/ResetTasksControl.svelte';
	import {
		MAINT_PRIMARY_CTA_CLASS,
		MAINT_SYNC_PRIMARY_HELP,
		MAINT_SYNC_PRIMARY_LABEL,
		MAINT_SYNC_PRIMARY_NAME,
		PURGE_TRASH_DB_BUTTON,
		PURGE_TRASH_DB_HELP,
		PURGE_TRASH_DB_LABEL,
		RESET_DANGER_ZONE_TITLE,
	} from '@/ui/settings/settingsUxCopy';
	import {
		BKUP_FOLDER_HELP,
		BKUP_FOLDER_LABEL,
		BKUP_ROOT_WARN,
		bkupFolderIsVaultRoot,
	} from '@/ui/settings/settingsUxNames';
	import './SettingsStyles.css';

	export let plugin: TickTickSync;

	let folderOptions: Record<string, string> = {};
	let isCheckingDatabase = false;
	let isWorking = false;

	function setIsWorking(value: boolean) {
		isWorking = value;
	}

	async function handleManualSync() {
		if (!getSettings().token) {
			new Notice('Please log in from settings first');
			return;
		}
		try {
			await plugin.scheduledSynchronization();
			new Notice('Sync completed.');
		} catch (error) {
			new Notice(`An error occurred while syncing: ${error}`);
		}
	}

	let debounceTimeout: ReturnType<typeof setTimeout>;

	function searchFolder(element: HTMLElement) {
		const setting = new Setting(element)
			.addSearch((search) => {
				search.setPlaceholder('Select or Create folder')
					.setValue(getSettings().bkupFolder);
				search.setValue(folderOptions[getSettings().bkupFolder]);
				new FolderSuggest(search.inputEl, plugin.app);
				search.onChange((value) => {
					if (debounceTimeout) clearTimeout(debounceTimeout);

					debounceTimeout = setTimeout(async () => {
						const newFolder = await validateNewFolder(plugin.app, value, "Backup");
						if (newFolder) {
							updateSettings({ bkupFolder: newFolder });
							await plugin.saveSettings();
						}
					}, 700);

				});
			});
	}



	function getFolderOptions() {
		const folders = plugin.app.vault.getAllFolders(true);
		const folderOptions: Record<string, string> = {};
		for (const folder of folders) {
			folderOptions[folder.path] = folder.name;
		}
		return folderOptions;
	}

	async function handleCheckDatabase() {
		isCheckingDatabase = true;
		document.body.style.cursor = 'wait';
		try {
			await plugin.service.checkDataBase();
		} finally {
			isCheckingDatabase = false;
			document.body.style.cursor = '';
		}
	}

	onMount(async () => {
		folderOptions = getFolderOptions();
	});

</script>

<div class="manual-operations {isWorking ? 'wait-cursor' : 'default-cursor'}">
	{#if getSettings().token}
		<DeletionGlossary />

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">{MAINT_SYNC_PRIMARY_NAME}</div>
				<div class="setting-item-description">{MAINT_SYNC_PRIMARY_HELP}</div>
			</div>
			<div class="setting-item-control">
				<button class={MAINT_PRIMARY_CTA_CLASS} on:click={handleManualSync} disabled={isCheckingDatabase || isWorking}>
					{MAINT_SYNC_PRIMARY_LABEL}
				</button>
			</div>
		</div>

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Check database</div>
				<div class="setting-item-description">
					Check for possible issues: sync error, file renaming not updated, or missed tasks not synchronized
				</div>
			</div>
			<div class="setting-item-control">
				<button
					class="tts-maint-secondary"
					on:click={handleCheckDatabase}
					disabled={isCheckingDatabase || isWorking}>
					{isCheckingDatabase ? 'Checking...' : 'Check Database'}
				</button>
			</div>
		</div>

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Backup TickTick data</div>
				<div class="setting-item-description">
					Click to backup TickTick data. The backed-up files will be stored in the selected directory of the
					Obsidian vault
				</div>
			</div>
			<div class="setting-item-control">
				<button
					class="tts-maint-secondary"
					on:click={() => plugin.service.backup()}
					disabled={isCheckingDatabase || isWorking}>
					Backup
				</button>
			</div>
		</div>

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Skip backup</div>
				<div class="setting-item-description">Skip backup on startup</div>
			</div>
			<div class="setting-item-control">
				<label class="checkbox-container" class:is-enabled={$settingsStore.skipBackup}>
					<input
						type="checkbox"
						checked={$settingsStore.skipBackup}
						on:change={async (e) => {
							updateSettings({ skipBackup: (e.target as HTMLInputElement).checked });
							await plugin.saveSettings();
						}}
					/>
				</label>
			</div>
		</div>
		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">{BKUP_FOLDER_LABEL}</div>
				<div class="setting-item-description">{BKUP_FOLDER_HELP}</div>
				{#if bkupFolderIsVaultRoot($settingsStore.bkupFolder)}
					<div class="setting-item-description tts-ux-warn">{BKUP_ROOT_WARN}</div>
				{/if}
			</div>
			<div class="setting-item-control flex-container">
				<div
					class="modal-form remove-padding remove-border fix-suggest"
					use:searchFolder
				>
				</div>
			</div>

		</div>

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">{PURGE_TRASH_DB_LABEL}</div>
				<div class="setting-item-description">{PURGE_TRASH_DB_HELP}</div>
			</div>
			<div class="setting-item-control">
				<button class="tts-maint-secondary" on:click={async () => {
					const { CleanupDeletedTasksModal } = await import('@/modals/CleanupDeletedTasksModal');
					const deletedTasks = await plugin.taskRepository.getDeletedTasks();
					if (deletedTasks.length === 0) {
						new Notice('No deleted tasks found.');
						return;
					}
					const modal = new CleanupDeletedTasksModal(plugin.app, deletedTasks);
					const selected = await modal.showModal();
					if (selected.length > 0) {
						await plugin.taskRepository.hardDeleteTasks(selected);
						new Notice(`Permanently deleted ${selected.length} task(s).`);
					}
				}} disabled={isCheckingDatabase || isWorking}>
					{PURGE_TRASH_DB_BUTTON}
				</button>
			</div>
		</div>

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Recover deleted tasks</div>
				<div class="setting-item-description">View and restore deleted tasks back to their original or a different file</div>
			</div>
			<div class="setting-item-control">
				<button class="tts-maint-secondary" on:click={async () => {
					const { RecoverDeletedTasksModal } = await import('@/modals/RecoverDeletedTasksModal');
					const deletedTasks = await plugin.taskRepository.getDeletedTasks();
					if (deletedTasks.length === 0) {
						new Notice('No deleted tasks found.');
						return;
					}
					const modal = new RecoverDeletedTasksModal(plugin.app, plugin, deletedTasks);
					await modal.showModal();
				}} disabled={isCheckingDatabase || isWorking}>
					Recover Deleted Tasks
				</button>
			</div>
		</div>

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Deleted Task Retention</div>
				<div class="setting-item-description">Days to keep deleted tasks before auto-purge (1–31)</div>
			</div>
			<div class="TTS-setting-item-control">
				<input
					type="number"
					min="1"
					max="31"
					value={getSettings().deletedTaskRetentionDays}
					on:change={async (e) => {
						const val = Math.min(31, Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 7));
						updateSettings({ deletedTaskRetentionDays: val });
						await plugin.saveSettings();
					}}
				/>
			</div>
		</div>

		<div class="tts-danger-zone">
			<div class="tts-danger-zone-title">{RESET_DANGER_ZONE_TITLE}</div>
			<ResetTasksControl
				{isWorking}
				{plugin}
				{setIsWorking}
			/>
		</div>
	{/if}
</div>
