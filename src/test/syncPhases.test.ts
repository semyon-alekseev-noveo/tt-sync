import { describe, it, expect, vi } from 'vitest';
import { createSyncRunContext } from '@/sync/SyncRunContext';
import {
	runPreparePhase,
	runRegisterPhase,
	runVaultReconcilePhase,
	runSyncFilesPhase,
	runSubtasksPhase,
} from '@/sync/phases';
import type { SyncPhaseDeps } from '@/sync/phases/types';

function mockDeps(overrides: Partial<SyncPhaseDeps> = {}): SyncPhaseDeps {
	const ctx = createSyncRunContext({ trigger: 'manual', fullSync: false });
	const ui = { setFullStep: vi.fn() };
	const plugin = {
		applyExternalSettings: vi.fn(async () => undefined),
		checkSettingsMigration: vi.fn(async () => undefined),
		taskCache: { fill: vi.fn(async () => undefined) },
		vaultSyncCoordinator: { syncVaultWithDatabase: vi.fn(async () => undefined) },
	};
	const service = {
		ensureVaultFilesRegistered: vi.fn(async () => undefined),
		syncFiles: vi.fn(async () => undefined),
		pullSubtaskOrder: vi.fn(async () => undefined),
	};
	return {
		plugin: plugin as unknown as SyncPhaseDeps['plugin'],
		service: service as unknown as SyncPhaseDeps['service'],
		ui: ui as unknown as SyncPhaseDeps['ui'],
		ctx,
		...overrides,
	};
}

describe('sync phases (PR 1 extract smoke)', () => {
	it('runPreparePhase fills cache and applies settings', async () => {
		const deps = mockDeps();
		await runPreparePhase(deps);
		expect(deps.plugin.applyExternalSettings).toHaveBeenCalled();
		expect(deps.plugin.checkSettingsMigration).toHaveBeenCalled();
		expect(deps.plugin.taskCache?.fill).toHaveBeenCalled();
	});

	it('runRegisterPhase scans vault files via service', async () => {
		const deps = mockDeps();
		await runRegisterPhase(deps);
		expect(deps.service.ensureVaultFilesRegistered).toHaveBeenCalled();
	});

	it('runVaultReconcilePhase delegates to VaultSyncCoordinator', async () => {
		const deps = mockDeps();
		await runVaultReconcilePhase(deps);
		expect(deps.plugin.vaultSyncCoordinator.syncVaultWithDatabase).toHaveBeenCalled();
	});

	it('runSyncFilesPhase sets UI step then runs the file pass', async () => {
		const deps = mockDeps({
			plugin: {
				applyExternalSettings: vi.fn(),
				checkSettingsMigration: vi.fn(),
				taskCache: { fill: vi.fn() },
				vaultSyncCoordinator: { syncVaultWithDatabase: vi.fn() },
				fileMetadataService: {
					getAllFileMetadata: vi.fn(async () => null),
				},
				app: { vault: { getMarkdownFiles: () => [] } },
			} as never,
		});
		await runSyncFilesPhase(deps);
		expect(deps.ui.setFullStep).toHaveBeenCalledWith('Syncing project notes…');
	});

	it('runSubtasksPhase uses ctx.locallyEdited', async () => {
		const deps = mockDeps();
		deps.ctx.locallyEdited.add('note.md');
		await runSubtasksPhase(deps);
		expect(deps.service.pullSubtaskOrder).toHaveBeenCalledWith(deps.ctx.locallyEdited);
	});
});
