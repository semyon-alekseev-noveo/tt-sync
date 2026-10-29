/**
 * ID-ARCHIVE-NO-STRIP (#215 / epic #214) — vault lines under historical / archive
 * paths must not be Confirm-wiped when TickTick no longer has the id.
 *
 * Pure path heuristics (no settings import) so unit tests stay cheap.
 */

/** Normalize to forward slashes without a leading slash. */
export function normalizeVaultPath(path: string): string {
	return path.replace(/\\/g, '/').replace(/^\/+/, '');
}

/**
 * True for parked trees and common Archive / Архив folder segments
 * (e.g. `30 Tasks/399 Архив/3992 Noveo/….md`).
 */
export function isHistoricalVaultPath(filePath: string | undefined | null): boolean {
	if (!filePath) return false;
	const p = normalizeVaultPath(filePath);
	const first = p.split('/')[0] ?? '';
	if (/^zz-parked/i.test(first)) return true;
	const segments = p.split('/');
	for (const seg of segments) {
		const s = seg.trim();
		if (!s) continue;
		if (/^archive(s)?$/i.test(s)) return true;
		// RU: «Архив» or numbered GTD archive folders like «399 Архив»
		if (/архив/i.test(s)) return true;
	}
	return false;
}

/** Prefer detach / no-op over deleting checklist text when TT id is gone. */
export function shouldPreserveVaultLinesOnRemoteDelete(
	filePath: string | undefined | null,
): boolean {
	return isHistoricalVaultPath(filePath);
}
