/**
 * BUG-OPENNOTE-DELETE-CONFIRM — deleting a marked line while editing must not
 * open Sync discrepancies Confirm (PushDeleteTT). Deletions wait for Synchronize.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('BUG-OPENNOTE-DELETE-CONFIRM', () => {
	it('EventHandlerService does not call deletedTaskCheck on Delete/Backspace', () => {
		const src = readFileSync(join(__dirname, '../services/EventHandlerService.ts'), 'utf8');
		expect(src).toMatch(/BUG-OPENNOTE-DELETE-CONFIRM/);
		expect(src).not.toMatch(/deletedTaskCheck\s*\(/);
		// Legacy keyup Delete/Backspace must stay gone (would Confirm mid-edit).
		expect(src).not.toMatch(/\[\s*['"]Delete['"]\s*,\s*['"]Backspace['"]\s*\]/);
		expect(src).not.toMatch(/\[\s*['"]Backspace['"]\s*,\s*['"]Delete['"]\s*\]/);
	});

	it('open-note push path does not call checkFileForDeletedTasks', () => {
		const svc = readFileSync(join(__dirname, '../services/index.ts'), 'utf8');
		const pushFn = svc.match(
			/async pushSettledActiveFile[\s\S]*?(?=\n\tasync |\n\t[a-zA-Z]+\()/,
		)?.[0];
		expect(pushFn).toBeTruthy();
		expect(pushFn!).toContain('Updating open note');
		expect(pushFn!).toContain('checkFileForModifications');
		expect(pushFn!).not.toContain('checkFileForDeletedTasks');
		expect(pushFn!).not.toContain('deletedTaskCheck');
	});
});
