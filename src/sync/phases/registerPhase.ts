import type { SyncPhaseDeps } from '@/sync/phases/types';

/** Ensure every markdown vault file has a Files metadata row. */
export async function runRegisterPhase(deps: SyncPhaseDeps): Promise<void> {
	const { service, ui } = deps;
	ui.setFullStep('Scanning vault files…');
	await service.ensureVaultFilesRegistered();
}
