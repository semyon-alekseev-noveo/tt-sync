#!/usr/bin/env node
/**
 * CI guard for #66 / #31 DoD: madge circular imports may only shrink.
 *
 * Usage:
 *   node scripts/check-import-cycles.mjs           # compare to allowlist
 *   node scripts/check-import-cycles.mjs --write   # regenerate allowlist
 *
 * Many listed cycles are type-level (PluginContext import type). They still
 * count so the allowlist can only shrink when edges are removed.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const allowlistPath = join(root, 'docs/import-cycles.allowlist.json');

function fingerprint(cycle) {
	return [...cycle].sort().join(' | ');
}

function loadCycles() {
	let raw = '';
	try {
		raw = execFileSync(
			'npx',
			['madge', '--circular', '--extensions', 'ts', '--ts-config', 'tsconfig.json', '--json', 'src/'],
			{ cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
		);
	} catch (err) {
		// madge exits 1 when any cycle exists; JSON is still on stdout.
		raw = err?.stdout ?? '';
		if (!raw) throw err;
	}
	const parsed = JSON.parse(raw);
	const cycles = Array.isArray(parsed) ? parsed : parsed.circular ?? [];
	return cycles.map((c) => [...c]);
}

const write = process.argv.includes('--write');
const cycles = loadCycles();
const fps = [...new Set(cycles.map(fingerprint))].sort();

if (write) {
	writeFileSync(
		allowlistPath,
		JSON.stringify(
			{
				generatedBy: 'scripts/check-import-cycles.mjs',
				note: 'Allowlist may only shrink. Remove an entry after breaking that cycle; never add without updating this note in the PR.',
				count: fps.length,
				cycles: fps,
			},
			null,
			'\t',
		) + '\n',
	);
	console.log(`Wrote ${fps.length} cycles to ${allowlistPath}`);
	process.exit(0);
}

if (!existsSync(allowlistPath)) {
	console.error(`Missing ${allowlistPath}. Run: node scripts/check-import-cycles.mjs --write`);
	process.exit(1);
}

const allowed = JSON.parse(readFileSync(allowlistPath, 'utf8'));
const allowSet = new Set(allowed.cycles ?? []);
const currentSet = new Set(fps);

const added = fps.filter((f) => !allowSet.has(f));
const removed = [...allowSet].filter((f) => !currentSet.has(f));

if (added.length > 0) {
	console.error(`New circular import(s) (${added.length}) — not in allowlist:`);
	for (const a of added.slice(0, 20)) console.error(`  + ${a}`);
	if (added.length > 20) console.error(`  … and ${added.length - 20} more`);
	console.error('Break the cycle, or if intentional document why then regenerate with --write (prefer shrink).');
	process.exit(1);
}

if (removed.length > 0) {
	console.error(`Allowlist is stale — ${removed.length} cycle(s) no longer present. Shrink the allowlist:`);
	console.error('  node scripts/check-import-cycles.mjs --write');
	for (const r of removed.slice(0, 10)) console.error(`  - ${r}`);
	process.exit(1);
}

console.log(`Import cycles OK (${fps.length} allowlisted; list may only shrink).`);
