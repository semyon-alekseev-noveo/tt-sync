# GitHub issue — Phase 0

**Title:** `PILOT-GATE-TEST-11-12 Phase 0: Baseline evidence (one sync)`

**Parent:** Epic PILOT-GATE-TEST-11-12

**Published result (after phase):** `docs/pilot/results/PILOT-GATE-TEST-11-12/10-phase-0-baseline.md` — link this file from the issue when done.

**Body:**

Record **one** manual **Synchronize** after reload; attach findings to this issue.

## Checklist

- [ ] Plugin version in Obsidian settings matches `manifest.json` in pilot `tickticksync-abyss` folder
- [ ] `data.json`: `syncAbyssCommentsViaApi`, `abyssTasksFormat`, `syncNotes` = true
- [ ] Disk: `00 Inbox/2026-10-21.md` has bullets `comment 1`, `test-new-verision` under `test-11-12`
- [ ] Ran **Synchronize** once (note saved first)
- [ ] Pasted last `write-trace` line for `6ad83bc73e30f4429d749e09` (`reason`)
- [ ] Pasted last `perf-pilot.log` `kind":"perf"` (`addTaskComment` / `getTaskComments` counts)
- [ ] TickTick Comments for task: empty / partial / ok (screenshot or MCP)
- [ ] Console: any `Add Task Comment: response had no comment id`

## Outcome

- [ ] **Close** when evidence attached and version mismatch ruled out
- [ ] If version mismatch → fix deploy only; re-run Phase 0
