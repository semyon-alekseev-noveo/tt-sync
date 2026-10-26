/**
 * Read-only count of tasks.file drift against the Dexie `files` table and
 * canonical `%%[ticktick_id:: <24hex>]%%` markers. Does not write either store.
 *
 * Same marker shape as `REGEX.TickTick_ID_CANONICAL` in `taskParser/regex.ts`.
 * Kept local so this check does not import the parser.
 */
const CANONICAL_MARKER = /%%\[ticktick_id::\s*([a-f0-9]{24})\s*\]%%/gi;
const SAMPLE_LIMIT = 5;

export interface DualStoreTaskRef {
	taskId: string;
	file: string;
	deleted?: boolean;
}

export interface DualStoreDriftSample {
	taskId: string;
	tasksFile: string;
	markerPaths: string[];
}

export interface DualStoreDriftReport {
	/** `tasks.file` is set and that path is not a Dexie `files` row. */
	fileMissingFromFiles: number;
	/** `tasks.file` is empty and a note contains the canonical marker. */
	emptyFileWithMarker: number;
	/** The canonical marker appears only in notes other than `tasks.file`. */
	markerInDifferentFile: number;
	samples: {
		fileMissingFromFiles: DualStoreDriftSample[];
		emptyFileWithMarker: DualStoreDriftSample[];
		markerInDifferentFile: DualStoreDriftSample[];
	};
}

export function assessDualStoreDrift(input: {
	tasks: readonly DualStoreTaskRef[];
	filePaths: readonly string[];
	notes: readonly { path: string; text: string }[];
}): DualStoreDriftReport {
	const registered = new Set(input.filePaths);
	const markers = indexMarkers(input.notes);
	const report = emptyReport();

	for (const task of input.tasks) {
		if (task.deleted) continue;
		const taskId = (task.taskId ?? '').trim();
		const tasksFile = task.file ?? '';
		const markerPaths = taskId ? markers.get(taskId.toLowerCase()) ?? [] : [];
		const fileSet = tasksFile.trim() !== '';
		const sample = (): DualStoreDriftSample => ({
			taskId,
			tasksFile,
			markerPaths: [...markerPaths],
		});

		if (fileSet && !registered.has(tasksFile)) {
			report.fileMissingFromFiles++;
			pushSample(report.samples.fileMissingFromFiles, sample());
		}
		if (!fileSet && markerPaths.length > 0) {
			report.emptyFileWithMarker++;
			pushSample(report.samples.emptyFileWithMarker, sample());
		}
		if (fileSet && markerPaths.length > 0 && !markerPaths.includes(tasksFile)) {
			report.markerInDifferentFile++;
			pushSample(report.samples.markerInDifferentFile, sample());
		}
	}

	return report;
}

/** One warn line when any count is non-zero. Null when the three counts are zero. */
export function formatDualStoreDriftLog(report: DualStoreDriftReport): string | null {
	const { fileMissingFromFiles, emptyFileWithMarker, markerInDifferentFile } = report;
	if (fileMissingFromFiles === 0 && emptyFileWithMarker === 0 && markerInDifferentFile === 0) {
		return null;
	}
	const head = `RISK-DUAL-STORE: fileMissingFromFiles=${fileMissingFromFiles} emptyFileWithMarker=${emptyFileWithMarker} markerInDifferentFile=${markerInDifferentFile}`;
	return head
		+ formatBucket('fileMissingFromFiles', report.samples.fileMissingFromFiles, fileMissingFromFiles)
		+ formatBucket('emptyFileWithMarker', report.samples.emptyFileWithMarker, emptyFileWithMarker)
		+ formatBucket('markerInDifferentFile', report.samples.markerInDifferentFile, markerInDifferentFile);
}

function indexMarkers(notes: readonly { path: string; text: string }[]): Map<string, string[]> {
	const pathsById = new Map<string, string[]>();
	for (const note of notes) {
		if (!note.text) continue;
		// Fresh regexp: a shared /g pattern keeps lastIndex and skips later notes.
		for (const match of note.text.matchAll(new RegExp(CANONICAL_MARKER.source, 'gi'))) {
			const id = match[1]?.toLowerCase();
			if (!id) continue;
			const list = pathsById.get(id);
			if (!list) pathsById.set(id, [note.path]);
			else if (!list.includes(note.path)) list.push(note.path);
		}
	}
	return pathsById;
}

function emptyReport(): DualStoreDriftReport {
	return {
		fileMissingFromFiles: 0,
		emptyFileWithMarker: 0,
		markerInDifferentFile: 0,
		samples: {
			fileMissingFromFiles: [],
			emptyFileWithMarker: [],
			markerInDifferentFile: [],
		},
	};
}

function pushSample(list: DualStoreDriftSample[], sample: DualStoreDriftSample): void {
	if (list.length < SAMPLE_LIMIT) list.push(sample);
}

function formatBucket(label: string, samples: readonly DualStoreDriftSample[], total: number): string {
	if (total === 0) return '';
	const shown = samples.map(sample => {
		const marker = sample.markerPaths.length > 0 ? ` marker=${sample.markerPaths.join(',')}` : '';
		return `id=${sample.taskId} tasks.file=${sample.tasksFile}${marker}`;
	}).join('; ');
	const extra = total > samples.length ? ` +${total - samples.length}` : '';
	return ` | ${label}: ${shown}${extra}`;
}
