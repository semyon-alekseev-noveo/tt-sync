// Completing a recurring task: TickTick's API closes the whole series, so we roll it ourselves.
const DAY = 86400000;

/** Shift an ISO date by one RRULE step (DAILY/WEEKLY/MONTHLY/YEARLY + INTERVAL). undefined = unsupported rule. */
export function nextOccurrence(rrule: string | undefined, iso: string | undefined): string | undefined {
	if (!rrule || !iso) return undefined;
	const freq = rrule.match(/FREQ=(\w+)/)?.[1];
	const n = +(rrule.match(/INTERVAL=(\d+)/)?.[1] ?? 1);
	if (/BYDAY=|BYMONTHDAY=|COUNT=|UNTIL=|BYSETPOS=/.test(rrule)) return undefined;
	const d = new Date(iso.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
	if (isNaN(+d)) return undefined;
	if (freq === 'DAILY') d.setTime(+d + n * DAY);
	else if (freq === 'WEEKLY') d.setTime(+d + 7 * n * DAY);
	else if (freq === 'MONTHLY') d.setUTCMonth(d.getUTCMonth() + n);
	else if (freq === 'YEARLY') d.setUTCFullYear(d.getUTCFullYear() + n);
	else return undefined;
	return d.toISOString().replace('Z', '+0000');
}

const ymd = (iso: string, tz?: string) => new Date(iso.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')).toLocaleDateString('sv-SE', tz ? { timeZone: tz } : {});

/**
 * Line rewrite for a completed recurring task: [new open instance with shifted dates, done record].
 * The done record keeps [x] and its ✅ date but loses the TickTick id (it is history, not synced).
 */
export function rollRecurringLines(line: string, oldDue: string, newDue: string, tz?: string): [string, string] {
	const from = ymd(oldDue, tz), to = ymd(newDue, tz);
	const open = line.replace(/^(\s*[-*+] )\[.\]/, '$1[ ]').replace(/\s*✅ \d{4}-\d{2}-\d{2}/, '').split(from).join(to);
	const done = line
		.replace(/\s*%%\[ticktick_id::\s*[^\]]*\]%%/g, '')
		.replace(/\s*\[link\]\(https?:\/\/[^)]*ticktick[^)]*\)/gi, '')
		.replace(/\s#ticktick(?![\w/-])/gi, '')
		.replace(/[ \t]+$/, '') + ' %%tt-detached%%';
	return [open, done];
}
