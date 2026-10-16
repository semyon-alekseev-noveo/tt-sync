<script lang="ts">
	import CollapsibleSection from '@/ui/settings/svelte/sections/CollapsibleSection.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { Notice } from 'obsidian';
	import { settingsStore } from '@/ui/settings/settingsstore';
	import { isListAllowed, lineListToText, parseLineList } from '@/syncScope';
	import { projectsVersion } from '@/projectsVersion';
	import { parseTagListText, tagListToText } from '@/listMapping';

	export let open = false;
	export let plugin;

	const dispatch = createEventDispatcher();
	function handleHeaderClick() {
		dispatch('toggle');
	}

	let lists: Array<{ id: string; name: string }> = [];
	let listsError = '';
	let listsLoading = false;
	let reloadAgain = false;
	let mounted = false;
	let tasksFolder = '';
	let scopeText = '';
	let projectsFolder = '';
	let projectsListName = '';
	let newTasksFile = '';
	let projectTemplatePath = '';
	let tagListText = '';

	$: syncedLists = $settingsStore.syncedLists ?? [];
	$: schemeEnabled = $settingsStore.projectSchemeEnabled ?? false;
	// entries that match no known list (typo / renamed list): shown so they can be fixed in data.json
	$: unknownEntries = lists.length ? syncedLists.filter(e => !lists.some(l => isListAllowed([e], l))) : [];
	// the checkbox list is built from the TickTick project cache, which is filled by a login: reload when the token changes
	$: token = $settingsStore.token;
	$: if (mounted && token) void refreshLists();
	// plugin start / login finished filling the list cache
	$: if (mounted && $projectsVersion) void refreshLists();

	/** Fill the text inputs from the store. Done synchronously first, so a failing list fetch can never leave
	 *  empty inputs that a later edit would write back over the saved settings. */
	function loadFields() {
		const s = $settingsStore;
		tasksFolder = s.TickTickTasksFilePath ?? '/';
		scopeText = lineListToText(s.syncScopeFolders);
		projectsFolder = s.projectsFolder ?? '';
		projectsListName = s.projectsListName ?? '';
		newTasksFile = s.newTasksFile ?? '';
		projectTemplatePath = s.projectTemplatePath ?? '';
		tagListText = tagListToText(s.tagListMappings);
	}

	async function refreshLists() {
		if (listsLoading) { reloadAgain = true; return; } // cache refilled while loading: run once more after
		listsLoading = true;
		reloadAgain = false;
		listsError = '';
		try {
			const projects = await plugin?.service?.getProjects?.();
			if (!projects) throw new Error('TickTick is not connected yet (login at plugin start did not finish or failed).');
			lists = projects.slice().sort((a, b) => a.name.localeCompare(b.name));
		} catch (e) {
			// keep the previous lists and never touch the saved selection
			listsError = e instanceof Error ? e.message : String(e);
		} finally {
			listsLoading = false;
			if (reloadAgain) void refreshLists();
		}
	}

	onMount(() => {
		loadFields();
		mounted = true; // triggers the first refreshLists() when logged in
		if (!$settingsStore.token) void refreshLists();
	});

	async function save(patch: Record<string, unknown>) {
		if (!mounted) return; // never write before the inputs reflect the store
		settingsStore.update(s => ({ ...s, ...patch }));
		await plugin.saveSettings();
	}

	async function toggleList(list: { id: string; name: string }, checked: boolean) {
		const rest = syncedLists.filter(e => !isListAllowed([e], list));
		await save({ syncedLists: checked ? [...rest, list.name] : rest });
	}

	// one field per save: editing one input must never rewrite the others
	const saveTasksFolder = () => save({ TickTickTasksFilePath: tasksFolder.trim() || '/' });
	const saveScope = () => save({ syncScopeFolders: parseLineList(scopeText) });
	const saveProjectsFolder = () => save({ projectsFolder: projectsFolder.trim() });
	const saveProjectsListName = () => save({ projectsListName: projectsListName.trim() || 'Projects' });
	const saveNewTasksFile = () => save({ newTasksFile: newTasksFile.trim() });
	const saveProjectTemplate = () => save({ projectTemplatePath: projectTemplatePath.trim() });
	const saveTagList = () => save({ tagListMappings: parseTagListText(tagListText) });

	async function toggleScheme(e: Event) {
		await save({ projectSchemeEnabled: (e.target as HTMLInputElement).checked });
	}

	async function applySafeDefaults() {
		await save({
			automaticSynchronizationInterval: 0,
			enableFullVaultSync: false,
			fileLinksInTickTick: 'noLink',
			taskLinksInObsidian: 'noLink',
			stopInjectingTickTickTag: true,
		});
		plugin.reloadInterval?.();
		new Notice('Safe GTD defaults applied: no auto sync, no links in titles, no ticktick tag pushed.');
	}

	async function copyConfig() {
		const s = $settingsStore;
		const cfg = {
			TickTickTasksFilePath: s.TickTickTasksFilePath,
			syncedLists: s.syncedLists,
			syncScopeFolders: s.syncScopeFolders,
			projectsFolder: s.projectsFolder,
			projectsListName: s.projectsListName,
			projectSchemeEnabled: s.projectSchemeEnabled,
			tagListMappings: s.tagListMappings,
			newTasksFile: s.newTasksFile,
			projectTemplatePath: s.projectTemplatePath,
		};
		await navigator.clipboard.writeText(JSON.stringify(cfg, null, 2));
		new Notice('GTD settings copied as JSON.');
	}
</script>

<CollapsibleSection
	title="GTD and projects"
	shortDesc="Which lists and folders sync, project notes, tag → list"
	open={open}
	on:headerClick={handleHeaderClick}
>
	<div class="setting-item-description">
		Nothing is pulled from TickTick until you tick at least one list below. Lists that are not ticked get no
		file in your vault.
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Synced lists</div>
			<div class="setting-item-description">
				TickTick lists pulled into the vault (each gets a file in the tasks folder, created on the next
				sync). Matched by list name. If you rename a list in TickTick, tick it again. If the project scheme is
				on, the Projects list must be ticked too.
			</div>
		</div>
		<div class="setting-item-control" style="flex-direction: column; align-items: flex-start;">
			{#each lists as list}
				<label style="display:block">
					<input
						type="checkbox"
						checked={syncedLists.some(e => isListAllowed([e], list))}
						on:change={(e) => toggleList(list, (e.target as HTMLInputElement).checked)}
					/>
					{list.name}
				</label>
			{/each}
			{#if listsError}
				<div class="setting-item-description" style="color: var(--text-error)">
					Could not load TickTick lists: {listsError} Your saved selection is unchanged.
				</div>
			{:else if !lists.length && !listsLoading}
				<div class="setting-item-description">No lists yet. Lists load automatically after login at plugin start (set username and password in the Access Control tab, or log in there once); your saved selection is kept.</div>
			{/if}
			<button on:click={refreshLists} disabled={listsLoading}>Reload lists</button>
			{#if unknownEntries.length}
				<div class="setting-item-description">Not found in TickTick: {unknownEntries.join(', ')}</div>
			{/if}
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Tasks folder</div>
			<div class="setting-item-description">
				Folder for list files, e.g. <code>30 Tasks/TickTick</code>. <code>/</code> = vault root. Existing files
				are not moved (use "Move Existing Files" in Defaults).
			</div>
		</div>
		<div class="setting-item-control">
			<input type="text" bind:value={tasksFolder} on:change={saveTasksFolder} placeholder="30 Tasks/TickTick" />
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Push scope folders</div>
			<div class="setting-item-description">
				One folder per line (prefix match, e.g. <code>00 Inbox/</code>). Lines outside these folders are never
				sent to TickTick. Empty = no restriction. The tasks folder and projects folder always count.
			</div>
		</div>
		<div class="setting-item-control">
			<textarea rows="4" bind:value={scopeText} on:change={saveScope} placeholder="00 Inbox/&#10;10 Projects/"></textarea>
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Project scheme</div>
			<div class="setting-item-description">
				Notes tagged <code>system/project</code> in the projects folder ↔ parent tasks in the projects list.
			</div>
		</div>
		<div class="setting-item-control">
			<label class="checkbox-container" class:is-enabled={schemeEnabled}>
				<input type="checkbox" checked={schemeEnabled} on:change={toggleScheme} />
			</label>
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Projects folder</div>
			<div class="setting-item-description">Where project notes live, e.g. <code>10 Projects</code>.</div>
		</div>
		<div class="setting-item-control">
			<input type="text" bind:value={projectsFolder} on:change={saveProjectsFolder} placeholder="10 Projects" />
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Projects list name</div>
			<div class="setting-item-description">TickTick list whose root tasks are projects.</div>
		</div>
		<div class="setting-item-control">
			<input type="text" bind:value={projectsListName} on:change={saveProjectsListName} placeholder="Projects" />
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Project note template</div>
			<div class="setting-item-description">
				Optional note used for projects created from TickTick, e.g. <code>60 templates/MOC.md</code>.
				Templater prompts and blocks are skipped; title and id are filled. Empty = built-in template.
			</div>
		</div>
		<div class="setting-item-control">
			<input type="text" bind:value={projectTemplatePath} on:change={saveProjectTemplate} placeholder="60 templates/MOC.md" />
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Tag → list mapping</div>
			<div class="setting-item-description">
				One per line: <code>type/next = nextAction</code>. The tag decides the TickTick list; moving the task
				in TickTick rewrites the tag.
			</div>
		</div>
		<div class="setting-item-control">
			<textarea rows="4" bind:value={tagListText} on:change={saveTagList} placeholder="type/next = nextAction"></textarea>
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Single tasks file (hub mode)</div>
			<div class="setting-item-description">
				Optional. Every list is written to this one file, e.g. <code>30 Tasks/TickTick/Tasks.md</code>; no
				per-list files. Empty = one file per list.
			</div>
		</div>
		<div class="setting-item-control">
			<input type="text" bind:value={newTasksFile} on:change={saveNewTasksFile} placeholder="" />
		</div>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Safe defaults</div>
			<div class="setting-item-description">
				No automatic sync, no full-vault sync, no file links in TickTick titles, no <code>ticktick</code> tag
				pushed to TickTick. Does not touch your lists.
			</div>
		</div>
		<div class="setting-item-control">
			<button on:click={applySafeDefaults}>Apply safe defaults</button>
			<button on:click={copyConfig}>Copy GTD settings (JSON)</button>
		</div>
	</div>
</CollapsibleSection>
