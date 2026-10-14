import * as obs from 'obsidian';
import type { App } from 'obsidian';
import type TickTickSync from '@/main';
import { RedoLog } from './log';
import { execute, lastSyncId, planUndo, versionsOf, type Action, type Version } from './rollback';
import { makeEnv } from './obsidian';

type Choice = 'apply' | 'resurrect' | 'cancel';
// classes are built lazily so importing this module doesn't need the full obsidian runtime (tests)
let UI: ReturnType<typeof buildUi> | null = null;
const ui = () => (UI ??= buildUi());
function buildUi() {
	const { Modal, SuggestModal } = obs;
class PreviewModal extends Modal {
	private done!: (c: Choice) => void; private chosen: Choice = 'cancel';
	constructor(app: App, private head: string, private lines: string[], private canResurrect: boolean) { super(app); }
	open2(): Promise<Choice> { return new Promise(r => { this.done = r; this.open(); }); }
	onOpen() {
		this.titleEl.setText(this.head);
		const pre = this.contentEl.createEl('pre', { cls: 'tts-redo-preview' }); pre.setText(this.lines.join('\n') || '(nothing to do)');
		const row = this.contentEl.createDiv({ cls: 'modal-button-container' });
		const b = (t: string, c: Choice) => row.createEl('button', { text: t }).addEventListener('click', () => { this.chosen = c; this.close(); });
		b('Apply', 'apply'); if (this.canResurrect) b('Apply + resurrect detached in TickTick', 'resurrect'); b('Cancel', 'cancel');
	}
	onClose() { this.contentEl.empty(); this.done?.(this.chosen); }
}
class VersionPicker extends SuggestModal<Version> {
	private done!: (v: Version | null) => void; private picked: Version | null = null;
	constructor(app: App, private vs: Version[]) { super(app); this.setPlaceholder('Pick the version to restore'); }
	pick(): Promise<Version | null> { return new Promise(r => { this.done = r; this.open(); }); }
	getSuggestions(q: string) { return this.vs.filter(v => `${v.ts} ${v.label} ${v.line ?? v.task?.title ?? ''}`.toLowerCase().includes(q.toLowerCase())); }
	renderSuggestion(v: Version, el: HTMLElement) { el.createDiv({ text: `${new Date(v.ts).toLocaleString()} — ${v.label}` }); el.createEl('small', { text: String(v.line ?? v.task?.title ?? '').slice(0, 120) }); }
	onChooseSuggestion(v: Version) { this.picked = v; }
	onClose() { setTimeout(() => this.done?.(this.picked), 0); }
}
class IdPrompt extends Modal {
	private done!: (s: string | null) => void; private val: string | null = null;
	pick(): Promise<string | null> { return new Promise(r => { this.done = r; this.open(); }); }
	onOpen() {
		this.titleEl.setText('TickTick task id to restore');
		const i = this.contentEl.createEl('input', { type: 'text' }); i.style.width = '100%';
		i.addEventListener('keydown', e => { if (e.key === 'Enter') { this.val = i.value.trim(); this.close(); } }); i.focus();
	}
	onClose() { this.contentEl.empty(); this.done?.(this.val); }
}

return { PreviewModal, VersionPicker, IdPrompt };
}

export class RedoCommands {
	constructor(private plugin: TickTickSync, private redo: RedoLog) {}
	private env() { return makeEnv(this.plugin); }

	async planUndoLast(only?: string): Promise<{ syncId?: string; actions: Action[] }> {
		const es = await this.redo.entries(); const syncId = only ?? lastSyncId(es);
		return { syncId, actions: syncId ? planUndo(es, syncId) : [] };
	}
	/** Dry run, then apply in a journaled 'rollback' session (itself undoable). */
	async run(actions: Action[], opts: { dryRun?: boolean; resurrect?: boolean; force?: boolean } = {}) {
		if (opts.dryRun) return execute(actions, this.env(), { dryRun: true });
		// never mix with a running sync: its changes would be filed under the rollback id
		for (let i = 0; this.redo.active() && i < 600; i++) await new Promise(r => setTimeout(r, 500));
		return this.redo.session('rollback', async () => {
			const rep = await execute(actions, this.env(), opts);
			// push reverted lines to TickTick (and pull) inside the same rollback session, so undoing the rollback undoes both sides
			try { await this.plugin.service?.synchronization(); } catch (e) { rep.push(`sync after rollback failed: ${e}`); }
			return rep;
		});
	}
	async undoLastSync(interactive = true) {
		const { syncId, actions } = await this.planUndoLast();
		if (!syncId) { new obs.Notice('Redo log: nothing to undo'); return []; }
		const preview = await this.run(actions, { dryRun: true });
		if (!interactive) return preview;
		const c = await new (ui().PreviewModal)(this.plugin.app, `Undo sync ${syncId} — dry run`, preview, actions.some(a => a.type.startsWith('tt-'))).open2();
		if (c === 'cancel') return preview;
		const rep = await this.run(actions, { resurrect: c === 'resurrect' });
		new obs.Notice(`Redo log: undo of ${syncId} done (${rep.filter(l => l.startsWith('OK')).length} change(s))`);
		return rep;
	}
	async versions(taskId: string): Promise<Version[]> {
		const vs = versionsOf(await this.redo.entries(), taskId);
		const cur = await this.plugin.tickTickRestAPI?.getTaskById(taskId).catch(() => null);
		if (cur) vs.push({ ts: new Date().toISOString(), syncId: 'now', label: 'TickTick current', task: cur as never });
		return vs;
	}
	actionsFor(taskId: string, v: Version): Action[] {
		const out: Action[] = [];
		if (v.task) out.push({ type: 'tt-restore', taskId, task: v.task, src: 'restore' });
		if (v.line && v.file) out.push({ type: 'line-insert', file: v.file, taskId, idx: v.idx ?? 0, line: v.line, src: 'restore' }, { type: 'line-set', file: v.file, taskId, expect: '', line: v.line, src: 'restore' });
		else if (v.task) out.push({ type: 'vault-place', taskId, task: v.task, src: 'restore' });
		return out;
	}
	async restoreTask(taskId?: string) {
		taskId = taskId || (await new (ui().IdPrompt)(this.plugin.app).pick()) || '';
		if (!taskId) return;
		const vs = await this.versions(taskId);
		if (!vs.length) { new obs.Notice(`Redo log: no history for ${taskId}`); return; }
		const v = await new (ui().VersionPicker)(this.plugin.app, vs).pick(); if (!v) return;
		const acts = this.actionsFor(taskId, v);
		const preview = await this.run(acts, { dryRun: true });
		const c = await new (ui().PreviewModal)(this.plugin.app, `Restore ${taskId} — dry run`, preview, true).open2();
		if (c === 'cancel') return;
		const rep = await this.run(acts, { resurrect: c === "resurrect", force: true });
		new obs.Notice(`Redo log: ${rep.join('\n')}`, 10000);
	}
	register() {
		const p = this.plugin;
		p.addCommand({ id: 'redo-undo-last-sync', name: 'Undo last sync (preview first)', callback: () => void this.undoLastSync() });
		p.addCommand({ id: 'redo-restore-task', name: 'Restore a task to an earlier version…', callback: () => void this.restoreTask() });
		p.addCommand({ id: 'redo-restore-task-at-cursor', name: 'Restore task under cursor to an earlier version…', editorCallback: ed => { const id = ed.getLine(ed.getCursor().line).match(/ticktick_id:: ([0-9a-f]+)/)?.[1]; void this.restoreTask(id); } });
		p.addCommand({ id: 'redo-preview-undo', name: 'Preview undo of last sync (dry run only)', callback: async () => { const { syncId, actions } = await this.planUndoLast(); const r = await this.run(actions, { dryRun: true }); new (ui().PreviewModal)(p.app, `Dry run: undo ${syncId ?? '-'}`, r, false).open(); } });
	}
}
