<script lang="ts">
	import CollapsibleSection from '@/ui/settings/svelte/sections/CollapsibleSection.svelte';
	import { createEventDispatcher } from 'svelte';
	import { getSettings, updateSettings } from '@/settings';
	import { Notice } from 'obsidian';
	import {
		SCHEDULED_PROGRESS_DISABLED_HINT,
		SCHEDULED_PROGRESS_HELP,
		SCHEDULED_PROGRESS_LABEL,
		scheduledProgressControlEnabled,
	} from '@/ui/settings/settingsUxPolish';

	export let open = false;
	export let plugin;

	let automaticSynchronizationInterval: number = getSettings().automaticSynchronizationInterval;
	let showSyncProgressOnScheduledSync: boolean = getSettings().showSyncProgressOnScheduledSync;
	$: automaticSynchronizationIntervalString = automaticSynchronizationInterval.toString();
	$: progressEnabled = scheduledProgressControlEnabled(automaticSynchronizationInterval);
	let debounceTimeout: ReturnType<typeof setTimeout>;
	const dispatch = createEventDispatcher();

	function handleHeaderClick() {
		dispatch('toggle');
	}

	async function handleAutomaticSynchronizationIntervalChange(value: string) {
		const intervalNum = Number(value);
		if (isNaN(intervalNum) || !Number.isInteger(intervalNum)) {
			new Notice(`Wrong type, please enter a integer.`);
			return;
		}
		if (intervalNum !== 0 && intervalNum < 20) {
			new Notice(`The synchronization interval time cannot be less than 20 seconds.`);
			return;
		}
		automaticSynchronizationInterval = intervalNum;
		updateSettings({ automaticSynchronizationInterval: intervalNum });
		await plugin.saveSettings();
		plugin.reloadInterval();
		new Notice('Settings have been updated.');
	}
</script>

<CollapsibleSection
	title="Automatic sync interval time"
	shortDesc="Sync interval setting"
	open={open}
	on:headerClick={handleHeaderClick}
>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Automatic sync interval time</div>
			<div class="setting-item-description">Seconds between automatic syncs. 0 means no automatic sync
				(default). Use Sync now when you want a sync. A repeating interval cannot be lower than 20 seconds.
			</div>
		</div>
		<div class="setting-item-control">
			<input
				id="sync-tag"
				type="text"
				bind:value={automaticSynchronizationInterval}
				Placeholder="Sync interval"
				on:input={(e: Event) => {
					if (debounceTimeout) clearTimeout(debounceTimeout);
					debounceTimeout = setTimeout(async () => {
						const target = e.target as HTMLInputElement;
						await handleAutomaticSynchronizationIntervalChange(target.value);
						}, 900);
				}}
			/>
		</div>
	</div>
	<div class="setting-item" class:tts-ux-progress-disabled={!progressEnabled}>
		<div class="setting-item-info">
			<div class="setting-item-name">{SCHEDULED_PROGRESS_LABEL}</div>
			<div class="setting-item-description">
				{SCHEDULED_PROGRESS_HELP}
				{#if !progressEnabled}
					<br /><span class="tts-ux-warn" style="display:inline-block;margin-top:0.35em;">{SCHEDULED_PROGRESS_DISABLED_HINT}</span>
				{/if}
			</div>
		</div>
		<div class="setting-item-control">
			<input
				type="checkbox"
				bind:checked={showSyncProgressOnScheduledSync}
				disabled={!progressEnabled}
				aria-disabled={!progressEnabled}
				on:change={async () => {
					if (!scheduledProgressControlEnabled(automaticSynchronizationInterval)) return;
					updateSettings({ showSyncProgressOnScheduledSync });
					await plugin.saveSettings();
				}}
			/>
		</div>
	</div>
</CollapsibleSection>
