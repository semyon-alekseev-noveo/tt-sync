import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { TaskParser } from '@/taskParser';
import { getSettings } from '@/settings';

const parser = new TaskParser({} as unknown, {} as unknown);
const ID = 'abcdefabcdefabcdefabcdef';
const idTag = `%%[ticktick_id:: ${ID}]%%`;
const IN_SCOPE = '30 Tasks/pilot.md';
const OUT_SCOPE = '40 KB/note.md';

describe('Step 4 — scope-based line sync (abyssTasksFormat)', () => {
	const base = getSettings() as Record<string, unknown>;

	beforeEach(() => {
		Object.assign(base, {
			abyssTasksFormat: true,
			syncScopeFolders: ['30 Tasks/', '10 Projects/'],
			stopInjectingTickTickTag: true,
		});
	});

	afterEach(() => {
		Object.assign(base, { abyssTasksFormat: false, syncScopeFolders: [] });
	});

	it('tracks checkbox in scope without marker or id', () => {
		expect(parser.isLineTrackedForSync('- [ ] Pilot next action #type/next', IN_SCOPE)).toBe(true);
		expect(parser.isLineTrackedForSync('- [ ]   ', IN_SCOPE)).toBe(false);
		expect(parser.isLineTrackedForSync('- [ ] Outside', OUT_SCOPE)).toBe(false);
	});

	it('tracks id-only line in scope without #ticktick', () => {
		expect(parser.isLineTrackedForSync(`- [ ] Task ${idTag}`, IN_SCOPE)).toBe(true);
	});

	it('legacy mode still requires marker for new lines', () => {
		Object.assign(base, { abyssTasksFormat: false });
		expect(parser.isLineTrackedForSync('- [ ] No marker', IN_SCOPE)).toBe(false);
		expect(parser.isLineTrackedForSync('- [ ] a #ticktick', IN_SCOPE)).toBe(true);
	});
});
