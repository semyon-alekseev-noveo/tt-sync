/**
 * Transitional path: prefer `@/taskParser` (directory). Re-exports the split modules.
 */
export {
	TaskParser,
	REGEX,
	markerName,
	flatTagName,
	abyssTagConflicts,
	keywords,
	prioritySymbols,
	Priority,
	priorityMapping,
	taskRegex,
} from '@/taskParser/index';
