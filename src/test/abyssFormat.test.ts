import { describe, expect, it } from 'vitest';
import { abyssLinesToNote, noteToAbyssLines, isAbyssNoteLine } from '@/abyssFormat';

describe('abyssFormat', () => {
	it('detects only non-checkbox child bullets', () => {
		expect(isAbyssNoteLine('\t- > desc', 0)).toBe(true);
		expect(isAbyssNoteLine('\t- comment', 0)).toBe(true);
		expect(isAbyssNoteLine('\t- [ ] sub', 0)).toBe(false);
		expect(isAbyssNoteLine('- > top', 0)).toBe(false);
		expect(isAbyssNoteLine('\t\t- > deep', 1)).toBe(true);
	});
	it('parses desc + comments', () => {
		expect(abyssLinesToNote(['\t- > a', '\t- > b', '\t- c1'])).toBe('a\nb\n\nComments:\nc1');
		expect(abyssLinesToNote(['\t- > only'])).toBe('only');
		expect(abyssLinesToNote(['\t- c'])).toBe('Comments:\nc');
	});
	it('round-trips', () => {
		const lines = ['\t\t- > line 1', '\t\t- >', '\t\t- > line 3', '\t\t- comment'];
		const note = abyssLinesToNote(lines);
		expect(noteToAbyssLines(note, 1)).toEqual(lines);
		expect(abyssLinesToNote(noteToAbyssLines('x\ny\n', 0))).toBe('x\ny');
	});
});
