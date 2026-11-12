/**
 * AF-FMT-OFF-LIST-MOVE (#306) — structure-move gate.
 * With the Abyss config present and `abyssTasksFormat` OFF, vault task lines
 * must stay in place (no structure move) — OFF never relocates vault lines.
 */
import { describe, expect, it } from 'vitest';
import { abyssLineInPlace } from '@/syncScope';

describe('AF-FMT-OFF-LIST-MOVE (#306) — structure move gate', () => {
	it('keeps the vault line in place while the Abyss config is present and abyssTasksFormat is OFF', () => {
		expect(
			abyssLineInPlace({
				newTasksFile: '',
				abyssTasksFormat: false,
				projectSchemeEnabled: true,
				syncScopeFolders: ['10 Projects'],
			}),
		).toBe(true);
	});

	it('keeps the vault line in place when hub mode (newTasksFile) is set', () => {
		expect(
			abyssLineInPlace({
				newTasksFile: 'notes/tasks.md',
				abyssTasksFormat: false,
				projectSchemeEnabled: false,
				syncScopeFolders: [],
			}),
		).toBe(true);
	});

	it('keeps the vault line in place when abyssTasksFormat is ON', () => {
		expect(
			abyssLineInPlace({
				newTasksFile: '',
				abyssTasksFormat: true,
				projectSchemeEnabled: true,
				syncScopeFolders: ['10 Projects'],
			}),
		).toBe(true);
	});

	it('allows the structure move in classic mode (no Abyss config)', () => {
		expect(
			abyssLineInPlace({
				newTasksFile: '',
				abyssTasksFormat: false,
				projectSchemeEnabled: false,
				syncScopeFolders: [],
			}),
		).toBe(false);
	});
});
