<script lang="ts">
	import DeviceIdentitySection from './DeviceIdentitySection.svelte';
	import DefaultsSection from './DefaultsSection.svelte';
	import LimitSyncSection from './LimitSyncSection.svelte';
	import GtdSection from './GtdSection.svelte';
	import AutoSyncIntervalSection from './AutoSyncIntervalSection.svelte';
	import FullVaultSyncSection from './FullVaultSyncSection.svelte';
	import MassDeleteGuardSection from './MassDeleteGuardSection.svelte';
	import { settingsStore } from '@/ui/settings/settingsstore';
	import { getSettings } from '@/settings';
	import { EXTRA_FILTERS_HIDDEN_NOTE, hideExtraFilters } from '@/ui/settings/settingsUxVisibility';
	export let plugin;

	$: syncedLists =
		($settingsStore.syncedLists?.length ?? 0) > 0
			? $settingsStore.syncedLists
			: (getSettings().syncedLists ?? []);
	$: extraFiltersHidden = hideExtraFilters({ syncedLists });

	$: sections = [
		{ key: 'identity', component: DeviceIdentitySection },
		{ key: 'defaults', component: DefaultsSection },
		{ key: 'gtd', component: GtdSection },
		...(extraFiltersHidden ? [] : [{ key: 'limit', component: LimitSyncSection }]),
		{ key: 'auto', component: AutoSyncIntervalSection },
		{ key: 'guard', component: MassDeleteGuardSection },
		{ key: 'full', component: FullVaultSyncSection }
	];

	let openSection: string = 'gtd';

	function handleToggle(sectionKey: string) {
		openSection = openSection === sectionKey ? '' : sectionKey;
	}
</script>

<p class="setting-item-description" style="margin-bottom: 1em;">
	List allow-list, push scope, project scheme, and tag → list routing live under <strong>GTD and projects</strong>.
	{#if extraFiltersHidden}
		{EXTRA_FILTERS_HIDDEN_NOTE}
	{:else}
		Legacy single-list filters are under <strong>Extra filters (advanced)</strong> / Limit synchronization.
	{/if}
</p>

{#each sections as sec}
	<svelte:component
		this={sec.component}
		plugin={plugin}
		open={openSection === sec.key}
		on:toggle={() => handleToggle(sec.key)}
	/>
{/each}
