import { describe, it, expect, vi } from 'vitest';
vi.mock('obsidian', () => { class TFile { constructor(public path: string, public stat: { mtime: number }) {} } return { TFile }; });
import { TFile } from 'obsidian';
import { editedSince } from '@/utils/editedSince';

describe('editedSince (pre-pull push of vault edits)', () => {
	it('returns only files modified after the last sync', () => {
		const F = TFile as unknown as new (p: string, s: { mtime: number }) => unknown;
		const files: Record<string, unknown> = { 'a.md': new F('a.md', { mtime: 200 }), 'b.md': new F('b.md', { mtime: 50 }) };
		const app = { vault: { getAbstractFileByPath: (p: string) => files[p] ?? null } } as never;
		expect(editedSince(app, ['a.md', 'b.md', 'gone.md'], 100)).toEqual(['a.md']);
	});
});
