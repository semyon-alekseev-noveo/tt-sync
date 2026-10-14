/** Returns today's local date (YYYY-MM-DD) if a backup is due, else undefined. */
export function shouldBackupToday(last: string | undefined, now: Date): string | undefined {
	const p = (n: number) => String(n).padStart(2, '0');
	const today = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
	return last === today ? undefined : today;
}
