import { describe, it, expect } from 'vitest';
import { idsPresentInVault } from '@/utils/vaultIdScan';
it('finds ids already written in notes', async () => {
	const texts: Record<string, string> = { 'a.md': 'x %%[ticktick_id:: id1]%%', 'b.md': 'nothing' };
	const app = { vault: { getMarkdownFiles: () => Object.keys(texts).map(path => ({ path })), cachedRead: async (f: { path: string }) => texts[f.path] } };
	expect([...await idsPresentInVault(app as never, ['id1', 'id2'])]).toEqual([['id1', 'a.md']]);
});
