<script lang="ts">
	import CollapsibleSection from '@/ui/settings/svelte/sections/CollapsibleSection.svelte'
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';
	import { Notice } from 'obsidian';
	import { TAGS_BEHAVIOR } from '@/ui/settings/svelte/constants.svelte.js';
	import { settingsStore } from '@/ui/settings/settingsstore';
	import { getSettings } from '@/settings';

	export let open = false;
	export let plugin;

	let projects: Array<{ id: string; name: string }> = [];
	let myProjectsOptions: Record<string, string> = {};
	let selectedSyncProject = '';
	let tagAndOr: number = 1;
	$: tagAndOrString = tagAndOr.toString();

	const dispatch = createEventDispatcher();

	function handleHeaderClick() {
		dispatch('toggle');
	}

	type SyncExplanationData = {
		project?: string,
		tag?: string,
		andOr?: boolean
	};

	$: selectedSyncProject = $settingsStore.SyncProject ?? '';
	$: tagAndOr = $settingsStore.tagAndOr ?? 1;
	$: gtdListsActive = ($settingsStore.syncedLists?.length ?? 0) > 0 || (getSettings().syncedLists?.length ?? 0) > 0;
	$: sectionTitle = gtdListsActive ? 'Extra filters (advanced)' : 'Limit synchronization';
	$: sectionShortDesc = gtdListsActive
		? 'Legacy filters within allow-listed lists'
		: 'Single list / tag filter (legacy)';

	async function handleSyncProjectChange(value: string) {
		settingsStore.update((s) => ({ ...s, SyncProject: value }));
		selectedSyncProject = value;

		if (!value) {
			await plugin.saveSettings();
			return;
		}

		const fileMetaData = await plugin.fileMetadataService?.getAllFileMetadata() ?? {};
		const defaultProjectFileEntry = Object.values(fileMetaData).find(
			(obj: any) => obj.defaultProjectId === value
		);
		if (!defaultProjectFileEntry) {
			const noticeMsg = `Did not find a default Project File for Project ${
				myProjectsOptions?.[value]
			}. Please create a file and set its default to this project, or select a file to be the default for this project.`;
			new Notice(noticeMsg, 5000);
		}
		await plugin.saveSettings();
	}
	async function handleTagAndOrChange(value: string) {
		const num = parseInt(value);
		settingsStore.update((s) => ({ ...s, tagAndOr: num }));
		tagAndOr = num;
		await plugin.saveSettings();
	}

	let syncExplanationData: SyncExplanationData = {};

	function updateSyncExplanationData(myProjectsOptions: Record<string, string>) {
		const project = myProjectsOptions[$settingsStore.SyncProject];
		const tag = $settingsStore.SyncTag;
		const andOr = (project && tag) ? ($settingsStore.tagAndOr == 1) : undefined;

		syncExplanationData = { project, tag, andOr };
	}

	$: updateSyncExplanationData(myProjectsOptions);

	function getMyProjectsOptions() {
		return projects.reduce((obj, item) => {
			obj[item.id] = item.name;
			return obj;
		}, {} as Record<string, string>);
	}

	onMount(async () => {
		projects = await plugin.service.getProjects?.() ?? [];
		myProjectsOptions = getMyProjectsOptions();
		selectedSyncProject = $settingsStore.SyncProject ?? '';
		tagAndOr = $settingsStore.tagAndOr ?? 1;
		updateSyncExplanationData(myProjectsOptions);
	});
</script>

<CollapsibleSection
	title={sectionTitle}
	shortDesc={sectionShortDesc}
	open={open}
	on:headerClick={handleHeaderClick}
>
	{#if gtdListsActive}
		<div class="setting-item-description">
			Ticked lists in <strong>GTD and projects</strong> control what is pulled. <strong>Sync tag</strong> is
			there too. Use this section only for the legacy single-list <code>SyncProject</code> filter or AND/OR
			combining with that tag — not as a second allow-list.
		</div>
	{:else}
		<div class="setting-item-description">
			Legacy mode: pick one TickTick list and/or set <strong>Sync tag</strong> under
			<strong>GTD and projects</strong> (recommended). Prefer ticking lists in GTD instead of a single project
			here.
		</div>
	{/if}

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Legacy sync project (single list)</div>
			<div class="setting-item-description">
				{#if gtdListsActive}
					Disabled while synced lists are configured. Clear synced lists in GTD to use this dropdown again.
				{:else}
					Only tasks in this list are synchronized (old behavior). Use GTD list checkboxes instead.
				{/if}
			</div>
		</div>
		<div class="setting-item-control">
			<select
				class="dropdown"
				id="sync-project"
				bind:value={selectedSyncProject}
				disabled={gtdListsActive}
				on:change={(e: Event) => {
				handleSyncProjectChange((e.target as HTMLSelectElement).value);
				updateSyncExplanationData(myProjectsOptions);}}
			>
				<option value="">(none)</option>
				{#each Object.entries(myProjectsOptions) as [id, name]}
					<option value={id}>{name}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if selectedSyncProject && ($settingsStore.SyncTag ?? '').trim()}
		<div class="setting-item">
			<div class="setting-item-info">
				<div class="setting-item-name">Tag behavior (with legacy project)</div>
				<div class="setting-item-description">How sync tag and legacy project combine.</div>
			</div>
			<div class="setting-item-control">
				<select
					class="dropdown"
					id="tag-and-or"
					bind:value={tagAndOrString}
					on:change={(e: Event) => {
					handleTagAndOrChange((e.target as HTMLSelectElement).value);
					updateSyncExplanationData(myProjectsOptions);}}
				>
					{#each Object.entries(TAGS_BEHAVIOR) as [num, label]}
						<option value={num}>{label}</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}

	<div class="sync-explanation">
		{#if gtdListsActive && !syncExplanationData.project}
			<p>
				Allow-list active ({($settingsStore.syncedLists ?? []).length} list(s)).
				{#if syncExplanationData.tag}
					Within those lists, only tasks tagged <b>#{syncExplanationData.tag}</b> are pulled.
				{:else}
					No sync tag — all tasks in ticked lists (within push scope) may be pulled.
				{/if}
			</p>
		{:else if !syncExplanationData.project && !syncExplanationData.tag}
			<p>No extra filter.</p>
		{:else if syncExplanationData.project && !syncExplanationData.tag}
			<p>Only tasks in <b>{syncExplanationData.project}</b> will be synchronized</p>
		{:else if !syncExplanationData.project && syncExplanationData.tag}
			<p>Only tasks tagged with <b>#{syncExplanationData.tag}</b> (within allow-list if GTD lists are set)</p>
		{:else if syncExplanationData.andOr}
			<p>
				Only tasks in <b>{syncExplanationData.project}</b> AND tagged with <b>#{syncExplanationData.tag}</b>
			</p>
		{:else}
			<p>
				Tasks in <b>{syncExplanationData.project}</b> OR tagged with <b>#{syncExplanationData.tag}</b>
			</p>
		{/if}
	</div>

</CollapsibleSection>
