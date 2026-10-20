/**
 * TP-NO-STALE-VIEW-READ: a file run must not replace Obsidian's vault.read.
 * A modify listener registered before the run (the open view) reads the new disk text.
 */
import { describe, expect, it } from 'vitest';
import { beginFileRun } from '@/sync/fileRunCache';

describe('TP-NO-STALE-VIEW-READ', () => {
	it('TP-NO-STALE-VIEW-READ a modify listener registered before the run reads the new disk text', async () => {
		const disk = new Map<string, string>([['n.md', 'v1']]);
		const handlers: Array<(f: unknown) => void> = [];
		const vault: Record<string, unknown> = {
			read: async (f: { path: string }) => disk.get(f.path) ?? '',
			cachedRead: async (f: { path: string }) => disk.get(f.path) ?? '',
			modify: async (f: { path: string }, d: string) => { disk.set(f.path, d); handlers.forEach(h => h(f)); },
			on: (_e: string, h: (f: unknown) => void) => { handlers.push(h); },
			off: () => undefined,
		};
		const file = { path: 'n.md' };
		let viewSaw = '';
		// "MarkdownView.onModify" registered long before the sync run
		handlers.push(async (f) => { viewSaw = await (vault.read as (f: unknown) => Promise<string>)(f); });
		const end = beginFileRun(vault);
		await (vault.read as (f: unknown) => Promise<string>)(file); // sync reads the note -> must not pin v1 for Obsidian
		// external writer (Obsidian Sync / other plugin / adapter) changes disk and fires modify
		disk.set('n.md', 'v2'); handlers.forEach(h => h(file));
		await new Promise(r => setTimeout(r, 0));
		end();
		expect(viewSaw).toBe('v2');
	});
});
