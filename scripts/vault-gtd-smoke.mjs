#!/usr/bin/env node
/**
 * Smoke test: merge GTD preset into vault data.json, simulate upgrade save from empty memory.
 * Usage: node scripts/vault-gtd-smoke.mjs [path-to-data.json]
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vaultData =
	process.argv[2] ||
	'/home/sam/obsidian/Thinkpad-tts-test/.obsidian/plugins/tickticksync-abyss/data.json';
const presetPath = join(
	repoRoot,
	'../obsidian/Thinkpad-tts-test/00 Inbox/TTS-data-preset.json',
);

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

// Dynamic import of TS-built logic via vitest is heavy; inline minimal disk-first merge check.
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
const backup = dataPath + '.pre-smoke-' + Date.now();
copyFileSync(dataPath, backup);

let data = loadJson(dataPath);
let preset;
try {
	preset = loadJson(presetPath);
} catch {
	console.warn('Preset not found at', presetPath, '— skipping import merge');
	preset = {};
}

const before = gtdSummary(data);
data = mergePreset(data, preset);
writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
const afterImport = gtdSummary(data);

// Simulate fresh plugin memory (defaults) + checkpoint save after upgrade
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
