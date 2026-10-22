/**
 * TECH-CIRC-1: services (and sync helpers they own) must not import `@/main`.
 * They take {@link PluginContext} from `@/pluginContext` instead.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const MAIN_IMPORT = /from\s+['"]@\/main['"]/;

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

const SCOPES = [
	'services',
	'sync/phases',
	'sync/lifecycle',
	'sync/vault-io',
	'fileOperation.ts',
	'taskParser.ts',
	'pluginContext.ts',
];

describe('TECH-CIRC-1 PluginContext', () => {
	it('services and sync helpers do not import @/main', () => {
		const offenders: string[] = [];
		for (const scope of SCOPES) {
			const abs = join(SRC, scope);
			const files = scope.endsWith('.ts') ? [abs] : sourceFiles(abs);
			for (const file of files) {
				const text = readFileSync(file, 'utf8');
				if (MAIN_IMPORT.test(text)) {
					offenders.push(relative(process.cwd(), file));
				}
			}
		}
		expect(offenders, `import @/main from:\n${offenders.join('\n')}`).toEqual([]);
	});
});
