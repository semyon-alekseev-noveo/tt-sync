import { classifyFileRead, obsidianSyncFileState, vaultIndexReady, type FileTrust } from '@/sync/massDeleteGuard';
import { syncCachedRead } from '@/sync/vault-io';

/** Inline line markers only — not YAML `ticktick_id:`. */
const TASK_ID = /%%\[ticktick_id::\s*([a-zA-Z0-9]+)\]%%/gi;

/**
 * Drop leading YAML frontmatter so project-parent `ticktick_id:` (and any
 * accidental `%%…%%` inside `---`) never enter deletion-guard `presentIds`.
 * ID-PROJECT-FM-NOT-PRESENTIDS (#232 / E16).
 */
export function stripYamlFrontmatter(text: string): string {
	return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

/**
 * Collect vault line markers for the mass-delete guard index.
 * YAML FM `ticktick_id:` alone must not count — parent identity ≠ child present.
 */
export function collectLineMarkerPresentIds(text: string): Set<string> {
	const presentIds = new Set<string>();
	const body = stripYamlFrontmatter(text);
	TASK_ID.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = TASK_ID.exec(body))) {
		if (match[1]) presentIds.add(match[1]);
	}
	return presentIds;
}

export interface VaultDeletionScan {
	presentIds: Set<string>;
	trackedCount: number;
	fileText: Map<string, string>;
	untrustedFiles: Set<string>;
	incomplete: boolean;
	unreadable: string[];
	conflict: string[];
	syncPending: string[];
	skipped: string[];
}

interface MarkdownFile {
	path: string;
	stat?: { size?: number };
}

/**
 * One pass over markdown files. A failed read, a conflict copy, or a
 * sync-pending file makes the index incomplete: absence is not deletion.
 */
export async function scanVaultForDeletionGuard(app: {
	metadataCache?: { initialized?: boolean };
	workspace?: { layoutReady?: boolean };
	vault: {
		getMarkdownFiles: () => MarkdownFile[];
		cachedRead: (file: MarkdownFile) => Promise<string>;
	};
	internalPlugins?: unknown;
	sync?: unknown;
}): Promise<VaultDeletionScan> {
	const presentIds = new Set<string>();
	const fileText = new Map<string, string>();
	const untrustedFiles = new Set<string>();
	const unreadable: string[] = [];
	const conflict: string[] = [];
	const syncPending: string[] = [];
	const skipped: string[] = [];
	if (!vaultIndexReady(app)) {
		return { presentIds, trackedCount: 0, fileText, untrustedFiles, incomplete: true, unreadable, conflict, syncPending, skipped };
	}
	let incomplete = false;
	for (const file of app.vault.getMarkdownFiles()) {
		const syncState = obsidianSyncFileState(app, file);
		const pre = classifyFileRead({ path: file.path, readOk: true, syncState });
		if (pre !== 'ok') {
			mark(pre, file.path);
			continue;
		}
		let text = '';
		let readOk = true;
		try {
			const read = await syncCachedRead(app.vault, file);
			if (typeof read !== 'string') readOk = false;
			else text = read;
		} catch {
			readOk = false;
		}
		const trust = classifyFileRead({ path: file.path, readOk, syncState });
		if (trust !== 'ok') {
			mark(trust, file.path);
			continue;
		}
		fileText.set(file.path, text);
		for (const id of collectLineMarkerPresentIds(text)) presentIds.add(id);
	}
	return {
		presentIds,
		trackedCount: presentIds.size,
		fileText,
		untrustedFiles,
		incomplete,
		unreadable,
		conflict,
		syncPending,
		skipped,
	};

	function mark(trust: FileTrust, path: string): void {
		untrustedFiles.add(path);
		incomplete = true;
		if (trust === 'unreadable') unreadable.push(path);
		else if (trust === 'conflict') conflict.push(path);
		else if (trust === 'sync-pending') syncPending.push(path);
		else skipped.push(path);
	}
}
