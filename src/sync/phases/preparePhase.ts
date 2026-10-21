import type { SyncPhaseDeps } from '@/sync/phases/types';

export async function runPreparePhase(deps: SyncPhaseDeps): Promise<void> {
	const { plugin, ui } = deps;
	ui.setFullStep('Preparing…');
	await plugin.applyExternalSettings();
	await plugin.checkSettingsMigration();
	await plugin.taskCache?.fill();
}
