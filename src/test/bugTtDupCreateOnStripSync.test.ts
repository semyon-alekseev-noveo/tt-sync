/**
 * BUG-TT-DUP-CREATE-ON-STRIP-SYNC — strip marker + Synchronize must not invent
 * a new TickTick id when same-title live peers exist under the same parent.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
	decideSameTitleCreate,
	sameTitleParentKey,
	vaultHasMarkedSameTitleLine,
} from '@/sync/vault-push/taskModification/sameTitleCreateGuard';
import {
	formatTaskCreateSkippedNotice,
	formatTaskCreatedNotice,
	formatTaskReattachedNotice,
} from '@/ui/notices/taskLifecycleNotices';

const PARENT = '6ae17a048f0871a7dbb8c8ca';
const PROJECT = '6ae17a048f0871a7dbb8c89a';

function task(partial: {
	id: string;
	title?: string;
	parentId?: string | null;
	projectId?: string | null;
	status?: number;
	deleted?: number;
}) {
	return {
		id: partial.id,
		title: partial.title ?? 'Подумать над механикой',
		parentId: partial.parentId === undefined ? PARENT : partial.parentId,
		projectId: partial.projectId ?? PROJECT,
		status: partial.status ?? 0,
		deleted: partial.deleted ?? 0,
	};
}

describe('BUG-TT-DUP-CREATE-ON-STRIP-SYNC', () => {
	it('sameTitleParentKey uses parentId else root project (1A)', () => {
		expect(sameTitleParentKey({ parentId: PARENT, projectId: PROJECT })).toBe(`parent:${PARENT}`);
		expect(sameTitleParentKey({ parentId: '', projectId: PROJECT })).toBe(`root:${PROJECT}`);
		expect(sameTitleParentKey({ parentId: null, projectId: null })).toBeNull();
	});

	it('unique Dexie orphan → reattach (marker strip of one task)', () => {
		const text = [
			'- [ ] Подумать над механикой #obsidian',
			'- [ ] Other %%[ticktick_id:: aaaaaaaaaaaaaaaaaaaaaaaa]%%',
		].join('\n');
		const d = decideSameTitleCreate({
			wantTitle: 'Подумать над механикой',
			wantParentKey: `parent:${PARENT}`,
			vaultText: text,
			vaultLines: text.split('\n'),
			currentLineIndex: 0,
			liveTasks: [task({ id: '6ae42396d07c7a23f9eed586' })],
		});
		expect(d).toEqual({ action: 'reattach', taskId: '6ae42396d07c7a23f9eed586' });
	});

	it('multi orphan same title+parent → skip (no silent third TT)', () => {
		const text = '- [ ] Подумать над механикой #obsidian\n';
		const d = decideSameTitleCreate({
			wantTitle: 'Подумать над механикой',
			wantParentKey: `parent:${PARENT}`,
			vaultText: text,
			vaultLines: text.split('\n'),
			currentLineIndex: 0,
			liveTasks: [
				task({ id: '6ae42396d07c7a23f9eed586' }),
				task({ id: '6ae82055d07c7a23f9eed591' }),
			],
		});
		expect(d).toEqual({ action: 'skip', reason: 'ambiguous-orphans' });
	});

	it('unmarked twin beside vault-linked same-title keeper → skip (07:56 path)', () => {
		const text = [
			'- [ ] Подумать над механикой #obsidian #note/pkm-journaling',
			'- [ ] Подумать над шаблонами #obsidian %%[ticktick_id:: 6ae42397d07c7a23f9eed587]%%',
			'- [ ] Подумать над механикой #obsidian #note/pkm-journaling %%[ticktick_id:: 6ae9baf1eec3d823f964606e]%%',
		].join('\n');
		const d = decideSameTitleCreate({
			wantTitle: 'Подумать над механикой',
			wantParentKey: `parent:${PARENT}`,
			vaultText: text,
			vaultLines: text.split('\n'),
			currentLineIndex: 0,
			liveTasks: [
				task({ id: '6ae42396d07c7a23f9eed586' }),
				task({ id: '6ae82055d07c7a23f9eed591' }),
				task({ id: '6ae9baf1eec3d823f964606e' }),
			],
		});
		// Multi orphan among Dexie → ambiguous skip (must not create 6aeae53f…)
		expect(d.action).toBe('skip');
		expect(d).toMatchObject({ reason: 'ambiguous-orphans' });
	});

	it('zero orphans but marked same-title sibling in vault → skip', () => {
		const text = [
			'- [ ] Подумать над механикой #obsidian',
			'- [ ] Подумать над механикой #obsidian %%[ticktick_id:: 6ae9baf1eec3d823f964606e]%%',
		].join('\n');
		expect(vaultHasMarkedSameTitleLine(text.split('\n'), 'подумать над механикой', 0)).toBe(true);
		const d = decideSameTitleCreate({
			wantTitle: 'Подумать над механикой',
			wantParentKey: `parent:${PARENT}`,
			vaultText: text,
			vaultLines: text.split('\n'),
			currentLineIndex: 0,
			liveTasks: [task({ id: '6ae9baf1eec3d823f964606e' })],
		});
		expect(d).toEqual({ action: 'skip', reason: 'already-linked-same-title' });
	});

	it('no same-title peers → create (legitimate new task)', () => {
		const text = '- [ ] Brand new capture title #obsidian\n';
		const d = decideSameTitleCreate({
			wantTitle: 'Brand new capture title',
			wantParentKey: `parent:${PARENT}`,
			vaultText: text,
			vaultLines: text.split('\n'),
			currentLineIndex: 0,
			liveTasks: [task({ id: '6ae9baf1eec3d823f964606e', title: 'Other title' })],
		});
		expect(d).toEqual({ action: 'create' });
	});

	it('file-scoped orphan under other parent → reattach (strip→inbox inference)', () => {
		// Live fail: convertLineToTask inferred inbox/root while Dexie orphans stay under project parent.
		const text = '- [ ] Подумать над механикой #obsidian #inbox\n';
		const d = decideSameTitleCreate({
			wantTitle: 'Подумать над механикой',
			wantParentKey: `root:inbox130382745`,
			vaultText: text,
			vaultLines: text.split('\n'),
			currentLineIndex: 0,
			liveTasks: [task({ id: '6ae82055d07c7a23f9eed591', parentId: PARENT })],
		});
		expect(d).toEqual({ action: 'reattach', taskId: '6ae82055d07c7a23f9eed591' });
	});

	it('file-scoped multi orphan + inbox wantParent → skip (09:36Z regression)', () => {
		const text = '- [ ] Подумать над механикой #obsidian #inbox\n';
		const d = decideSameTitleCreate({
			wantTitle: 'Подумать над механикой',
			wantParentKey: `root:inbox130382745`,
			vaultText: text,
			vaultLines: text.split('\n'),
			currentLineIndex: 0,
			liveTasks: [
				task({ id: '6ae82055d07c7a23f9eed591' }),
				task({ id: '6ae9baf1eec3d823f964606e' }),
				task({ id: '6aeae53f64633723f94008aa' }),
			],
		});
		expect(d).toEqual({ action: 'skip', reason: 'ambiguous-orphans' });
	});

	it('skip notice never says created; create/reattach notices unchanged', () => {
		const skip = formatTaskCreateSkippedNotice('Подумать над механикой', 'ambiguous-orphans');
		expect(skip.toLowerCase()).toContain('skipped');
		expect(skip.toLowerCase()).not.toContain('created');
		expect(formatTaskCreatedNotice('T', 'id').toLowerCase()).toContain('created');
		expect(formatTaskReattachedNotice('T', 'id').toLowerCase()).toMatch(/reattach/);
	});

	it('newTasks.ts wires resolveSameTitleCreate before createTask', () => {
		const src = readFileSync(
			join(__dirname, '../sync/vault-push/taskModification/newTasks.ts'),
			'utf8',
		);
		expect(src).toContain('resolveSameTitleCreate');
		expect(src).toContain('formatTaskCreateSkippedNotice');
		expect(src).toContain('decideSameTitleCreate');
		expect(src).toMatch(/decision\.action === 'skip'/);
		expect(src).toMatch(/orphan \?\? await this\.plugin\.tickTickRestAPI\?\.createTask/);
	});
});
