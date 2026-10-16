<script lang="ts">
	import DeviceIdentitySection from './DeviceIdentitySection.svelte';
	import DefaultsSection from './DefaultsSection.svelte';
	import LimitSyncSection from './LimitSyncSection.svelte';
	import GtdSection from './GtdSection.svelte';
	import AutoSyncIntervalSection from './AutoSyncIntervalSection.svelte';
	import FullVaultSyncSection from './FullVaultSyncSection.svelte';
	export let plugin;

	const sections = [
		{ key: 'identity', component: DeviceIdentitySection },
		{ key: 'defaults', component: DefaultsSection },
		{ key: 'gtd', component: GtdSection },
		{ key: 'limit', component: LimitSyncSection },
		{ key: 'auto', component: AutoSyncIntervalSection },
		{ key: 'full', component: FullVaultSyncSection }
	];

	let openSection: string = 'gtd';

	function handleToggle(sectionKey: string) {
		openSection = openSection === sectionKey ? '' : sectionKey;
	}
</script>

<p class="setting-item-description" style="margin-bottom: 1em;">
	List allow-list, push scope, project scheme, and tag → list routing live under <strong>GTD and projects</strong>.
	Legacy single-list filters are under <strong>Extra filters (advanced)</strong> when you use synced lists.
</p>

{#each sections as sec}
	<svelte:component
		this={sec.component}
		plugin={plugin}
		open={openSection === sec.key}
		on:toggle={() => handleToggle(sec.key)}
	/>
{/each}
