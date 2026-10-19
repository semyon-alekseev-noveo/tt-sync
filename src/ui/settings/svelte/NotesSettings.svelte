<script lang="ts">
	import { parseTagMappingText, tagMappingToText } from '@/tagMapping';
	import { parseStatusMappingText, statusMappingToText } from '@/statusMapping';
	import { parseProjectMappingText, projectMappingToText } from '@/projectMapping';
	import { getSettings } from '@/settings';
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
	let syncNoteContextTags: boolean = true;
	let scheduledAsStartDate: boolean = false;
	let tagMappingText = '';
	let statusMappingText = '';
	let projectMappingText = '';
	let onTickTickDeletion: 'ask' | 'cancel' = 'ask';
	let autoCleanupDatabase = false;
	let notesHydrated = false;

	$: schemeEnabled = $settingsStore.projectSchemeEnabled ?? getSettings().projectSchemeEnabled ?? false;

	async function saveFormat() {
		if (!notesHydrated || !plugin.settingsReady) return;
		settingsStore.update(s => ({
			...s,
			abyssTasksFormat,
			abyssIndent,
			syncNoteContextTags,
			scheduledAsStartDate,
			tagMappings: parseTagMappingText(tagMappingText),
			statusMappings: parseStatusMappingText(statusMappingText),
			projectMappings: parseProjectMappingText(projectMappingText),
			onTickTickDeletion,
			autoCleanupDatabase,
		}));
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
	let customDelimiter: string = '';
	let previewExample = '';

	onMount(() => {
		syncNotes = $settingsStore.syncNotes;
		abyssTasksFormat = $settingsStore.abyssTasksFormat ?? false;
		abyssIndent = $settingsStore.abyssIndent ?? 'tab';
		syncNoteContextTags = $settingsStore.syncNoteContextTags ?? true;
		scheduledAsStartDate = $settingsStore.scheduledAsStartDate ?? false;
		tagMappingText = tagMappingToText($settingsStore.tagMappings);
		statusMappingText = statusMappingToText($settingsStore.statusMappings);
		projectMappingText = projectMappingToText($settingsStore.projectMappings);
		onTickTickDeletion = $settingsStore.onTickTickDeletion ?? 'ask';
		autoCleanupDatabase = $settingsStore.autoCleanupDatabase ?? false;
		if ($settingsStore.noteDelimiter === '' || $settingsStore.noteDelimiter == null) {
			delimiterOption = 'none';
			customDelimiter = '';
		} else {
			delimiterOption = 'custom';
			customDelimiter = $settingsStore.noteDelimiter;
		}
		updatePreview();
		notesHydrated = true;
	});

	$: if (!notesHydrated && plugin.settingsReady) {
		syncNotes = $settingsStore.syncNotes;
		abyssTasksFormat = $settingsStore.abyssTasksFormat ?? false;
		abyssIndent = $settingsStore.abyssIndent ?? 'tab';
		syncNoteContextTags = $settingsStore.syncNoteContextTags ?? true;
		scheduledAsStartDate = $settingsStore.scheduledAsStartDate ?? false;
		tagMappingText = tagMappingToText($settingsStore.tagMappings);
		statusMappingText = statusMappingToText($settingsStore.statusMappings);
		projectMappingText = projectMappingToText($settingsStore.projectMappings);
		onTickTickDeletion = $settingsStore.onTickTickDeletion ?? 'ask';
		autoCleanupDatabase = $settingsStore.autoCleanupDatabase ?? false;
		notesHydrated = true;
	}

	function handleOptionChange(option: 'none' | 'custom') {
		delimiterOption = option;
		if (option === 'none') {
			customDelimiter = '';
			saveDelimiter('');
		} else if (!customDelimiter) {
			customDelimiter = '---';
			saveDelimiter(customDelimiter);
		}
		updatePreview();
	}

	async function saveDelimiter(value: string) {
		settingsStore.update(s => ({ ...s, noteDelimiter: value }));
		await plugin.saveSettings();
	}

	function handleCustomChange(e: Event) {
		const input = e.target as HTMLInputElement;
		customDelimiter = input.value;
		saveDelimiter(customDelimiter);
		updatePreview();
	}

	function updatePreview() {
		previewExample =
			delimiterOption === 'none'
				? '☐ Task Title \n   Note 1\n   Note 2'
				: `☐ Task Title \n   ${customDelimiter}\n   Note 1\n   Note 2\n   ${customDelimiter}`;
	}
</script>
<div class="{isWorking ? 'wait-cursor' : 'default-cursor'}">
	<div class="notes-settings">
		<p class="setting-item-description" style="margin-bottom: 1em;">
			How task lines and note bodies look in Obsidian. List allow-list, tag → list routing, and project scheme are
			in <strong>Sync Control → GTD and projects</strong>.
		</p>

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Sync Notes</div>
				<div class="setting-item-description">Pull task descriptions from TickTick into vault lines.</div>
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

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">On TickTick deletion</div>
				<div class="setting-item-description">
					Ask (confirmation dialog) or mark the line cancelled <code>[-]</code> and detach it from sync.
				</div>
			</div>
			<div class="setting-item-control">
				<select class="dropdown" bind:value={onTickTickDeletion} on:change={saveFormat}>
					<option value="ask">Ask</option>
					<option value="cancel">Mark cancelled &amp; detach</option>
				</select>
			</div>
		</div>

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Auto clean up database</div>
				<div class="setting-item-description">Forget files deleted from the vault without asking.</div>
			</div>
			<div class="setting-item-control">
				<label class="checkbox-container" class:is-enabled={autoCleanupDatabase}>
					<input type="checkbox" bind:checked={autoCleanupDatabase} on:change={saveFormat} />
				</label>
			</div>
		</div>

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Sync ⏳ scheduled as TickTick start date</div>
				<div class="setting-item-description">
					When a task has ⏳ and no 🛫, ⏳ is sent as TickTick start date and comes back as ⏳.
				</div>
			</div>
			<div class="setting-item-control">
				<label class="checkbox-container" class:is-enabled={scheduledAsStartDate}>
					<input type="checkbox" bind:checked={scheduledAsStartDate} on:change={saveFormat} />
				</label>
			</div>
		</div>

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Abyss Tasks format</div>
				<div class="setting-item-description">
					Store notes as <code>- &gt; </code> description lines and <code>- </code> comment lines. Overrides
					note delimiter when enabled.
				</div>
			</div>
			<div class="setting-item-control">
				<label class="checkbox-container" class:is-enabled={abyssTasksFormat}>
					<input type="checkbox" bind:checked={abyssTasksFormat} on:change={saveFormat} />
				</label>
			</div>
		</div>

		{#if abyssTasksFormat}
			<div class="setting-item">
				<div class="setting-item-info">
					<div class="setting-item-name">Note / project context tags</div>
					<div class="setting-item-description">
						Push <code>note/&lt;file&gt;</code> and <code>proj/&lt;moc&gt;</code> to TickTick for filter views (like Abyss source note). Not written on the Obsidian line.
					</div>
				</div>
				<div class="setting-item-control">
					<label class="checkbox-container" class:is-enabled={syncNoteContextTags}>
						<input type="checkbox" bind:checked={syncNoteContextTags} on:change={saveFormat} />
					</label>
				</div>
			</div>
			<div class="setting-item">
				<div class="setting-item-info">
					<div class="setting-item-name">Abyss child indent</div>
					<div class="setting-item-description">
						Indent for <code>- &gt;</code>/comment lines (match Obsidian "Use tabs").
					</div>
				</div>
				<div class="setting-item-control">
					<select class="dropdown" bind:value={abyssIndent} on:change={saveFormat}>
						<option value="tab">Tab</option>
						<option value="spaces">4 spaces</option>
					</select>
				</div>
			</div>
			<div class="setting-item">
				<div class="setting-item-info">
					<div class="setting-item-name">Status mapping</div>
					<div class="setting-item-description">
						Checkbox char = TickTick tag, e.g. <code>/ = status/in-progress</code>
					</div>
				</div>
				<div class="setting-item-control">
					<textarea rows="4" bind:value={statusMappingText} on:change={saveFormat}></textarea>
				</div>
			</div>
		{/if}

		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Tag mapping</div>
				<div class="setting-item-description">Obsidian tag → TickTick tag name, one per line.</div>
			</div>
			<div class="setting-item-control">
				<textarea
					rows="5"
					bind:value={tagMappingText}
					on:change={saveFormat}
					placeholder="obsidian/tag = ticktick-tag"
				></textarea>
			</div>
		</div>

		{#if !schemeEnabled}
			<div class="setting-item">
				<div class="setting-item-info">
					<div class="setting-item-name">Project mapping (legacy)</div>
					<div class="setting-item-description">
						Note or folder → TickTick list. Not used when <strong>project scheme</strong> is on (configure in
						GTD and projects).
					</div>
				</div>
				<div class="setting-item-control">
					<textarea rows="4" bind:value={projectMappingText} on:change={saveFormat}></textarea>
				</div>
			</div>
		{/if}

		{#if syncNotes && !abyssTasksFormat}
			<div class="setting-item delimiter-settings">
				<div class="setting-item-info">
					<div class="setting-item-name">Note delimiter</div>
					<div class="setting-item-description">
						Separator between task title and note lines (next TickTick update).
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
					{#if delimiterOption === 'custom'}
						<input
							type="text"
							placeholder="e.g. ---"
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
		{/if}

		<br />
		<ResetTasksControl {isWorking} {resetTasksText} {plugin} {setIsWorking} />
	</div>
</div>
