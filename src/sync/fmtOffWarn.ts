/**
 * AF-FMT-OFF-WARN (R1 of the FMT-OFF matrix, #201): a manual Synchronize while
 * `abyssTasksFormat` is OFF but the Abyss config is present must confirm ONCE per
 * session — OFF is a lossy migration, not a mode switch
 * (`docs/pilot/ABYSS-FORMAT-OFF-MATRIX.md`, accepted 2026-11-22).
 * Scheduled/reactive paths are deliberately NOT gated (no background modals).
 */
import { App, Modal, Setting } from 'obsidian';
import { getSettings } from '@/settings';

export const FMT_OFF_WARN_TITLE = 'Abyss format is OFF — syncing now re-syncs in classic mode';
export const FMT_OFF_WARN_BODY =
	'While the Abyss config (project scheme + status→list + push scope) is present and the format flag is off: symbols follow the status → list map, but bodies under checkboxes may detach, tags rewrite, and list stubs can reappear. Recommended: turn the flag back on, or read docs/pilot/LEAVING-ABYSS-MODE first.';
export const FMT_OFF_WARN_SYNC_ANYWAY = 'Sync anyway';
export const FMT_OFF_WARN_CANCEL = 'Cancel';

export interface FmtOffWarnSettingsSlice {
	abyssTasksFormat?: boolean | null;
	projectSchemeEnabled?: boolean | null;
	statusListMappings?: readonly unknown[] | null;
	syncScopeFolders?: readonly string[] | null;
}

/** True = Abyss config present + flag OFF = classic sync would reshape data. */
export function fmtOffWarnPredicate(s: FmtOffWarnSettingsSlice): boolean {
	if (s.abyssTasksFormat) return false;
	if (!s.projectSchemeEnabled) return false;
	const hasMap = Array.isArray(s.statusListMappings) && s.statusListMappings.length > 0;
	const hasScope = Array.isArray(s.syncScopeFolders) && s.syncScopeFolders.some(f => !!f?.trim());
	return hasMap && hasScope;
}

let confirmedThisSession = false;

/** Test hook: the session memory must start clean in every case. */
export function resetFmtOffWarnSessionForTest(): void {
	confirmedThisSession = false;
}

type Ask = () => Promise<boolean>;

function openModal(app: App): Promise<boolean> {
	return new Promise(resolve => {
		const modal = new Modal(app);
		modal.titleEl.setText(FMT_OFF_WARN_TITLE);
		modal.contentEl.createEl('p', { text: FMT_OFF_WARN_BODY });
		new Setting(modal.contentEl)
			.addButton(btn =>
				btn
					.setButtonText(FMT_OFF_WARN_SYNC_ANYWAY)
					.setCta()
					.onClick(() => {
						modal.close();
						resolve(true);
					}),
			)
			.addButton(btn =>
				btn.setButtonText(FMT_OFF_WARN_CANCEL).onClick(() => {
					modal.close();
					resolve(false);
				}),
			);
		// Dismissing via Esc must not silently proceed; a settled promise ignores the late resolve.
		modal.on('close', () => resolve(false));
		modal.open();
	});
}

/**
 * Manual Synchronize entry points call this before running.
 * Returns true = proceed. Accept is remembered for the session; Cancel/esc is not.
 */
export async function confirmFmtOffSyncBeforeRun(
	app: App,
	hooks?: { predicate?: (s: FmtOffWarnSettingsSlice) => boolean; ask?: Ask },
): Promise<boolean> {
	const predicate = hooks?.predicate ?? fmtOffWarnPredicate;
	if (!predicate(getSettings())) return true;
	if (confirmedThisSession) return true;
	const ask = hooks?.ask ?? (() => openModal(app));
	const ok = await ask();
	if (ok) confirmedThisSession = true;
	return ok;
}
