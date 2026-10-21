/**
 * TP-NO-WHOLE-NOTE-WRITE: a note that may be open is written only through commitVaultText.
 * Journal jsonl and new-file creates are not whole-note overwrites.
 * Vault method reassignment is allowed only in the redo wrapper. It does not wrap read.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');

/**
 * Files that may use a named API. `*` allows every rule.
 * writeTrace appends a debug jsonl and wraps setViewData only while the setting is on.
 * deletionGuardRun opens a report, not a note overwrite.
 */
const ALLOW: Record<string, Set<string>> = {
	'src/services/vaultWrite.ts': new Set(['*']),
	'src/redo/obsidian.ts': new Set(['vault-assign', 'method-assign']),
	'src/sync/deletionGuardRun.ts': new Set(['openFile']),
	'src/services/writeTrace.ts': new Set(['setViewData', 'adapter-append']),
};

const RULES: { name: string; re: RegExp }[] = [
	{ name: 'vault.modify', re: /vault\s*\.\s*modify\s*\(/ },
	{ name: 'vault.process', re: /vault\s*\.\s*process\s*\(/ },
	{ name: 'vault.append', re: /vault\s*\.\s*append\s*\(/ },
	{ name: 'vault.modifyBinary', re: /vault\s*\.\s*modifyBinary\s*\(/ },
	{ name: 'adapter.write', re: /adapter\s*\.\s*write\s*\(/ },
	{ name: 'adapter.process', re: /adapter\s*\.\s*process\s*\(/ },
	{ name: 'adapter-append', re: /adapter\s*\.\s*append\s*\(/ },
	{ name: 'editor.setValue', re: /editor\s*\.\s*setValue\s*\(/ },
	{ name: 'processFrontMatter', re: /processFrontMatter\s*\(/ },
	{ name: 'editor.transaction', re: /(?<!db)\.transaction\s*\(/ },
	{ name: 'replaceRange', re: /\.replaceRange\s*\(/ },
	{ name: 'replaceSelection', re: /\.replaceSelection\s*\(/ },
	{ name: 'setViewData', re: /setViewData\s*(?:\(|=)/ },
	{ name: 'openFile', re: /\.openFile\s*\(/ },
	{ name: 'vault-assign', re: /\.vault\s*(?:\.\s*\w+|\[[^\]]*\])\s*=(?!=)/ },
	{ name: 'method-assign', re: /\bv\s*(?:\.\s*(?:read|cachedRead|modify|process|create|delete|trash|rename|append)|\[[^\]]*\])\s*=(?!=)/ },
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

/** Drop comments but keep newlines so a match still maps to a source line. */
function stripComments(src: string): string {
	let out = '';
	let i = 0;
	while (i < src.length) {
		if (src.startsWith('//', i)) {
			while (i < src.length && src[i] !== '\n') i++;
			continue;
		}
		if (src.startsWith('/*', i)) {
			const end = src.indexOf('*/', i + 2);
			const chunk = src.slice(i, end === -1 ? src.length : end + 2);
			out += chunk.replace(/[^\n]/g, ' ');
			i = end === -1 ? src.length : end + 2;
			continue;
		}
		out += src[i];
		i++;
	}
	return out;
}

function lineAt(src: string, index: number): number {
	let line = 1;
	for (let i = 0; i < index && i < src.length; i++) if (src[i] === '\n') line++;
	return line;
}

describe('TP-NO-WHOLE-NOTE-WRITE', () => {
	it('has no direct whole-note writes outside commitVaultText', () => {
		const hits: string[] = [];
		for (const file of sourceFiles(SRC)) {
			const rel = relative(process.cwd(), file).replaceAll('\\', '/');
			const allow = ALLOW[rel];
			const stripped = stripComments(readFileSync(file, 'utf8'));
			for (const rule of RULES) {
				if (allow?.has('*') || allow?.has(rule.name)) continue;
				const flags = rule.re.flags.includes('g') ? rule.re.flags : `${rule.re.flags}g`;
				const re = new RegExp(rule.re.source, flags);
				let match: RegExpExecArray | null;
				while ((match = re.exec(stripped))) {
					hits.push(`${rel}:${lineAt(stripped, match.index)} ${rule.name}`);
					if (match.index === re.lastIndex) re.lastIndex++;
				}
			}
		}
		expect(hits).toEqual([]);
	});
});
