import { describe, expect, it, vi } from 'vitest';
import { detachLine, detachInContent, isDetached, DETACH_MARK } from '@/detach';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';

vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const ID = '6acee8e26106c1614d7825ba';
const LINE = `- [/] Live task #context/work #type/next  [link](https://ticktick.com/webapp/#p/abc/tasks/${ID}) #ticktick %%[ticktick_id:: ${ID}]%% 📅 2026-10-20`;

describe('detach after TickTick deletion', () => {
	it('marks [-], strips id/link/marker, adds mark, keeps other tags & dates', () => {
		const out = detachLine(LINE, 'ticktick');
		expect(out).toBe(`- [-] Live task #context/work #type/next 📅 2026-10-20 ${DETACH_MARK}`);
		expect(detachLine(out, 'ticktick')).toBe(out); // idempotent
	});
	it('custom marker tag', () => {
		expect(detachLine('\t- [ ] x #obsidian #obsidian-notes %%[ticktick_id:: 1]%%', 'obsidian'))
			.toBe(`\t- [-] x #obsidian-notes ${DETACH_MARK}`);
	});
	it('detachInContent touches only that task, keeps child lines', () => {
		const c = ['# f', LINE, '\t- > desc', '- [ ] other #ticktick %%[ticktick_id:: zzz]%%'].join('\n');
		const out = detachInContent(c, ID, 'ticktick')!.split('\n');
		expect(isDetached(out[1])).toBe(true);
		expect(out[2]).toBe('\t- > desc');
		expect(out[3]).toContain('ticktick_id:: zzz');
		expect(detachInContent(c, 'nope', 'ticktick')).toBeNull();
	});
	it('never re-pushed: detached line is not a sync candidate even if user re-adds the marker tag', () => {
		(getSettings() as unknown as Record<string, unknown>).syncMarkerTag = 'ticktick';
		const p = new TaskParser({} as unknown, {} as unknown);
		const d = detachLine(LINE, 'ticktick');
		expect(p.hasTickTickTag(d)).toBe(false);
		expect(p.hasTickTickId(d)).toBe(false);
		expect(p.hasTickTickTag(d.replace('[-]', '[ ]') + ' #ticktick')).toBe(false);
		expect(p.hasTickTickTag(LINE)).toBe(true);
	});
});
