/**
 * TaskParser facade: regex/constants, tag helpers, and the composed TaskParser class.
 * Call sites keep importing from `@/taskParser` (root re-export).
 */
export { markerName, keywords, REGEX, prioritySymbols, Priority, priorityMapping, taskRegex } from '@/taskParser/regex';
export { flatTagName, abyssTagConflicts } from '@/taskParser/tags';
export { TaskParser } from '@/taskParser/TaskParser';
