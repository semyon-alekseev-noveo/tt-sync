/**
 * NOTE-BODY-2 — TT task body → Abyss `- >` on pull.
 * Live fail root cause: after pull, Dexie `content` is already remote, so
 * `__baseContent` from loadTaskById made mergeAbyssBlock keep the vault `- >`.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { mergeAbyssBlock } from '@/abyssFormat';
import {
	clearPreMergeNoteBase,
	rememberPreMergeNoteBase,
	takePreMergeNoteBase,
} from '@/sync/preMergeNoteBase';

describe('NOTE-BODY-2 Abyss TT→vault body pull', () => {
	beforeEach(() => clearPreMergeNoteBase());

	it('NOTE-BODY-2: without pre-merge base, Dexie-new content keeps vault - > (bug shape)', () => {
		const gen = '- [ ] T %%[ticktick_id:: abcdefabcdefabcdefabcdef]%%\n\t- > note-body-2-from-tt';
		const old = ['\t- > note-body-1-marker'];
		// Same mistake persist made: base === new remote content already in Dexie.
		const out = mergeAbyssBlock(gen, old, 'note-body-2-from-tt');
		expect(out).toContain('note-body-1-marker');
		expect(out).not.toContain('note-body-2-from-tt');
	});

	it('NOTE-BODY-2: pre-merge base (pre-pull Dexie content) lets TT body replace Abyss - >', () => {
		const taskId = '6adf040a0000000000004bdf';
		rememberPreMergeNoteBase(taskId, 'note-body-1-marker');
		const base = takePreMergeNoteBase(taskId) ?? 'note-body-2-from-tt';
		const gen = '- [ ] T %%[ticktick_id:: abcdefabcdefabcdefabcdef]%%\n\t- > note-body-2-from-tt';
		const old = ['\t- > note-body-1-marker'];
		const out = mergeAbyssBlock(gen, old, base);
		expect(out).toContain('- > note-body-2-from-tt');
		expect(out).not.toContain('note-body-1-marker');
	});

	it('NOTE-BODY-2: pre-merge map is consumed once', () => {
		rememberPreMergeNoteBase('a', 'old');
		expect(takePreMergeNoteBase('a')).toBe('old');
		expect(takePreMergeNoteBase('a')).toBeUndefined();
	});
});
