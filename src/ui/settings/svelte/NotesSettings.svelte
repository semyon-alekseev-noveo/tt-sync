<script lang="ts">
	import { parseTagMappingText, tagMappingToText } from '@/tagMapping';
	import { getDefaultFolder, updateSettings } from '@/settings';
	import type TickTickSync from '@/main';
	import './SettingsStyles.css';
	import { onMount } from 'svelte';
	import ResetTasksControl from '@/ui/settings/svelte/ResetTasksControl.svelte';
	import { settingsStore } from '@/ui/settings/settingsstore';

	export let plugin: TickTickSync;

	let isWorking: boolean = false;
	let syncNotes: boolean = false;
	let abyssTasksFormat: boolean = false;
	let abyssIndent: 'tab' | 'spaces' = 'tab';
	let scheduledAsStartDate: boolean = false;
	let tagMappingText = '';
	async function saveAbyss() {
		settingsStore.update(s => ({ ...s, abyssTasksFormat, abyssIndent, scheduledAsStartDate, tagMappings: parseTagMappingText(tagMappingText) }));
		await plugin.saveSettings();
	}
	let resetTasksText: string = '';
	$: resetTasksText = syncNotes
		? 'Get all Notes from TickTick?'
		: 'Remove all Notes from Obsidian? (This will not delete Notes in TickTick)';

	function setIsWorking(value: boolean) {
		isWorking = value;
	}

	let delimiterOption: 'none' | 'custom' = 'none';
	let customDelimiter: string = ''; // e.g., "---", "**", etc.
	let previewExample = '';
	let folderPath = $settingsStore.defaultFolderPath;

	// Load current settings on mount
	onMount(() => {
		syncNotes = $settingsStore.syncNotes;
		abyssTasksFormat = $settingsStore.abyssTasksFormat ?? false;
		abyssIndent = $settingsStore.abyssIndent ?? 'tab';
		scheduledAsStartDate = $settingsStore.scheduledAsStartDate ?? false;
		tagMappingText = tagMappingToText($settingsStore.tagMappings);
		if ($settingsStore.noteDelimiter === '' || $settingsStore.noteDelimiter == null) {
			delimiterOption = 'none';
			customDelimiter = '';
		} else {
			delimiterOption = 'custom';
			customDelimiter = $settingsStore.noteDelimiter;
		}
		updatePreview();
	});


	// Handle when option is changed
	function handleOptionChange(option: 'none' | 'custom') {
		delimiterOption = option;
		if (option === 'none') {
			customDelimiter = '';
			saveDelimiter('');
		} else if (!customDelimiter) {
			customDelimiter = '---'; // some sane default for custom input
			saveDelimiter(customDelimiter);
		}
		updatePreview();
	}

	// Save the delimiter to settings
	async function saveDelimiter(value: string) {
		settingsStore.update(s => ({ ...s, noteDelimiter: value }));
		await plugin.saveSettings();
	}

	// Handle when custom field changes
	function handleCustomChange(e: Event) {
		const input = e.target as HTMLInputElement;
		customDelimiter = input.value;
		saveDelimiter(customDelimiter);
		updatePreview();
	}

	// Example preview
	function updatePreview() {
		previewExample =
			delimiterOption === 'none'
				? '☐ Task Title \n   Note 1\n   Note 2'
				: `☐ Task Title \n   ${customDelimiter}\n   Note 1\n   Note 2\n   ${customDelimiter}`;

	}


</script>
<div class="{isWorking ? 'wait-cursor' : 'default-cursor'}">


	<div class="notes-settings ">
		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Sync Notes</div>
				<div class="setting-item-description">Synchronize Notes</div>
			</div>
			<div class="setting-item-control">
				<label class="checkbox-container" class:is-enabled={syncNotes}>
					<input
						type="checkbox"
						bind:checked={syncNotes}
						on:change={async () => {
							settingsStore.update(s => ({ ...s, syncNotes: syncNotes }));
							await plugin.saveSettings();
					  }}
					/>
				</label>
			</div>
		</div>

		{#if syncNotes}
			<div>Notes will be synchronized.</div>
			<br>
			<div class="setting-item">
				<div class="setting-item-info">
					<div class="setting-item-name">Abyss Tasks format</div>
					<div class="setting-item-description">Store notes as <code>- &gt; </code> description lines and <code>- </code> comment lines (Abyss Tasks). Overrides Note Delimiter.</div>
				</div>
				<div class="setting-item-control">
					<label class="checkbox-container" class:is-enabled={abyssTasksFormat}>
						<input type="checkbox" bind:checked={abyssTasksFormat}
							on:change={saveAbyss} />
					</label>
				</div>
			</div>
			{#if abyssTasksFormat}
			<div class="setting-item">
				<div class="setting-item-info"><div class="setting-item-name">Abyss child indent</div>
					<div class="setting-item-description">Indent written for <code>- &gt;</code>/comment lines (match Obsidian "Use tabs"). Both are read.</div></div>
				<div class="setting-item-control"><select class="dropdown" bind:value={abyssIndent} on:change={saveAbyss}>
					<option value="tab">Tab</option><option value="spaces">4 spaces</option></select></div>
			</div>
			{/if}
			<div class="setting-item">
				<div class="setting-item-info"><div class="setting-item-name">Sync ⏳ scheduled as TickTick start date</div>
					<div class="setting-item-description">When a task has ⏳ and no 🛫, ⏳ is sent as TickTick start date and comes back as ⏳.</div></div>
				<div class="setting-item-control"><label class="checkbox-container" class:is-enabled={scheduledAsStartDate}>
					<input type="checkbox" bind:checked={scheduledAsStartDate} on:change={saveAbyss} /></label></div>
			</div>
			<div class="setting-item">
				<div class="setting-item-info"><div class="setting-item-name">Tag mapping</div>
					<div class="setting-item-description">One per line: <code>obsidian/tag = ticktick-tag</code></div></div>
				<div class="setting-item-control"><textarea rows="5" bind:value={tagMappingText} on:change={saveAbyss} placeholder="type/next = next"></textarea></div>
			</div>
			<div class="setting-item delimiter-settings">
				<div class="setting-item-info">
					<div class="setting-item-name">Note Delimiter</div>
					<div class="setting-item-description">
						Choose how Notes are separated from a Task. <br>Changes will be applied on next update from
						TickTick.
					</div>
				</div>

			</div>
			<div class="setting-item delimiter-settings">
				<div class="setting-item-info">
					<select
						class="dropdown"
						bind:value={delimiterOption}
						on:change={() => handleOptionChange(delimiterOption)}
					>
						<option value="none">No delimiter</option>
						<option value="custom">Custom</option>
					</select>
					{#if delimiterOption === "custom"}
						<input
							type="text"
							placeholder="Enter delimiter (e.g., ---)"
							bind:value={customDelimiter}
							on:input={handleCustomChange}
							maxlength={61}
							style="margin-left:0.5em; width:10em"
						/>
					{/if}
					<div class="delimiter-preview">
						<p>Preview:</p>
						<span><pre>{previewExample}</pre></span>
					</div>
				</div>
			</div>
		{:else }
			<div>Notes will be not synchronized.</div>
			<br>
		{/if}

		<br>
		<ResetTasksControl
			{isWorking}
			{resetTasksText}
			{plugin}
			{setIsWorking}
		/>


	</div>
</div>
