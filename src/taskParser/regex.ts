import { getSettings } from '@/settings';

export const prioritySymbols = {
	Highest: '🔺', High: '⏫', Medium: '🔼', Low: '🔽', Lowest: '⏬', None: ''
} as const;

export enum Priority {
	Highest = '5', Medium = '3', Low = '1', None = '0',
}

//From https://publish.obsidian.md/tasks/Reference/Task+Formats/Tasks+Emoji+Format
// - [ ] #task Has a created date ➕ 2023-04-13
// - [ ] #task Has a scheduled date ⏳ 2023-04-14
// - [ ] #task Has a start date 🛫 2023-04-15
// - [ ] #task Has a due date 📅 2023-04-16
// - [x] #task Has a done date ✅ 2023-04-17
// - [-] #task Has a cancelled date ❌ 2023-04-18

// Sync marker tag is configurable (settings.syncMarkerTag, default `ticktick`).
export const markerName = () => (getSettings().syncMarkerTag || 'ticktick').replace(/^#/, '').toLowerCase();
export const keywords = {
	get TickTick_TAG() { return '#' + markerName(); },
	DUE_DATE: '⏳|🗓️|📅|📆|🗓',
	TIME: '⌚',
	TASK_DUE_DATE: '📅',
	TASK_COMPLETE: '✅',
	RECURRENCE: '🔁',
	REMINDER: '⏰',
	ALL_TASK_EMOJI: '➕|⏳|🛫|📅|✅|❌|🔁|⏰',
	// priorityIcons: "⏬|🔽|🔼|⏫|🔺",
	priority: `\\s([\u{23EC}\u{1F53D}\u{1F53C}\u{23EB}\u{1F53A}])\\s`
};


//For now, we're going to do task view emojies only
export const priorityMapping = [{ ticktick: 0, obsidian: null }, { ticktick: 0, obsidian: '⏬' }, {
	ticktick: 1,
	obsidian: '🔽'
}, { ticktick: 3, obsidian: '🔼' }, { ticktick: 5, obsidian: '⏫' }, { ticktick: 5, obsidian: '🔺' }];


const tag_regex = /(^|\s)#[\p{L}\p{N}_/-]+/gu;
// const due_date_regex = `(${keywords.DUE_DATE})\\s(\\d{4}-\\d{2}-\\d{2})(\\s\\d{1,}:\\d{2})?`
const due_date_regex = `(${keywords.DUE_DATE})\\s(\\d{4}-\\d{2}-\\d{2})\\s*(\\d{1,}:\\d{2})*`;
const due_date_strip_regex = `(?:${keywords.DUE_DATE})\\s\\d{4}-\\d{2}-\\d{2}(\\s\\d{1,}:\\d{2}|)`;
const completion_date_regex = `(${keywords.TASK_COMPLETE})\\s(\\d{4}-\\d{2}-\\d{2})\\s*(\\d{1,}:\\d{2})*`;
const completion_date_strip_regex = `${keywords.TASK_COMPLETE}\\s\\d{4}-\\d{2}-\\d{2}(\\s*\\d{1,}:\\d{2}|)`;

/*
* Stolen from https://github.com/obsidian-tasks-group/obsidian-tasks/blob/main/src/Task/TaskRegularExpressions.ts
* used without permission.
* Will ask for forgiveness in the fullness of time.
*
* */
export const status_regex = '^\\s*(-|\\*)\\s+\\[(x| )\\]\\s';

const indentationRegex = /^([\s\t>]*)/;

// Matches - * and + list markers, or numbered list markers (eg 1.)
const listMarkerRegex = /([-*+]|[0-9]+\.)/;

// A checkbox is `[`, one status character, `]`. The status character is not
// `[` or `]`, so a placeholder bullet `- [[]]` is a wiki link, not a task.
const checkboxRegex = /\[([^\[\]\n])\]/u;

// Matches the rest of the task after the checkbox.
const afterCheckboxRegex = / *(.*)/u;
export const taskIDRegex = / %%(.*)%%/u;
export const taskRegex = new RegExp(
	indentationRegex.source +
	listMarkerRegex.source +
	' +' +
	checkboxRegex.source +
	afterCheckboxRegex.source,
	'u'
);
/*End of stolen regex*/

export const REGEX = {
	//hopefully tighter find.
	get TickTick_TAG() { return new RegExp(`^[\\s]*[-] \\[.\\] [\\s\\S]*${keywords.TickTick_TAG}(?![\\w/-])[\\s\\S]*$`, 'i'); },

	// Source tag of a line born in the vault. Only counts as "synced" together with a ticktick_id.
	OBSIDIAN_SOURCE: /^[\s]*[-] \[.\] [\s\S]*#obsidian(?![\w/-])[\s\S]*$/i,

	/** Canonical Obsidian inline field (24-char hex task id). */
	TickTick_ID_CANONICAL: /%%\[ticktick_id::\s*([a-f0-9]{24})\s*\]%%/i,
	TickTick_ID: /\[ticktick_id::\s*[\d\S]+\]/,
	TickTick_ID_NUM: /\[ticktick_id::\s*(.*?)\s*\]/,
	/** Broken copy-paste: id text in title without `%%[…]%%` wrapper (BUG-TICKTICK-ID-LEAK). */
	LOOSE_TICKTICK_ID_FRAGMENT: /\bticktick_id::\s*[a-f0-9]{24}\s*\]?/i,
	TickTick_ID_DV_NUM: /ticktick_id(.*?)%/,
	TickTick_LINK: /\[link\]\(.*?\)/,
	DUE_DATE_WITH_EMOJ: new RegExp(`(${keywords.DUE_DATE})\\s?\\d{4}-\\d{2}-\\d{2}`), // DUE_DATE : new RegExp(`(?:${keywords.DUE_DATE})\\s?(\\d{4}-\\d{2}-\\d{2})`),
	DUE_DATE: new RegExp(due_date_regex, 'gmu'),
	COMPLETION_DATE: new RegExp(completion_date_regex, 'gmu'),

	PROJECT_NAME: /\[project::\s*(.*?)\]/,
	TASK_CONTENT: {
		REMOVE_PRIORITY: /[🔺⏫🔼🔽⏬]/ug, //accommodate UTF-16 languages.
		REMOVE_TAGS: tag_regex,
		REMOVE_SPACE: /^\s+|\s+$/g,
		REMOVE_DATE: new RegExp(due_date_strip_regex, 'gum'),
		REMOVE_COMPLETION_DATE: new RegExp(completion_date_strip_regex, 'gmu'),
		REMOVE_INLINE_METADATA: /%%\[\w+::\s*\w+\]%%/g,
		REMOVE_RECURRENCE: /🔁\s+[^🔁➕⏳🛫📅✅❌⏰\n]+/gu,
		REMOVE_REMINDER: /⏰\s+(?!\d{1,2}:\d{2}(?![\d:]))[^⏰➕⏳🛫📅✅❌🔁🔺⏫🔼🔽⏬\n]+/gu,
		REMOVE_CHECKBOX: /^(-|\*)\s+\[(.)\]\s/,
		REMOVE_CHECKBOX_WITH_INDENTATION: /^([ \t]*)?(-|\*)\s+\[(.)\]\s/,
		REMOVE_TickTick_LINK: /\[link\]\(.*?\)/
	}, //todo: this and remove_tags are redundant. Probably some of the other stuff to. Rationalize this lot.
	ALL_TAGS: tag_regex,
	TASK_CHECKBOX_CHECKED: /- \[(x|X)\] /,
	TASK_INDENTATION: /^(\s{2,}|\t)(-|\*)\s+\[(x|X| )\]/,
	TAB_INDENTATION: /^(\t+)/, // TASK_PRIORITY: /\s!!([1-4])\s/,
	TASK_PRIORITY: new RegExp(keywords.priority, 'u'),
	priorityRegex: /^.*([🔺⏫🔼🔽⏬]).*$/u,
	BLANK_LINE: /^\s*$/,
	RECURRENCE_RULE: /🔁\s+([^🔁➕⏳🛫📅✅❌⏰]+?)(?=\s*[➕⏳🛫📅✅❌⏰]|\s*$)/u,
	REMINDER_RULE: /⏰\s+(?!\d{1,2}:\d{2}(?![\d:]))([^⏰➕⏳🛫📅✅❌🔁🔺⏫🔼🔽⏬\n]+?)(?=\s*(?:[➕⏳🛫📅✅❌🔁⏰🔺⏫🔼🔽⏬]|#|%%|\[)|\s*$)/gu,
	TickTick_EVENT_DATE: /(\d{4})-(\d{2})-(\d{2})/,
	ITEM_LINE: /\[(.*?)\]\s*(.*?)\s*%%(.*?)%%/,
	LINE_ITEM_ID: /%%(?!\[ticktick_id::\s)[a-f0-9]{24}%%/g
};
