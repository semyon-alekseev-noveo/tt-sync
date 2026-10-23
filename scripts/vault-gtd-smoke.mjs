#!/usr/bin/env node
/**
 * Smoke test: merge GTD preset into vault data.json, simulate upgrade save from empty memory.
 *
 * Usage:
 *   node scripts/vault-gtd-smoke.mjs <path-to-data.json> [path-to-preset.json]
 *   TTS_VAULT_DATA=/path/to/data.json TTS_VAULT_PRESET=/path/to/preset.json node scripts/vault-gtd-smoke.mjs
 *
 * No personal absolute paths in defaults (DEV_FLOW / #33).
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vaultData = process.argv[2] || process.env.TTS_VAULT_DATA;
const presetPath =
	process.argv[3] ||
	process.env.TTS_VAULT_PRESET ||
	join(repoRoot, 'docs/fixtures/TTS-data-preset.json');

if (!vaultData) {
	console.error(
		'Usage: node scripts/vault-gtd-smoke.mjs <path-to-data.json> [path-to-preset.json]\n' +
			'   or: TTS_VAULT_DATA=... [TTS_VAULT_PRESET=...] node scripts/vault-gtd-smoke.mjs\n' +
			'Paths must be supplied — no machine-local defaults (issue #33).',
	);
	process.exit(2);
}

const SESSION_KEYS = [
	'token',
	'inboxID',
	'inboxName',
	'checkPoint',
	'username',
	'password',
	'devices',
	'version',
	'lastBackupDate',
	'migrationSnapshot',
];

function loadJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function mergePreset(data, preset) {
	const out = { ...data };
	for (const [k, v] of Object.entries(preset)) {
		if (k === '_comment') continue;
		out[k] = v;
	}
	for (const k of SESSION_KEYS) {
		if (data[k] !== undefined) out[k] = data[k];
	}
	return out;
}

function gtdSummary(data) {
	return {
		SyncTag: data.SyncTag,
		syncedLists: data.syncedLists?.length ?? 0,
		tagListMappings: data.tagListMappings?.length ?? 0,
		projectSchemeEnabled: data.projectSchemeEnabled,
		version: data.version,
	};
}

function buildPersistedLike(memory, disk) {
	const out = { ...(disk ?? {}) };
	const GTD_ARRAY = ['syncedLists', 'tagListMappings', 'syncScopeFolders'];
	for (const key of GTD_ARRAY) {
		const m = memory[key];
		const d = disk?.[key];
		if (Array.isArray(m) && m.length === 0 && Array.isArray(d) && d.length > 0) {
			out[key] = d;
			continue;
		}
		if (m !== undefined) out[key] = m;
	}
	for (const [k, v] of Object.entries(memory)) {
		if (GTD_ARRAY.includes(k)) continue;
		if (v !== undefined) out[k] = v;
	}
	return out;
}

const dataPath = resolve(vaultData);
if (!existsSync(dataPath)) {
	console.error('data.json not found:', dataPath);
	process.exit(2);
}
const backup = dataPath + '.pre-smoke-' + Date.now();
copyFileSync(dataPath, backup);

let data = loadJson(dataPath);
let preset;
try {
	preset = loadJson(resolve(presetPath));
} catch {
	console.warn('Preset not found at', presetPath, '— skipping import merge');
	preset = {};
}

const before = gtdSummary(data);
data = mergePreset(data, preset);
writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
const afterImport = gtdSummary(data);

const emptyMemory = {
	version: '2.0.23',
	checkPoint: data.checkPoint,
	syncedLists: [],
	tagListMappings: [],
	syncScopeFolders: [],
	SyncTag: '',
};
const afterSave = buildPersistedLike(emptyMemory, data);
const afterSaveSummary = gtdSummary(afterSave);

const pass =
	(afterImport.syncedLists >= 6 || afterImport.syncedLists === before.syncedLists) &&
	afterSave.syncedLists >= 6 &&
	afterSave.tagListMappings >= 4;

console.log(JSON.stringify({ before, afterImport, afterSaveSummary, pass, backup }, null, 2));
process.exit(pass ? 0 : 1);
