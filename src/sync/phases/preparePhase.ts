import type { SyncPhaseDeps } from '@/sync/phases/types';
import { clearPreMergeNoteBase } from '@/sync/preMergeNoteBase';

export async function runPreparePhase(deps: SyncPhaseDeps): Promise<void> {
	const { plugin, ui } = deps;
	ui.setFullStep('Preparing…');
	clearPreMergeNoteBase();
	await plugin.applyExternalSettings();
	await plugin.checkSettingsMigration();
	await plugin.taskCache?.fill();
}
