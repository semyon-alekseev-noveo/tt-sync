/**
 * UX-SET-SYNC-MASTER-OFF — interval 0 ≠ sync off; master kill switch gates automatic/reactive paths.
 * Manual Synchronize (`trigger: 'manual'`) stays available.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '@/settings';
import {
	SYNC_INTERVAL_HELP,
	SYNC_MASTER_OFF_HELP,
	SYNC_MASTER_OFF_LABEL,
} from '@/ui/settings/settingsUxPolish';
import { isAutomaticSyncEnabled, isAutomaticSyncTrigger } from '@/sync/syncEnabled';

const SRC_ROOT = join(__dirname, '..');
const SETTINGS_SVELTE_ROOT = join(SRC_ROOT, 'ui/settings');

describe('UX-SET-SYNC-MASTER-OFF', () => {
	it('defaults syncEnabled on so existing installs keep reactive sync', () => {
		expect(DEFAULT_SETTINGS.syncEnabled).toBe(true);
		expect(isAutomaticSyncEnabled(DEFAULT_SETTINGS)).toBe(true);
		expect(isAutomaticSyncEnabled({})).toBe(true);
		expect(isAutomaticSyncEnabled({ syncEnabled: true })).toBe(true);
		expect(isAutomaticSyncEnabled({ syncEnabled: false })).toBe(false);
		expect(isAutomaticSyncEnabled(undefined)).toBe(true);
	});

	it('treats scheduled and startup as automatic triggers; manual is not', () => {
		expect(isAutomaticSyncTrigger('scheduled')).toBe(true);
		expect(isAutomaticSyncTrigger('startup')).toBe(true);
		expect(isAutomaticSyncTrigger('manual')).toBe(false);
	});

	it('copy distinguishes interval 0 from Sync off and keeps Synchronize available', () => {
		expect(SYNC_MASTER_OFF_LABEL.toLowerCase()).toMatch(/automatic|reactive|sync/);
		expect(SYNC_MASTER_OFF_HELP.toLowerCase()).toMatch(/interval 0|open-note|startup/);
		expect(SYNC_MASTER_OFF_HELP.toLowerCase()).toMatch(/synchronize/);
		expect(SYNC_INTERVAL_HELP.toLowerCase()).toMatch(/repeating timer|open-note|startup/);
		expect(SYNC_INTERVAL_HELP.toLowerCase()).toMatch(/enable automatic and reactive sync/);
	});

	it('AutoSyncIntervalSection wires the master toggle near the interval', () => {
		const src = readFileSync(
			join(SETTINGS_SVELTE_ROOT, 'svelte/sections/AutoSyncIntervalSection.svelte'),
			'utf8',
		);
		expect(src).toContain('SYNC_MASTER_OFF_LABEL');
		expect(src).toContain('SYNC_MASTER_OFF_HELP');
		expect(src).toContain('SYNC_INTERVAL_HELP');
		expect(src).toContain('syncEnabled');
		// Markup order: master toggle setting-item before interval help (imports may list HELP first).
		const markup = src.slice(src.indexOf('<CollapsibleSection'));
		expect(markup.indexOf('SYNC_MASTER_OFF_LABEL')).toBeLessThan(markup.indexOf('SYNC_INTERVAL_HELP'));
	});

	it('gates startup, scheduled interval, open-note push, and reactive service entry points', () => {
		const main = readFileSync(join(SRC_ROOT, 'main.ts'), 'utf8');
		expect(main).toContain('isAutomaticSyncEnabled');
		expect(main).toMatch(/reloadInterval[\s\S]*isAutomaticSyncEnabled/);
		expect(main).toMatch(/startup[\s\S]*isAutomaticSyncEnabled|isAutomaticSyncEnabled[\s\S]*startup/);
		expect(main).toMatch(/checkboxEventhandler[\s\S]*isAutomaticSyncEnabled/);

		const service = readFileSync(join(SRC_ROOT, 'services/index.ts'), 'utf8');
		expect(service).toContain('isAutomaticSyncTrigger');
		expect(service).toMatch(/async synchronization\([\s\S]*isAutomaticSyncTrigger/);
		expect(service).toMatch(/async pushSettledActiveFile\([\s\S]*isAutomaticSyncEnabled/);
		expect(service).toMatch(/async fullTextNewTaskCheck\([\s\S]*isAutomaticSyncEnabled/);
		expect(service).toMatch(/async lineSettledCheck\([\s\S]*isAutomaticSyncEnabled/);

		const events = readFileSync(join(SRC_ROOT, 'services/EventHandlerService.ts'), 'utf8');
		expect(events).toMatch(/editor-change[\s\S]*isAutomaticSyncEnabled/);
		expect(events).toMatch(/flushActiveFilePush[\s\S]*isAutomaticSyncEnabled/);
		expect(events).toMatch(/vault\.on\('modify'[\s\S]*isAutomaticSyncEnabled/);
	});
});
