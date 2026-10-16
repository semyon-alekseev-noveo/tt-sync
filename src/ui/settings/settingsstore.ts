import type TickTickSync from '@/main';
import { type Writable, writable } from 'svelte/store';
import { type ITickTickSyncSettings, setSettings, settings } from '@/settings';

// New: keep a reference to the plugin instance
let currentPlugin: TickTickSync | null = null;

export let settingsStore: Writable<ITickTickSyncSettings>;

// Call from plugin setup (after loadSettings, when opening the settings tab)
export function settingsLoad(plugin: TickTickSync) {
	currentPlugin = plugin;

	if (settingsStore) {
		settingsStore.update(() => ({ ...settings }));
		return;
	}

	const { subscribe, set: svelteSet, update: svelteUpdate } = writable({ ...settings });

	// Helper to update settings/module/plugin objects
	function syncAll(newSettings: ITickTickSyncSettings) {
		// Update the module-level variable
		Object.assign(settings, newSettings);
		// Also update the plugin instance if available
		if (currentPlugin) {
			setSettings(settings);
		}
	}

	settingsStore = {
		subscribe,
		update: (updater) => {
			svelteUpdate(current => {
				const updated = updater(current);
				syncAll(updated);
				return updated;
			});
		},
		set: (value: ITickTickSyncSettings) => {
			svelteSet(value);
			syncAll(value);
			currentPlugin?.saveSettings()?.catch((e) => {
				console.error('settingsStore.set: saveSettings failed', e);
			});
		},
	};
}

/** Re-sync Svelte store after async loadSettings (tab may register before load finishes). */
export function refreshSettingsStore(): void {
	if (settingsStore) {
		settingsStore.update(() => ({ ...settings }));
	}
}
