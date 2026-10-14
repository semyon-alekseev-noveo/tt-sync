import { describe, it, expect } from 'vitest';
import { stripFileLinks } from '@/projectScheme';

describe('stripFileLinks', () => {
	it('removes appended Obsidian file link from title', () => {
		expect(stripFileLinks('Pilot B [00 Inbox/TickTick.md](obsidian://open?vault=test-vault&file=00%20Inbox/TickTick.md)')).toBe('Pilot B');
	});
	it('does not double links on repeated append', () => {
		const url = '[a.md](obsidian://open?vault=v&file=a.md)';
		expect(stripFileLinks(`T ${url}`) + ' ' + url).toBe(`T ${url}`);
	});
	it('keeps normal brackets and links', () => {
		expect(stripFileLinks('Read [docs](https://x.y) [x]')).toBe('Read [docs](https://x.y) [x]');
	});
});
