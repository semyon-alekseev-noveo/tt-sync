import { describe, expect, it } from 'vitest';
import {
	appendContextTags,
	isInjectedContextTag,
	isVaultContextTagMirror,
	noteContextTagFromPath,
	projectContextTagFromPath,
	slugForContextTag,
	stripInjectedContextTags,
} from '@/contextTags';

describe('contextTags', () => {
	it('slugifies note basenames', () => {
		expect(slugForContextTag('log-202601271650.md')).toBe('log-202601271650');
		expect(slugForContextTag('TTS-PILOT- Phase C test')).toBe('tts-pilot-phase-c-test');
	});

	it('builds prefixed tags', () => {
		expect(noteContextTagFromPath('40 KB/46 Logs/log-202601271650.md')).toBe('note/log-202601271650');
		expect(projectContextTagFromPath('10 Projects/TTS-PILOT- Phase C test.md')).toBe('proj/tts-pilot-phase-c-test');
	});

	it('appends note and project tags without duplicate when same file', () => {
		const path = '10 Projects/Foo.md';
		expect(appendContextTags([], { filePath: path, projectNotePath: path })).toEqual(['note/foo']);
	});

	it('CTX-D1: strips mirrored vault tags before append (BUG-TAG-1)', () => {
		const path = '10 Projects/Foo.md';
		expect(appendContextTags(['note-foo', 'note/foo'], { filePath: path })).toEqual(['note/foo']);
		expect(appendContextTags(['proj-bar', 'obsidian'], { filePath: 'x.md', projectNotePath: '10 Projects/Bar.md' }))
			.toEqual(['obsidian', 'note/x', 'proj/bar']);
	});

	it('appends both when task file differs from project MOC', () => {
		const tags = appendContextTags(['obsidian'], {
			filePath: '40 KB/46 Logs/log-202601271650.md',
			projectNotePath: '10 Projects/DON-218.md',
		});
		expect(tags).toContain('note/log-202601271650');
		expect(tags).toContain('proj/don-218');
		expect(tags).toContain('obsidian');
	});

	it('strips injected tags on pull', () => {
		expect(isInjectedContextTag('note/foo')).toBe(true);
		expect(isInjectedContextTag('proj/bar')).toBe(true);
		expect(isInjectedContextTag('obsidian')).toBe(false);
		expect(stripInjectedContextTags(['inbox', 'note/x', 'proj/y'])).toEqual(['inbox']);
	});

	it('CTX-D2 (mirror detect): flat and slash vault mirrors (BUG-TAG-1)', () => {
		expect(isVaultContextTagMirror('note/foo')).toBe(true);
		expect(isVaultContextTagMirror('note-foo')).toBe(true);
		expect(isVaultContextTagMirror('proj/bar')).toBe(true);
		expect(isVaultContextTagMirror('project-bar')).toBe(false);
		expect(isVaultContextTagMirror('inbox')).toBe(false);
	});
});
