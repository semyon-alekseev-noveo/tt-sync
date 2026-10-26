/**
 * FEAT-NOTEBOOK MVP — TT NOTE → vault markdown (opt-in folder).
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
	notebookBodyFromMarkdown,
	notebookVaultPath,
	parseNotebookFrontmatterId,
	renderNotebookMarkdown,
	sanitizeNotebookBasename,
	syncNotebooksToVault,
} from '@/sync/notebookVault';
import { getSettings } from '@/settings';

vi.mock('@/db/dexie', () => ({
	db: {
		tasks: {
			filter: () => ({
				toArray: vi.fn().mockResolvedValue([
					{
						deleted: false,
						task: {
							id: '6adf147e8f08f3950543e3aa',
							title: 'FEAT-NOTEBOOK spike',
							content: 'spike body CRUD',
							kind: 'NOTE',
						},
					},
				]),
			}),
		},
	},
}));

const S = () => (getSettings as unknown as () => Record<string, unknown>)();

describe('FEAT-NOTEBOOK-MVP-1 render / path', () => {
	it('sanitizeNotebookBasename strips path-hostile chars and appends id suffix', () => {
		expect(sanitizeNotebookBasename('a/b:c', 'abcdefghijklmnop')).toBe('a-b-c (ijklmnop)');
	});

	it('notebookVaultPath nests under folder', () => {
		expect(notebookVaultPath('TickTick Notebook', 'Hello', '6adf147e8f08f3950543e3aa')).toBe(
			'TickTick Notebook/Hello (0543e3aa).md',
		);
	});

	it('FEAT-NOTEBOOK-MVP-1: render has frontmatter id, kind, title, body', () => {
		const md = renderNotebookMarkdown({
			id: '6adf147e8f08f3950543e3aa',
			title: 'FEAT-NOTEBOOK spike',
			content: 'spike body CRUD',
		});
		expect(md).toContain('ticktick_id: 6adf147e8f08f3950543e3aa');
		expect(md).toContain('ticktick_kind: NOTE');
		expect(md).toContain('# FEAT-NOTEBOOK spike');
		expect(md).toContain('spike body CRUD');
		expect(parseNotebookFrontmatterId(md)).toBe('6adf147e8f08f3950543e3aa');
		expect(notebookBodyFromMarkdown(md)?.body).toBe('spike body CRUD');
	});
});

describe('FEAT-NOTEBOOK-MVP-1 syncNotebooksToVault', () => {
	beforeEach(() => {
		Object.assign(S(), { syncNotebook: false, notebookFolder: 'TickTick Notebook' });
	});

	it('no-ops when syncNotebook is off', async () => {
		const create = vi.fn();
		const app = {
			vault: {
				getAbstractFileByPath: () => null,
				createFolder: vi.fn(),
				create,
				getMarkdownFiles: () => [],
			},
			metadataCache: { getFileCache: () => null },
		};
		const n = await syncNotebooksToVault(app as never, {} as never);
		expect(n).toBe(0);
		expect(create).not.toHaveBeenCalled();
	});

	it('FEAT-NOTEBOOK-MVP-1: creates markdown under folder when enabled', async () => {
		Object.assign(S(), { syncNotebook: true, notebookFolder: 'TickTick Notebook' });
		const created: string[] = [];
		const folders: string[] = [];
		const app = {
			vault: {
				getAbstractFileByPath: (p: string) => (folders.includes(p) || created.includes(p) ? { path: p } : null),
				createFolder: vi.fn(async (p: string) => {
					folders.push(p);
				}),
				create: vi.fn(async (path: string, body: string) => {
					created.push(path);
					expect(body).toContain('ticktick_id: 6adf147e8f08f3950543e3aa');
					expect(body).toContain('spike body CRUD');
				}),
				getMarkdownFiles: () => [],
			},
			metadataCache: { getFileCache: () => null },
		};
		const n = await syncNotebooksToVault(app as never, {} as never);
		expect(n).toBe(1);
		expect(created.some(p => p.startsWith('TickTick Notebook/') && p.endsWith('.md'))).toBe(true);
	});
});
