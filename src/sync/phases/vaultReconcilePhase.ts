import type { SyncPhaseDeps } from '@/sync/phases/types';
import { syncNotebooksToVault } from '@/sync/notebookVault';

/** Apply Dexie task state onto vault task lines (VaultSyncCoordinator). */
export async function runVaultReconcilePhase(deps: SyncPhaseDeps): Promise<void> {
	const { plugin, ui } = deps;
	ui.setFullStep('Updating vault task lines…');
	await plugin.vaultSyncCoordinator.syncVaultWithDatabase();
	ui.setFullStep('Updating Notebook folder…');
	await syncNotebooksToVault(plugin.app, plugin);
}
