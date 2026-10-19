import type { LocalTask } from "@/db/schema";

export type ConflictResult = {
	resolved: LocalTask;
	conflictDetected: boolean;
	winner: "local" | "remote";
};

/** TickTick `modifiedTime` when present; otherwise Dexie `updatedAt` (vault push bookkeeping). */
export function effectiveTaskRevision(lt: LocalTask): number {
	const m = lt.task?.modifiedTime;
	if (m) {
		const t = new Date(m).getTime();
		if (!Number.isNaN(t)) return t;
	}
	return lt.updatedAt ?? 0;
}

export function resolveTaskConflict(
	local: LocalTask | undefined,
	remote: LocalTask
): ConflictResult {
	if (!local) return { resolved: remote, conflictDetected: false, winner: "remote" };

	const localMs = effectiveTaskRevision(local);
	const remoteMs = effectiveTaskRevision(remote);

	if (localMs > remoteMs) {
		return { resolved: local, conflictDetected: true, winner: "local" };
	}
	if (remoteMs > localMs) {
		return {
			resolved: {
				...remote,
				localId: local.localId,
				file: local.file,
				lastVaultSync: local.lastVaultSync,
			},
			conflictDetected: true,
			winner: "remote",
		};
	}

	// Same revision: take remote body, keep vault file mapping.
	return {
		resolved: {
			...local,
			task: remote.task,
			updatedAt: remote.updatedAt,
			source: remote.source ?? local.source,
		},
		conflictDetected: true,
		winner: "remote",
	};
}
