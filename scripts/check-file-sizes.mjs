#!/usr/bin/env node
/**
 * #66 / #31 DoD: warn (or fail with --strict) when a production src .ts file
 * exceeds 30 KB without an entry in docs/file-size.exceptions.json.
 *
 * Usage:
 *   node scripts/check-file-sizes.mjs
 *   node scripts/check-file-sizes.mjs --strict
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT = 30 * 1024;
const exceptionsPath = join(root, 'docs/file-size.exceptions.json');
const strict = process.argv.includes('--strict');

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (entry.isDirectory()) {
			// Tests may be large fixtures; DoD targets production modules.
			if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'test') continue;
			walk(p, out);
		} else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
			out.push(p);
		}
	}
	return out;
}

if (!existsSync(exceptionsPath)) {
	console.error(`Missing ${exceptionsPath}`);
	process.exit(1);
}

const exceptions = JSON.parse(readFileSync(exceptionsPath, 'utf8'));
const allowed = new Set((exceptions.files ?? []).map((f) => f.path));

const offenders = [];
const stale = [];
for (const abs of walk(join(root, 'src'))) {
	const rel = relative(root, abs).replaceAll('\\', '/');
	const size = statSync(abs).size;
	if (size > LIMIT && !allowed.has(rel)) {
		offenders.push({ path: rel, size });
	}
}
for (const entry of exceptions.files ?? []) {
	const abs = join(root, entry.path);
	if (!existsSync(abs) || statSync(abs).size <= LIMIT) {
		stale.push(entry.path);
	}
}

if (stale.length) {
	console.warn(`file-size exceptions no longer needed (file ≤ ${LIMIT} B or missing):`);
	for (const p of stale) console.warn(`  - ${p}`);
}

if (offenders.length) {
	console.error(`src/**/*.ts over ${LIMIT} B without docs/file-size.exceptions.json entry:`);
	for (const o of offenders) console.error(`  ${o.path} (${o.size} B)`);
	process.exit(strict ? 1 : 0);
}

if (stale.length && strict) {
	console.error('Shrink docs/file-size.exceptions.json (stale entries).');
	process.exit(1);
}

console.log(`File sizes OK (limit ${LIMIT} B; ${allowed.size} exception(s)).`);
