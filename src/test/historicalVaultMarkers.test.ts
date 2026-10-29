/**
 * ID-ARCHIVE-NO-STRIP / #215 — historical path heuristics.
 */
import { describe, expect, it } from 'vitest';
import {
	isHistoricalVaultPath,
	normalizeVaultPath,
	shouldPreserveVaultLinesOnRemoteDelete,
} from '@/sync/historicalVaultMarkers';

describe('ID-ARCHIVE-NO-STRIP historicalVaultMarkers', () => {
	it('normalizeVaultPath uses forward slashes', () => {
		expect(normalizeVaultPath('\\foo\\bar.md')).toBe('foo/bar.md');
	});

	it('detects RU Архив and numbered archive folders', () => {
		expect(
			isHistoricalVaultPath('30 Tasks/399 Архив/3992 Noveo/restore_minio_cluster_on_k8s01.md'),
		).toBe(true);
		expect(isHistoricalVaultPath('30 Tasks/Archive/old.md')).toBe(true);
		expect(isHistoricalVaultPath('zz-parked-17/30 Tasks/x.md')).toBe(true);
	});

	it('does not treat live project / inbox notes as historical', () => {
		expect(isHistoricalVaultPath('10 Projects/Подключение посудомойки.md')).toBe(false);
		expect(isHistoricalVaultPath('00 Inbox/abyss-active.md')).toBe(false);
		expect(isHistoricalVaultPath('30 Tasks/TickTick/TTS-Inbox.md')).toBe(false);
	});

	it('shouldPreserveVaultLinesOnRemoteDelete mirrors historical detection', () => {
		expect(
			shouldPreserveVaultLinesOnRemoteDelete(
				'30 Tasks/399 Архив/3993 Personal tasks/Написать_первую_статью_в_Новео.md',
			),
		).toBe(true);
		expect(shouldPreserveVaultLinesOnRemoteDelete('10 Projects/foo.md')).toBe(false);
	});
});
