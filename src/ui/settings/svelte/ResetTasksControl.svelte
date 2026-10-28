<script lang="ts">
	import { resetTasks } from '@/ui/settings/utils/ResetSynchronization';
	import {
		RESET_CONTROL_LABEL,
		RESET_VAULT_TT_INTACT_COPY,
	} from '@/ui/settings/settingsUxCopy';
	export let isWorking: boolean;
	export let plugin;
	export let setIsWorking: (val: boolean) => void;

	let showResetModal = false;
	let modalWorking = false;

	async function onReset() {
		showResetModal = true;
		modalWorking = false;
	}
	function closeModal() {
		if (!modalWorking) showResetModal = false;
	}
	async function confirmReset() {
		modalWorking = true;
		try {
			await resetTasks(plugin, setIsWorking);
		} finally {
			showResetModal = false;
			modalWorking = false;
		}
	}
</script>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">{RESET_CONTROL_LABEL}</div>
		<div class="setting-item-description">
			{RESET_VAULT_TT_INTACT_COPY}
			<br>
			<em>
				Use before restoring a TickTick account backup (instead of deleting IndexedDB in DevTools).
			</em>
		</div>
	</div>
	<div class="setting-item-control">
		<button
			disabled={isWorking}
			class="mod-warning"
			on:click={onReset}>
			{RESET_CONTROL_LABEL}
		</button>
	</div>
</div>

{#if showResetModal}
	<div
		class="local-modal-backdrop"
		role="button"
		tabindex="0"
		on:click={modalWorking ? undefined : closeModal}
		on:keydown={(e) => { if (!modalWorking && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); closeModal(); } }}
		aria-label="Close"
		style={modalWorking ? 'cursor: wait;' : ''}
	></div>
	<div
		class="local-modal-dialog"
		role="dialog"
		aria-modal="true"
		style={modalWorking ? 'cursor: wait;' : ''}
	>
		<div class="local-modal-content">
			<h2>Confirm reset</h2>
			<p>
				Clear the <strong>local sync cache</strong> (task links, maps, checkpoint)?
			</p>
			<p style="color:var(--text-warning);">
				<em>
					{RESET_VAULT_TT_INTACT_COPY}
					After this, restore TickTick if needed, then Synchronize for a clean re-link.
					Mass-delete guards still protect an empty local DB.
				</em>
			</p>
			<div class="local-modal-actions">
				<button class="mod-cta"
					on:click={confirmReset}
					disabled={modalWorking}>
					{modalWorking ? 'Clearing…' : 'Yes, clear local DB'}
				</button>
				<button
					style="margin-left:1em;"
					on:click={closeModal}
					disabled={modalWorking}
				>
					No, cancel
				</button>
			</div>
		</div>
	</div>
{/if}
