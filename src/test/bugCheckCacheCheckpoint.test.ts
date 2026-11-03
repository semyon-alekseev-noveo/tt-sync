/**
 * BUG-CHECK-CACHE-CHECKPOINT — getAllTasks must full-dump without advancing sync checkpoint.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('BUG-CHECK-CACHE-CHECKPOINT', () => {
	it('getAllTasks calls getTaskDetails(0, false)', () => {
		const src = readFileSync(join(__dirname, '../services/TicktickRestAPI.ts'), 'utf8');
		expect(src).toMatch(/getTaskDetails\(\s*0\s*,\s*false\s*\)/);
		expect(src).toContain('BUG-CHECK-CACHE-CHECKPOINT');
	});

	it('getTaskDetails accepts persistCheckpoint flag', () => {
		const src = readFileSync(join(__dirname, '../api/index.ts'), 'utf8');
		expect(src).toMatch(/persistCheckpoint\s*=\s*true/);
		expect(src).toMatch(/if\s*\(\s*!persistCheckpoint\s*\)/);
	});
});
