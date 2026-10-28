/**
 * UX-SET Phase 4 (#194) — cold-start strip & polish.
 * Failing-test-first; no sync-semantics asserts.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
	COLD_START_STRIP_LINES,
	COLD_START_STRIP_TITLE,
	DEVICE_LIST_HELP,
	DEVICE_LIST_LABEL,
	DEVICE_PRUNE_BUTTON,
	DEVICE_PRUNE_HELP,
	PASSWORD_PLAINTEXT_BANNER,
	PASSWORD_PLAINTEXT_CONFIRM_LABEL,
	PASSWORD_PLAINTEXT_CONFIRM_MESSAGE,
	PASSWORD_PLAINTEXT_CONFIRM_TITLE,
	SCHEDULED_PROGRESS_DISABLED_HINT,
	SCHEDULED_PROGRESS_LABEL,
	buildSettingsDebugDump,
	passwordNeedsPlaintextConfirm,
	pruneDeviceFromList,
	scheduledProgressControlEnabled,
} from '@/ui/settings/settingsUxPolish';

const SETTINGS_SVELTE_ROOT = join(__dirname, '../ui/settings');

describe('UX-SET-COLD-START', () => {
	it('strip title and lines cover project + Active Zone + Synchronize + ticked lists', () => {
		expect(COLD_START_STRIP_TITLE.toLowerCase()).toMatch(/cold start|project/);
		const blob = COLD_START_STRIP_LINES.join('\n').toLowerCase();
		expect(blob).toMatch(/projects|#system\/project/);
		expect(blob).toMatch(/active zone/);
		expect(blob).toMatch(/synchronize/);
		expect(blob).toMatch(/synced lists|tick/);
	});

	it('Sync Control surfaces the cold-start strip', () => {
		const src = readFileSync(
			join(SETTINGS_SVELTE_ROOT, 'svelte/sections/SyncControlSettings.svelte'),
			'utf8',
		);
		expect(src).toContain('COLD_START_STRIP_TITLE');
		expect(src).toContain('COLD_START_STRIP_LINES');
	});
});

describe('UX-SET-DEVICE-PRUNE', () => {
	it('prune removes stale device but never the current one', () => {
		const devices = [
			{ deviceId: 'a', deviceLabel: 'Laptop' },
			{ deviceId: 'b', deviceLabel: 'Phone' },
			{ deviceId: 'c', deviceLabel: 'Old' },
		];
		expect(pruneDeviceFromList(devices, 'c', 'a').map((d) => d.deviceId)).toEqual(['a', 'b']);
		expect(pruneDeviceFromList(devices, 'a', 'a').map((d) => d.deviceId)).toEqual(['a', 'b', 'c']);
		expect(pruneDeviceFromList(devices, '', 'a')).toHaveLength(3);
	});

	it('labels mention prune / remove stale and Known devices', () => {
		expect(DEVICE_LIST_LABEL.toLowerCase()).toMatch(/known device/);
		expect(DEVICE_LIST_HELP.toLowerCase()).toMatch(/stale|remove/);
		expect(DEVICE_PRUNE_BUTTON.toLowerCase()).toMatch(/remove/);
		expect(DEVICE_PRUNE_HELP.toLowerCase()).toMatch(/current|stale|prune|remove/);
	});

	it('Device Identity section wires prune copy and helper', () => {
		const src = readFileSync(
			join(SETTINGS_SVELTE_ROOT, 'svelte/sections/DeviceIdentitySection.svelte'),
			'utf8',
		);
		expect(src).toContain('pruneDeviceFromList');
		expect(src).toContain('DEVICE_PRUNE_BUTTON');
		expect(src).toContain('DEVICE_LIST_LABEL');
	});
});

describe('UX-SET-INTERVAL-ZERO', () => {
	it('progress control enabled only when interval > 0', () => {
		expect(scheduledProgressControlEnabled(0)).toBe(false);
		expect(scheduledProgressControlEnabled(null)).toBe(false);
		expect(scheduledProgressControlEnabled(20)).toBe(true);
		expect(scheduledProgressControlEnabled(86400)).toBe(true);
	});

	it('disabled hint names interval 0', () => {
		expect(SCHEDULED_PROGRESS_DISABLED_HINT.toLowerCase()).toMatch(/interval|0/);
		expect(SCHEDULED_PROGRESS_LABEL.toLowerCase()).toMatch(/progress/);
	});

	it('Auto sync interval section greys progress when interval is 0', () => {
		const src = readFileSync(
			join(SETTINGS_SVELTE_ROOT, 'svelte/sections/AutoSyncIntervalSection.svelte'),
			'utf8',
		);
		expect(src).toContain('scheduledProgressControlEnabled');
		expect(src).toContain('SCHEDULED_PROGRESS_DISABLED_HINT');
	});
});

describe('UX-SET-PW-CONFIRM', () => {
	it('needs confirm only when storing a new non-empty password', () => {
		expect(passwordNeedsPlaintextConfirm('secret', '')).toBe(true);
		expect(passwordNeedsPlaintextConfirm('secret', 'old')).toBe(true);
		expect(passwordNeedsPlaintextConfirm('secret', 'secret')).toBe(false);
		expect(passwordNeedsPlaintextConfirm('', 'old')).toBe(false);
		expect(passwordNeedsPlaintextConfirm('', '')).toBe(false);
	});

	it('confirm copy names plaintext / data.json', () => {
		expect(PASSWORD_PLAINTEXT_CONFIRM_TITLE.toLowerCase()).toMatch(/plaintext|password/);
		expect(PASSWORD_PLAINTEXT_CONFIRM_MESSAGE.toLowerCase()).toMatch(/plain ?text|data\.json/);
		expect(PASSWORD_PLAINTEXT_CONFIRM_LABEL.toLowerCase()).toMatch(/store|plaintext|password/);
		expect(PASSWORD_PLAINTEXT_BANNER.toLowerCase()).toMatch(/plaintext|confirm/);
	});

	it('Access Control login wires plaintext confirm before store', () => {
		const src = readFileSync(
			join(SETTINGS_SVELTE_ROOT, 'svelte/AccessControlLogin.svelte'),
			'utf8',
		);
		expect(src).toContain('passwordNeedsPlaintextConfirm');
		expect(src).toContain('PASSWORD_PLAINTEXT');
		expect(src).toMatch(/ConfirmPasswordPlaintextModal|PASSWORD_PLAINTEXT_CONFIRM/);
	});
});

describe('Phase 4 #194 — Generate Debug dump includes GTD + statusListMappings', () => {
	it('debug dump gtd block includes statusListMappings and syncedLists', () => {
		const dump = buildSettingsDebugDump({
			SyncTag: 'tts-test',
			projectSchemeEnabled: true,
			abyssTasksFormat: true,
			syncedLists: ['TTS-Projects'],
			syncScopeFolders: ['10 Projects/'],
			statusListMappings: [{ char: '!', list: 'TTS-nextAction' }],
			tagListMappings: [{ tag: 'gtd/next', list: 'TTS-nextAction' }],
		});
		expect(dump).toHaveProperty('gtd');
		const gtd = dump.gtd as Record<string, unknown>;
		expect(gtd.statusListMappings).toEqual([{ char: '!', list: 'TTS-nextAction' }]);
		expect(gtd.syncedLists).toEqual(['TTS-Projects']);
		expect(gtd.projectSchemeEnabled).toBe(true);
		expect(gtd.abyssTasksFormat).toBe(true);
	});

	it('DebugOptionsSettings uses buildSettingsDebugDump', () => {
		const src = readFileSync(
			join(SETTINGS_SVELTE_ROOT, 'svelte/DebugOptionsSettings.svelte'),
			'utf8',
		);
		expect(src).toContain('buildSettingsDebugDump');
	});
});
