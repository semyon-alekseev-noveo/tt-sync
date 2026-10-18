import { describe, it, expect } from 'vitest';
import { pickProjectNote, isBlankTitle } from '@/projectScheme';
import { TaskParser } from '@/taskParser';

describe('fool cases', () => {
	it('project link shadowed by same-named note resolves to project note', () => {
		expect(pickProjectNote('Pilot A', ['10 Projects/Pilot A.md', '10 Projects/Pilot B.md'])).toBe('10 Projects/Pilot A.md');
		expect(pickProjectNote('10 Projects/Pilot A', ['10 Projects/Pilot A.md'])).toBe('10 Projects/Pilot A.md');
		expect(pickProjectNote('Missing', ['10 Projects/Pilot A.md'])).toBeUndefined();
		expect(pickProjectNote('X', ['10 Projects/a/X.md', '10 Projects/b/X.md'])).toBeUndefined();
	});
	it('blank titles are detected', () => {
		expect(isBlankTitle('')).toBe(true);
		expect(isBlankTitle('  #ticktick #type/next ')).toBe(true);
		expect(isBlankTitle(' [fool/F1.md](obsidian://open?vault=x&file=fool%2FF1.md)')).toBe(true);
		expect(isBlankTitle('Learn C# basics')).toBe(false);
		expect(isBlankTitle('🚀')).toBe(false);
	});
	it('an empty wiki-link bullet is not a checkbox', () => {
		const p = new TaskParser({} as never, {} as never);
		expect(p.isMarkdownTask('- [[]]')).toBe(false);
		expect(p.isMarkdownTask('- [ ] call')).toBe(true);
		expect(p.isMarkdownTask('- [x] call')).toBe(true);
		expect(p.isMarkdownTask('- [/] call')).toBe(true);
	});
});
