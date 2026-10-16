/**
 * R1 / AC-9 / test A6: a line is "synced" when it carries the marker (#ticktick),
 * or the vault-born source tag #obsidian together with a ticktick_id.
 */
import { describe, expect, it } from 'vitest';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';

const parser = new TaskParser({} as unknown, {} as unknown);
const ID = 'abcdefabcdefabcdefabcdef';
const idTag = `%%[ticktick_id:: ${ID}]%%`;

describe('TaskParser.hasTickTickTag', () => {
	it('accepts the #ticktick marker, with or without an id', () => {
		expect(parser.hasTickTickTag('- [ ] a #ticktick')).toBe(true);
		expect(parser.hasTickTickTag(`- [ ] a #ticktick ${idTag}`)).toBe(true);
	});

	it('accepts #obsidian when the line has a ticktick_id (A6)', () => {
		expect(parser.hasTickTickTag(`- [ ] a #obsidian ${idTag}`)).toBe(true);
		expect(parser.hasTickTickTag(`\t- [x] a #type/next #OBSIDIAN ${idTag}`)).toBe(true);
	});

	it('does not treat #obsidian without an id as synced (new vault lines need the marker)', () => {
		expect(parser.hasTickTickTag('- [ ] a #obsidian')).toBe(false);
	});

	it('isLineTrackedForSync accepts id-only lines in scope when abyssTasksFormat', () => {
		Object.assign((getSettings() as unknown as Record<string, unknown>), {
			abyssTasksFormat: true,
			syncScopeFolders: ['30 Tasks/'],
		});
		expect(parser.isLineTrackedForSync(`- [ ] a ${idTag}`, '30 Tasks/x.md')).toBe(true);
		Object.assign((getSettings() as unknown as Record<string, unknown>), { abyssTasksFormat: false });
		expect(parser.isLineTrackedForSync(`- [ ] a ${idTag}`, '30 Tasks/x.md')).toBe(false);
	});

	it('ignores lookalike tags and non-task lines', () => {
		expect(parser.hasTickTickTag(`- [ ] a #obsidian-notes ${idTag}`)).toBe(false);
		expect(parser.hasTickTickTag(`- [ ] a #obsidian/x ${idTag}`)).toBe(false);
		expect(parser.hasTickTickTag(`- [ ] a ${idTag}`)).toBe(false);
		expect(parser.hasTickTickTag(`plain #obsidian ${idTag}`)).toBe(false);
	});
});
