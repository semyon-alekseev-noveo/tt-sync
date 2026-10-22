/**
 * TECH-SYNC-MODULARIZATION PR 7: sync phase orchestrator must not import Dexie.
 * Store access goes through PluginContext ports (taskRepository / fileTaskQueries / syncMeta).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const DB_IMPORT = /from\s+['"]@\/db\//;

function sourceFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...sourceFiles(path));
		} else if (entry.name.endsWith('.ts')) {
			out.push(path);
		}
	}
	return out;
}

describe('store ports — orchestrator', () => {
	it('sync/phases does not import @/db/*', () => {
		const offenders: string[] = [];
		for (const file of sourceFiles(join(SRC, 'sync/phases'))) {
			const text = readFileSync(file, 'utf8');
			if (DB_IMPORT.test(text)) {
				offenders.push(relative(process.cwd(), file));
			}
		}
		expect(offenders, `import @/db from:\n${offenders.join('\n')}`).toEqual([]);
	});
});
