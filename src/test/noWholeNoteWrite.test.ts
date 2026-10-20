/**
 * TP-NO-WHOLE-NOTE-WRITE: a note that may be open is written only through commitVaultText.
 * Journal jsonl and new-file creates are not whole-note overwrites; see the test name's allowlist.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');

/** The helper is the only place that calls vault.process on a note. */
const ALLOW_FILE = new Set(['src/services/vaultWrite.ts']);

const RULES: { name: string; re: RegExp }[] = [
	{ name: 'vault.modify', re: /vault\.modify\s*\(/ },
	{ name: 'vault.process', re: /vault\.process\s*\(/ },
	{ name: 'adapter.write', re: /adapter\.write\s*\(/ },
	{ name: 'editor.setValue', re: /editor\.setValue\s*\(/ },
];

function sourceFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'test') continue;
			out.push(...sourceFiles(path));
		} else if (entry.name.endsWith('.ts')) {
			out.push(path);
		}
	}
	return out;
}

describe('TP-NO-WHOLE-NOTE-WRITE', () => {
	it('has no direct whole-note writes outside commitVaultText', () => {
		const hits: string[] = [];
		for (const file of sourceFiles(SRC)) {
			const rel = relative(process.cwd(), file).replaceAll('\\', '/');
			if (ALLOW_FILE.has(rel)) continue;
			const lines = readFileSync(file, 'utf8').split('\n');
			lines.forEach((line, index) => {
				const trimmed = line.trim();
				if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
				for (const rule of RULES) {
					if (rule.re.test(line)) hits.push(`${rel}:${index + 1} ${rule.name}`);
				}
			});
		}
		expect(hits).toEqual([]);
	});
});
