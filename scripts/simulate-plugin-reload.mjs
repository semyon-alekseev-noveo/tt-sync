#!/usr/bin/env node
/** Simulate upgrade + enable save paths against a real vault data.json (uses built settingsMerge via vitest bundle path). */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Vitest/tsconfig paths — compile on the fly via vite-node or use prebuilt test import
const { DEFAULT_SETTINGS } = await import('../src/settings.ts');
const { buildPersistedSettings, mergeSettingsWithDefaults } = await import('../src/settingsMerge.ts');

const dataPath =
	process.argv[2] ||
	'/home/sam/obsidian/Thinkpad-tts-test/.obsidian/plugins/tickticksync-abyss/data.json';
const presetPath =
	process.argv[3] ||
	'/home/sam/obsidian/Thinkpad-tts-test/00 Inbox/TTS-data-preset.json';

const SESSION_KEYS = [
	'token',
	'inboxID',
	'inboxName',
	'checkPoint',
	'username',
	'password',
	'devices',
	'lastBackupDate',
	'migrationSnapshot',
];

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

function summary(d) {
	return {
		version: d.version,
		SyncTag: d.SyncTag,
		syncedLists: (d.syncedLists || []).length,
		tagListMappings: (d.tagListMappings || []).length,
		projectSchemeEnabled: d.projectSchemeEnabled,
	};
}

const disk0 = JSON.parse(readFileSync(dataPath, 'utf8'));
let preset = {};
try {
	preset = JSON.parse(readFileSync(presetPath, 'utf8'));
} catch (e) {
	console.warn('No preset:', presetPath);
}

const imported = mergePreset(disk0, preset);
writeFileSync(dataPath, JSON.stringify(imported, null, 2) + '\n');

// --- Simulate plugin enable #1 (fresh memory after upgrade) ---
let disk = JSON.parse(readFileSync(dataPath, 'utf8'));
const versionBefore = disk.version;
const versionAfter = '2.0.23';
const merged = mergeSettingsWithDefaults({ ...disk, version: versionAfter });
// Version-only disk patch (2.0.23 loadSettings behavior)
if (versionAfter !== versionBefore) {
	disk.version = versionAfter;
	writeFileSync(dataPath, JSON.stringify(disk, null, 2) + '\n');
	disk = JSON.parse(readFileSync(dataPath, 'utf8'));
}

// Startup sync checkpoint save with empty GTD memory (old bug scenario)
const freshMemory = { ...DEFAULT_SETTINGS, ...merged, checkPoint: disk.checkPoint };
freshMemory.syncedLists = [];
freshMemory.tagListMappings = [];
freshMemory.SyncTag = '';
const saved = buildPersistedSettings(freshMemory, disk);
writeFileSync(dataPath, JSON.stringify(saved, null, 2) + '\n');

const afterEnable1 = summary(JSON.parse(readFileSync(dataPath, 'utf8')));

// --- Simulate disable/enable #2: reload defaults, no version change, no full save on load ---
disk = JSON.parse(readFileSync(dataPath, 'utf8'));
const memory2 = { ...DEFAULT_SETTINGS };
const saved2 = buildPersistedSettings(memory2, disk);
// loadSettings would NOT call saveSettings when version unchanged; assert disk unchanged if we skipped save
const diskUnchanged = JSON.stringify(disk.syncedLists) === JSON.stringify(saved2.syncedLists);

const pass =
	afterEnable1.syncedLists >= 6 &&
	afterEnable1.tagListMappings >= 4 &&
	afterEnable1.SyncTag === 'tts-test' &&
	diskUnchanged;

console.log(
	JSON.stringify(
		{
			imported: summary(imported),
			afterEnable1,
			afterEnable2WouldSaveSameLists: diskUnchanged,
			pass,
			dataPath,
		},
		null,
		2,
	),
);
process.exit(pass ? 0 : 1);
