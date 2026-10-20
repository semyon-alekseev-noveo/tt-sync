/**
 * BUG-TICKTICK-ID-LEAK: loose `ticktick_id::` text must not become the TickTick title.
 */
import { describe, expect, it } from 'vitest';
import { TaskParser } from '@/taskParser';

describe('BUG-TICKTICK-ID-LEAK', () => {
	const canonicalId = '6ad6e8137ef69f21f36b1cd1';
	const brokenLine =
		`- [ ] test-1-2    ticktick_id:: ${canonicalId}] #note/manual-test %%[ticktick_id:: 6ad6ea847ef69f21f36b1cd2]%%`;

	it('getTickTickId prefers canonical %% marker over loose fragment', () => {
		const parser = new TaskParser({} as never, { dateMan: { stripDatesFromLine: (s: string) => s } } as never);
		expect(parser.getTickTickId(brokenLine)).toBe('6ad6ea847ef69f21f36b1cd2');
	});

	it('getTaskContentFromLineText strips loose ticktick_id fragment', () => {
		const parser = new TaskParser({} as never, {
			dateMan: { stripDatesFromLine: (s: string) => s },
		} as never);
		const title = parser.getTaskContentFromLineText(brokenLine);
		expect(title).toBe('test-1-2');
		expect(title).not.toMatch(/ticktick_id/i);
		expect(title).not.toMatch(/%%/);
	});
});
