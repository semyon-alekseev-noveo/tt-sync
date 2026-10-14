import { describe, expect, it, vi } from 'vitest';
import { abyssLinesToNote, noteToAbyssLines, isAbyssNoteLine, childIndent } from '@/abyssFormat';
import { mapObsidianTag, mapTickTickTag, parseTagMappingText, tagMappingToText } from '@/tagMapping';
import { DateMan } from '@/dateMan';
import { getSettings } from '@/settings';
import type { ITask } from '@/api/types/Task';

vi.mock('@/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

// Realistic block as written by Abyss Tasks 2.1.0 (TaskBlockEditor: `- > ` descriptions,
// `- <stamp>: ` comments with `  ` continuation, `- [ ]` subtasks, vault indent unit).
const TAB_BLOCK = [
	'- [/] Подготовить отчёт #type/next #context/work ⏫ ⏳ 2026-10-15 📅 2026-10-20 #ticktick %%[ticktick_id:: 6700aaaabbbbccccdddd0001]%%',
	'\t- > Квартальный отчёт для клиента',
	'\t- > Источник: [[projects/Клиент]]',
	'\t- 2026-10-14 09:12: созвонился,',
	'\t  ждём цифры',
	'\t- [ ] собрать данные',
	'\t- [x] шаблон',
];
const SPACE_BLOCK = TAB_BLOCK.map(l => l.replace(/^\t/, '    '));

function collect(block: string[]) {
	const out: string[] = [];
	for (let j = 1; j < block.length && isAbyssNoteLine(block[j], block[0]); j++) out.push(block[j]);
	return out;
}

describe('abyss note block', () => {
	for (const [name, block] of [['tabs', TAB_BLOCK], ['4 spaces', SPACE_BLOCK]] as const) {
		it(`collects descriptions+comments, stops at subtasks (${name})`, () => {
			const lines = collect(block);
			expect(lines).toHaveLength(4);
			expect(abyssLinesToNote(lines)).toBe(
				'Квартальный отчёт для клиента\nИсточник: [[projects/Клиент]]\n\nComments:\n2026-10-14 09:12: созвонился,\n  ждём цифры');
		});
		it(`round-trips byte-for-byte (${name})`, () => {
			const lines = collect(block);
			const ind = childIndent(0, name === 'tabs' ? 'tab' : 'spaces');
			expect(noteToAbyssLines(abyssLinesToNote(lines), ind)).toEqual(lines);
		});
	}
	it('nested task under a subtask', () => {
		const parent = '\t- [ ] child task %%[ticktick_id:: x]%%';
		expect(isAbyssNoteLine('\t\t- > nested desc', parent)).toBe(true);
		expect(isAbyssNoteLine('\t- > sibling', parent)).toBe(false);
		expect(noteToAbyssLines('d', childIndent(1, 'tab'))).toEqual(['\t\t- > d']);
	});
	it('note written in TickTick without header becomes descriptions; empty lines kept', () => {
		expect(noteToAbyssLines('a\n\nb\n', '\t')).toEqual(['\t- > a', '\t- >', '\t- > b']);
		expect(abyssLinesToNote(['\t- > a', '\t- >', '\t- > b'])).toBe('a\n\nb');
	});
	it('comments only', () => {
		expect(abyssLinesToNote(['\t- c'])).toBe('Comments:\nc');
		expect(noteToAbyssLines('Comments:\nc', '\t')).toEqual(['\t- c']);
	});
});

describe('tag mapping', () => {
	const map = parseTagMappingText('type/next = next\n#context/work = work\nbad line');
	it('parses table', () => {
		expect(map).toEqual([{ obsidian: 'type/next', ticktick: 'next' }, { obsidian: 'context/work', ticktick: 'work' }]);
		expect(parseTagMappingText(tagMappingToText(map))).toEqual(map);
	});
	it('maps both ways, case-insensitive, unmapped → undefined', () => {
		expect(mapObsidianTag('#Type/Next', map)).toBe('next');
		expect(mapTickTickTag('WORK', map)).toBe('context/work');
		expect(mapObsidianTag('type/someday', map)).toBeUndefined();
		expect(mapTickTickTag('x', undefined)).toBeUndefined();
	});
});

describe('⏳ scheduled ↔ TickTick startDate', () => {
	const iso = '2026-10-15T00:00:00.000+0000';
	const due = '2026-10-20T00:00:00.000+0000';
	it('pull: startDate becomes ⏳ when line had no 🛫', () => {
		(getSettings() as unknown as Record<string, unknown>).scheduledAsStartDate = true;
		const t = { id: '1', isAllDay: true, dueDate: due, startDate: iso } as unknown as ITask;
		new DateMan().addDateHolderToTask(t, undefined);
		expect(t.dateHolder?.scheduled_date?.emoji).toBe('⏳');
		expect(t.dateHolder?.startDate).toBeFalsy();
	});
	it('pull: line that used 🛫 keeps 🛫', () => {
		(getSettings() as unknown as Record<string, unknown>).scheduledAsStartDate = true;
		const old = { dateHolder: { startDate: { isoDate: iso, emoji: '🛫' } } } as unknown as ITask;
		const t = { id: '1', isAllDay: true, dueDate: due, startDate: iso } as unknown as ITask;
		new DateMan().addDateHolderToTask(t, old);
		expect(t.dateHolder?.startDate?.emoji).toBe('🛫');
		expect(t.dateHolder?.scheduled_date).toBeFalsy();
	});
	it('off: upstream behaviour (startDate stays 🛫)', () => {
		(getSettings() as unknown as Record<string, unknown>).scheduledAsStartDate = false;
		const t = { id: '1', isAllDay: true, dueDate: due, startDate: iso } as unknown as ITask;
		new DateMan().addDateHolderToTask(t, undefined);
		expect(t.dateHolder?.startDate?.emoji).toBe('🛫');
	});
});
