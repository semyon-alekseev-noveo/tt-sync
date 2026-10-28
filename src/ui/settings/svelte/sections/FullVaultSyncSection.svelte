<script lang="ts">
	import CollapsibleSection from '@/ui/settings/svelte/sections/CollapsibleSection.svelte';
	import { createEventDispatcher } from 'svelte';
	import { ConfirmFullSyncModal } from '@/modals/ConfirmFullSyncModal';
	import { settingsStore } from '@/ui/settings/settingsstore';
	import {
		FULL_VAULT_SYNC_HELP,
		FULL_VAULT_SYNC_LABEL,
	} from '@/ui/settings/settingsUxNames';

	export let open = false;
	export let plugin;

	const dispatch = createEventDispatcher();

	function handleHeaderClick() {
		dispatch('toggle');
	}

	async function confirmFullSync() {
		const myModal = new ConfirmFullSyncModal(plugin.app, () => {
		});
		return await myModal.showModal();
	}

	async function handleToggle() {
		const targetValue = !$settingsStore.enableFullVaultSync;
		await handleFullVaultSyncChange(targetValue);
	}

	async function handleFullVaultSyncChange(value: boolean) {
		let noticeString: string;
		if (value) { // Use the passed value instead of checking store state before update
			const bConfirmation = await confirmFullSync();
			if (bConfirmation) {
				// enable, update store
				settingsStore.update((s) => ({ ...s, enableFullVaultSync: true }));
				noticeString = 'Full vault sync is enabled.';
			} else {
				// stay disabled
				settingsStore.update((s) => ({ ...s, enableFullVaultSync: false }));
				noticeString = 'Full vault sync not enabled.';
			}
		} else {
			settingsStore.update((s) => ({ ...s, enableFullVaultSync: false }));
			noticeString = 'Full vault sync is disabled.';
		}
		new Notice(noticeString);
		await plugin.saveSettings();
	}
</script>

<CollapsibleSection
	title={FULL_VAULT_SYNC_LABEL}
	shortDesc="Full vault settings"
	open={open}
	on:headerClick={handleHeaderClick}
>
	<div class="Full vault sync">
		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">{FULL_VAULT_SYNC_LABEL}</div>
				<div class="setting-item-description">
					{FULL_VAULT_SYNC_HELP}
					<p><b>NOTE: This includes all tasks that are currently Items of a task.</b></p>
				</div>
			</div>
			<div class="setting-item-control">
				<label class="checkbox-container" class:is-enabled={$settingsStore.enableFullVaultSync}>
					<input
						type="checkbox"
						checked={$settingsStore.enableFullVaultSync}
						on:click|preventDefault={handleToggle}
					/>
				</label>
			</div>
		</div>
	</div>
</CollapsibleSection>
