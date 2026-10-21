# Pilot gate: `test-11-12` → TickTick Comments API

**Status:** **pass** on **2.0.74** (2026-10-21) — Comments criterion met; evidence `docs/pilot/results/PILOT-GATE-TEST-11-12/16-phase-3b-verify.md`  
**Process:** [`DEV_FLOW.md`](../../DEV_FLOW.md) — case → failing test → fix → regression → recorded pilot result  
**Canonical case IDs:** `BUG-COMMENT-VAULT-AHEAD`, `BUG-COMMENT-RECONCILE-UPDATE`, `BUG-COMMENT-DISK-READ`, `BUG-COMMENT-NO-PUSH`, `BUG-COMMENT-MANUAL-PRE-PULL`  
**Pilot acceptance ID:** `PILOT-GATE-TEST-11-12` (see [`ABYSS_FIRST_CASES.md`](../../ABYSS_FIRST_CASES.md))

## Scope (frozen until gate passes)

| Field | Value |
|--------|--------|
| Vault | Thinkpad-tts-test only |
| Note | `00 Inbox/2026-10-21.md` |
| Task | `test-11-12` |
| TickTick id | `6ad83bc73e30f4429d749e09` |
| Project id | `6ad1abfe8f08abb10392fe45` |
| Vault bullets (Comments API) | `comment 1`, `test-new-verision` |
| Vault description (not Comments API) | `- > new` → task `content` |

**Out of scope until this gate passes:** new version bumps without a linked GitHub issue, `task-11-16` cleanup, perf work, other notes.

## Expected (one sentence)

After **Synchronize** on a build recorded in `manifest.json`, TickTick **Comments** for `6ad83bc…` contains **`comment 1`** and **`test-new-verision`** (plain titles); task body stays **`new`**.

## GitHub tracking

Create issues from [`docs/github-issues/`](../github-issues/) (copy bodies). Close sub-issues when checkboxes are done; close epic when `ABYSS_FIRST_CASES.md` results row is **pass** with evidence.

| Issue file | Title (suggested) |
|------------|-------------------|
| [`00-epic-test-11-12.md`](../github-issues/00-epic-test-11-12.md) | Epic: Pilot gate test-11-12 Comments |
| [`01-baseline-evidence.md`](../github-issues/01-baseline-evidence.md) | Phase 0: Baseline evidence |
| [`02-which-path-runs.md`](../github-issues/02-which-path-runs.md) | Phase 1: Which sync path runs |
| [`03-fix-with-test.md`](../github-issues/03-fix-with-test.md) | Phase 2: Fix + regression test |
| [`04-pilot-verify-close.md`](../github-issues/04-pilot-verify-close.md) | Phase 3: Pilot verify & close gate |

**GitHub (tt-sync):** [Epic #14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14) · [#10 Phase 0](https://github.com/semyon-alekseev-noveo/tt-sync/issues/10) · [#11 Phase 1](https://github.com/semyon-alekseev-noveo/tt-sync/issues/11) · [#12 Phase 2](https://github.com/semyon-alekseev-noveo/tt-sync/issues/12) · [#13 Phase 3](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13)

**Published results (git):** [`docs/pilot/results/PILOT-GATE-TEST-11-12/INDEX.md`](results/PILOT-GATE-TEST-11-12/INDEX.md) — canonical evidence; issues link here.

---

## Execution plan (agent / developer)

### Phase 0 — Baseline (no code)

- [ ] Obsidian: plugin **version** in settings = `manifest.json` in pilot folder (`tickticksync-abyss`)
- [ ] Settings: `syncNotes`, `abyssTasksFormat`, `syncAbyssCommentsViaApi` = true (`data.json`)
- [ ] Save `2026-10-21.md`; one manual **Synchronize**
- [ ] Capture evidence pack (same sync id if possible):
  - [ ] Last line in `.tickticksync/write-trace.jsonl` for `6ad83bc…` (`reason`)
  - [ ] Last `kind":"perf"` line in `.tickticksync/perf-pilot.log` (`httpByEndpoint.addTaskComment`, `getTaskComments`)
  - [ ] Journal slice: `grep 6ad83bc .tickticksync/journal/2026-10-21.jsonl | tail -20`
  - [ ] MCP or TT UI: Comments empty vs not
  - [ ] Obsidian console: `Add Task Comment` / `response had no comment id` / `vault-ahead comment push`

**Stop rule:** If plugin version ≠ built `manifest.json`, fix deploy first (no new logic).

### Phase 1 — Hypothesis (pick one path; prove with logs)

Only **one** of these should be responsible for the first successful `addTaskComment` for this task:

| Path | Code | Prove |
|------|------|--------|
| A | Pre-pull `pushLocalEditsFirst` → `checkFileForModifications` → `sweepAbyssCommentsInFile` | `perf` push phase; journal `obs->tt` comment; file in registered metadata |
| B | `vaultLineBehindTask` during `vaultReconcile` | `write-trace` `vault-comments-ahead` **and** `addTaskComment` in same sync |
| C | `preparePersistNetwork` on vault write | `write-trace` / journal on `tt->obs` file update |

Checklist:

- [ ] Confirm `2026-10-21.md` is in **file metadata** (registered for manual pre-pull)
- [ ] If path A never runs → issue **BUG-COMMENT-MANUAL-PRE-PULL** or registration
- [ ] If path B runs but `addTaskComment` = 0 → reconcile gating (`vaultHasUnpushed`, `commentsNeedSync`, empty `taskLines`)
- [ ] If `addTaskComment` > 0 but TT empty → **BUG-COMMENT-PUSH-NO-ID** or wrong task/project
- [ ] If trace says `vault-comments-ahead` but TT empty → false success (map upsert only) — **BUG-COMMENT-DISK-READ** / return value

Document chosen hypothesis in the GitHub issue before Phase 2.

### Phase 2 — Fix (DEV_FLOW)

- [ ] One case ID owns the fix (update row in `ABYSS_FIRST_CASES.md` if behavior definition changes)
- [ ] **Failing** test named with that ID (extend `test1112PilotRepro.test.ts` or `vaultCommentBehind.test.ts`)
- [ ] Minimal code change; no unrelated refactors
- [ ] `npx vitest run` + `npm run build`
- [ ] `TEST_PLAN.md` + `CHANGELOG.md` in same PR
- [ ] Deploy `dist/` to pilot; record version in issue

### Phase 3 — Pilot verify

- [ ] Reload Obsidian; confirm version
- [ ] **Synchronize** once; do not edit task line during sync
- [ ] TT Comments: both strings present
- [ ] Append **pass** row to `ABYSS_FIRST_CASES.md` results log (build, evidence: MCP or screenshot + journal)
- [ ] Close GitHub sub-issues and epic

---

## What we already know (do not re-litigate without new evidence)

- MCP `add_comment` on this task **works** (API healthy).
- `write-trace` showed `vault-comments-ahead` while TT stayed empty → push reported success without TT rows (fixed in code as **2.0.72** map-upsert guard; **pilot not re-verified**).
- `behindComments` after failed push pulled wrong direction (**2.0.71** `vaultWantsPush`; pilot not re-verified).
- Open note + reconcile historically used editor text; **2.0.72** uses `syncRead` for comment probe.

Until Phase 0 checklist is filled for **2.0.72+**, further code changes are **blocked** by this plan.

## References

- [`ABYSS_FIRST_CASES.md`](../../ABYSS_FIRST_CASES.md)
- [`TEST_PLAN.md`](../../TEST_PLAN.md) — `BUG-COMMENT-RECONCILE-UPDATE`
- [`docs/TICKTICK_DELTA_API.md`](../TICKTICK_DELTA_API.md)
- [`docs/ANALYST_REFERENCE_DIAGRAMS.md`](../ANALYST_REFERENCE_DIAGRAMS.md)
