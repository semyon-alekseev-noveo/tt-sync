<script lang="ts">
	import CollapsibleSection from '@/ui/settings/svelte/sections/CollapsibleSection.svelte';
	import DeletionGlossary from '@/ui/settings/svelte/DeletionGlossary.svelte';
	import { createEventDispatcher } from 'svelte';
	import { getSettings, updateSettings } from '@/settings';
	import { Notice } from 'obsidian';

	export let open = false;
	export let plugin;

	let massDeleteGuardEnabled = getSettings().massDeleteGuardEnabled;
	let massDeleteTaskThreshold = getSettings().massDeleteTaskThreshold;
	let massDeletePercentThreshold = getSettings().massDeletePercentThreshold;
	let massDeletePreviewCount = getSettings().massDeletePreviewCount;
	let startupSyncDelaySeconds = getSettings().startupSyncDelaySeconds;
	const dispatch = createEventDispatcher();

	function handleHeaderClick() {
		dispatch('toggle');
	}

	async function save(notice: string) {
		updateSettings({
			massDeleteGuardEnabled,
			massDeleteTaskThreshold: Number(massDeleteTaskThreshold),
			massDeletePercentThreshold: Number(massDeletePercentThreshold),
			massDeletePreviewCount: Number(massDeletePreviewCount),
			startupSyncDelaySeconds: Number(startupSyncDelaySeconds),
		});
		await plugin.saveSettings();
		new Notice(notice);
	}
</script>

<CollapsibleSection
	title="Deletion guard"
	shortDesc="Hold mass deletions and delay startup sync"
	open={open}
	on:headerClick={handleHeaderClick}
>
	<DeletionGlossary compact={true} />

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Hold mass deletions</div>
			<div class="setting-item-description">
				On by default. A sync that would delete more than the task count and more than the percent of tracked tasks,
				or any deletion while the vault scan or the TickTick full snapshot is empty and the local database is not,
				applies no deletions and leaves the checkpoint. Creates and updates still run. Turn off to restore the previous behavior.
			</div>
		</div>
		<div class="setting-item-control">
			<input
				type="checkbox"
				bind:checked={massDeleteGuardEnabled}
				on:change={async () => { await save('Deletion guard updated.'); }}
			/>
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Task count</div>
			<div class="setting-item-description">Hold when planned task deletions are more than this number. Default 10. Both this and the percent must be exceeded.</div>
		</div>
		<div class="setting-item-control">
			<input type="number" min="0" bind:value={massDeleteTaskThreshold} on:change={async () => { await save('Deletion guard updated.'); }} />
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Percent of tracked tasks</div>
			<div class="setting-item-description">Hold when planned task deletions are also more than this percent of non-deleted tasks in the local database. Default 20.</div>
		</div>
		<div class="setting-item-control">
			<input type="number" min="0" max="100" bind:value={massDeletePercentThreshold} on:change={async () => { await save('Deletion guard updated.'); }} />
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Preview count</div>
			<div class="setting-item-description">How many planned deletions the dialog lists. The report file lists all of them. Default 20.</div>
		</div>
		<div class="setting-item-control">
			<input type="number" min="1" bind:value={massDeletePreviewCount} on:change={async () => { await save('Deletion guard updated.'); }} />
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Startup sync delay (seconds)</div>
			<div class="setting-item-description">
				After the workspace layout is ready and Obsidian Sync is idle, wait this long before the first sync. Default 30. 0 skips the wait.
				Scheduled sync does not use this delay. Startup and scheduled sync never apply held deletions; they only notify.
			</div>
		</div>
		<div class="setting-item-control">
			<input type="number" min="0" bind:value={startupSyncDelaySeconds} on:change={async () => { await save('Startup sync delay updated.'); }} />
		</div>
	</div>
</CollapsibleSection>
