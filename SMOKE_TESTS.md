# Smoke tests — pilot vault (`Thinkpad-tts-test`)

**Purpose:** Repeatable checks before touching live `Thinkpad`.  
**Logic (2026-10-18):** What counts as a task, which folders push, how a GTD tag maps, and which TickTick tasks come back. See `ABYSS_FIRST_PLAN.md` §6.  
**Deletion (2026-10-17):** Obsidian line removed → TickTick task deleted after one confirm (**plugin ≥ 2.0.28**).

Full case write-ups: `GTD_SYNC_CASES.md` §8 (`CASE-DEL-*`).  
Operator preset: `00 Inbox/TTS-data-preset.json`, runbook `00 Inbox/TTS-PILOT-RUN.md`.

---

## Before you start

| Check | Expected |
|--------|----------|
| Vault | `/home/sam/obsidian/Thinkpad-tts-test` only |
| Plugin | `tickticksync-abyss` **≥ 2.0.36** for rename TT→Obs in `abyss-active.md`; **≥ 2.0.35** source tag; **≥ 2.0.28** deletion |
| Login | Access Control shows valid session |
| GTD settings | `syncedLists` = six `TTS-*`; `syncScopeFolders` = `00 Inbox/`, `10 Projects/`, `30 Tasks/` |
| Sync mode | Manual (`automaticSynchronizationInterval`: 0) |
| Evidence | `.tickticksync/journal/YYYY-MM-DD.jsonl`; note `ticktick_id` before delete |

**Pass rule for deletion suite:** Every **Must** row below is **Pass** with evidence (journal `dir":"obs->tt"`, `op":"delete"`, matching `taskId`, or TT UI/MCP shows task gone).

---

## Logic smoke (must pass)

Automated rows run with:

```bash
npx vitest run src/test/logicSmoke.test.ts src/test/listMapping.test.ts src/test/projectParentKeep.test.ts src/test/foolCases.test.ts src/test/syncScope.test.ts src/test/syncSmoke.test.ts
```

| ID | What you prove | How |
|----|----------------|-----|
| LOGIC-1 | `- [[]]` is not a checkbox; `- [ ]` / `- [x]` / `- [/]` are | `logicSmoke.test.ts` |
| LOGIC-2 | A checkbox with no words (tags only) is not pushed | `logicSmoke.test.ts` |
| LOGIC-3 | Push only from `00 Inbox/`, `10 Projects/`, `30 Tasks/`. `40 KB/` does not push | `logicSmoke.test.ts` |
| LOGIC-4 | TickTick → vault if the task is on an allow-listed list **or** has `tts-test` | `logicSmoke.test.ts` |
| LOGIC-5 | `#inbox` → TTS-Inbox, `#type/next` → TTS-nextAction; the list writes the tag back | `logicSmoke.test.ts` |
| LOGIC-6 | Tag mode: stage is a TickTick tag; the helper does not pick a list | `logicSmoke.test.ts` |
| LOGIC-7 | Tag mode through the parser: line tag becomes a TickTick tag and the reverse rewrites the line; list mode moves the list and strips the stage tag | `listMapping.test.ts` |
| LOGIC-8 | A line in a project note is a subtask on the projects list | `projectParentKeep.test.ts` |
| LOGIC-9 | Live: **test 3** and **test 4** are subtasks of Phase C on TTS-Projects | TickTick `get_task_by_id` |
| LOGIC-10 | `#inbox` is removed when the task is not on the inbox list | `foolCases.test.ts` |
| LOGIC-11 | A line that is only `%%`, or has an unclosed `%%`, is not pushed. A normal title is | `foolCases.test.ts` |
| LOGIC-12 | A new line is pushed when the cursor leaves it, not while you are still typing | `syncSmoke.test.ts` SYNC-9; live: `lineNumberCheck` → `lineSettledCheck` |

---

## Bidirectional sync smoke (automated)

| ID | What you prove | How |
|----|----------------|-----|
| SYNC-1 | A task born on **TTS-Inbox** is written to `00 Inbox/abyss-active.md` (or Abyss `taskFilePath`) | `syncSmoke.test.ts` |
| SYNC-2 | A task born on another pilot list uses that list’s mirror `.md` | `syncSmoke.test.ts` |
| SYNC-3 | Pull: allow-listed list **or** `tts-test` tag | `syncSmoke.test.ts` |
| SYNC-4 | After list move, stale `#inbox` is dropped on the TickTick task | `syncSmoke.test.ts` |
| SYNC-5 | Tag/list move is detected when local `projectId` already matches remote | `syncSmoke.test.ts` |
| SYNC-6 | Obs `#type/next` → **TTS-nextAction**; stage tag not duplicated on TT | `syncSmoke.test.ts` |
| SYNC-7 | TT move to **TTS-nextAction** rewrites the line to `#type/next` and drops `#inbox` | `syncSmoke.test.ts` |
| SYNC-8 | `#inbox` with file default **TTS-Inbox** does not route to the live **Inbox** list | `syncSmoke.test.ts` (LOGIC-A) |
| SYNC-9 | `%%` / unclosed capture fragments are not pushed | `syncSmoke.test.ts` |
| SYNC-10 | Pilot `tagListMappings` rows resolve both ways | `syncSmoke.test.ts` |
| SYNC-11 | Abyss `taskFilePath` is read; fallback `00 Inbox/abyss-active.md` | `syncSmoke.test.ts` |

Not in this automated run (needs Obsidian + TickTick UI):

| ID | What you prove |
|----|----------------|
| SYNC-L1 | LOGIC-B live: add `#type/next` on a synced TTS-Inbox line → sync → task on **TTS-nextAction** |
| SYNC-L2 | LOGIC-C: untagged checkbox still syncs to TTS-Inbox; TT rename/complete updates the line |
| SYNC-L3 | LOGIC-D: complete + rename on TTS-Inbox updates the vault line |
| SYNC-L4 | LOGIC-E live: create task in **TTS-Inbox** in TickTick → appears in `abyss-active.md` with `#inbox` |
| SYNC-L5 | LOGIC-F live: move that task to **TTS-nextAction** → `#inbox` gone on TT and on the line |
| SYNC-L6 | Live MCP smokes: create TT tasks **without** `obsidian` in `tags` (source tag comes from pull logic) |

---

## Rename matrix (2.0.36+)

| ID | Direction | Setup | Pass when |
|----|-----------|--------|-----------|
| R1 | TT → Obs | Task on **TTS-Inbox** → sync → rename title in TickTick → sync | Checkbox text in `00 Inbox/abyss-active.md` matches TT; no journal `obs→tt` that reverts the title |
| R2 | TT → Obs | Same as R1 with **delta** rename (often unchanged `modifiedTime` on TT) | Same as R1 (regression for 2.0.36) |
| R3 | Obs → TT | Line in `abyss-active.md` → sync → rename in vault → sync | TT title matches vault |
| R4 | Obs → TT | Rename + complete in vault | TT title + status |
| R5 | TT → Obs | Complete in TT, then rename in TT | Vault `[x]` and title |
| R6 | Obs → TT | Complete in vault, then rename | Both sides |
| R7 | TT → Obs | Child in `10 Projects/*` Active Zone | Line in project note updates |
| R8 | Obs → TT | Rename child in project note | TT subtask title updates |

**Agent automation:** vitest + TickTick MCP + `obsidian://…tts-sync` can cover R1/R2 **only if** vault `Thinkpad-tts-test` is open and plugin loaded (URI alone is not enough when Obsidian is idle). **Deletion rows (DEL-*) need a human** — see below.

---

## Deletion smoke matrix (must pass)

| ID | What you prove | Must |
|----|----------------|------|
| [CASE-DEL-1](GTD_SYNC_CASES.md#case-del-1--single-line-removed-one-confirm-tt-delete) | One checkbox line removed → **one** sync → **one** dialog → **Confirm** → task gone on TT | **Yes** |
| [CASE-DEL-2](GTD_SYNC_CASES.md#case-del-2--many-files-one-modal-202028) | Lines removed in **2+** notes in one sync → **one** aggregated dialog (not one per file) | **Yes** |
| [CASE-DEL-3](GTD_SYNC_CASES.md#case-del-3--cancel-leaves-ticktick-unchanged) | Same setup → **Cancel** on dialog → task **still** on TT; no silent “success” | **Yes** |
| [CASE-DEL-4](GTD_SYNC_CASES.md#case-del-4--project-active-zone-child-removed) | Remove child under `## Active Zone` in `10 Projects/*.md` → confirm → child gone on **TTS-Projects** | **Yes** |
| [CASE-DEL-5](GTD_SYNC_CASES.md#case-del-5--journal-and-local-db-align) | After confirm: journal delete + task not recreated on next sync | **Yes** |
| [CASE-DEL-N1](GTD_SYNC_CASES.md#case-del-n1--out-of-scope-line-removed-no-tt-delete) | Line removed **outside** `syncScopeFolders` → no TT delete prompt / TT unchanged | **Yes** |

---

## Further testing plan (after 2.0.36)

| Phase | Scope | Owner | Est. |
|-------|--------|-------|------|
| **A — automated** | `npx vitest run` (full repo) + logic/SYNC vitest bundle in § Logic smoke | agent / CI | 10 min |
| **B — live sync (no modal)** | SYNC-L4/L5, R1/R2/R3, R7/R8: MCP or TT app + **Sync** in Obsidian; check `abyss-active.md`, project notes, journal | user or agent *with vault open* | 20 min |
| **C — deletion UX** | CASE-DEL-1…5, DEL-N1: requires **Confirm** on `TaskDeletionModal` | **user only** | 30 min |
| **D — pilot soak** | AF-* duplication cases, DEL-5 second sync, live vault readiness per `PO_STATUS.md` | user | 1–2 h |

**Phase A (2026-10-19):** `npx vitest run` → **527 passed**. Logic/SYNC bundle → **51 passed**.

**Phase B:** User **R1/R2 pass** (2.0.36). Agent run 2026-10-19 with vault open: SYNC-L4 pull **pass** (`agent-phase-b-pull` → `abyss-active.md`); TT rename → **pass** (`agent-phase-b-renamed`); **R7 pass** (`test 3` → `test-3-phase-b-tt` in project note, reverted after). **R3 skip (agent):** editing `.md` on disk does not trigger Obsidian push — rename a line **in the editor**, then Sync. Phase C **skipped** per plan.

**Phase C:** Skipped. Agent **cannot** click Obsidian modals (deletion confirm). Unanswered prompt times out → no TT delete.

**Sync UX (2.0.38+):** Full and inline sync show a **persistent Notice** (top-right, like other plugin toasts) with the current step. **Scheduled** interval sync is silent by default; enable *Show progress during scheduled sync* under automatic sync settings.

---

## Suggested run order (≈30 min)

1. **CASE-DEL-1** — create a throwaway task in `00 Inbox/` with `#tts-test`, sync, copy `ticktick_id`, delete line, sync, confirm.  
2. **CASE-DEL-3** — repeat with a second task; click **Cancel**; verify TT unchanged.  
3. **CASE-DEL-4** — use a pilot project note (e.g. add `- [ ] SM-DEL probe #tts-test` in Active Zone), sync, remove line, sync, confirm.  
4. **CASE-DEL-2** — remove one line each from two scoped files in the same session, **one** sync, expect **one** dialog listing both.  
5. **CASE-DEL-N1** — only if you have a note outside scope (e.g. under `40 KB/` with a synced id); otherwise **Skip** with reason.  
6. **CASE-DEL-5** — second sync after DEL-1/4; no new TT task, no duplicate dialog spam.

---

## What we are **not** proving in this suite

| Topic | Where |
|--------|--------|
| TickTick → Obsidian delete | `onTickTickDeletion` / vault detach — separate cases later |
| Full `CASE-T*` / `CASE-L*` matrix | `GTD_SYNC_CASES.md` (SYNC-* covers core pull/push/tag routing) |
| Live **Projects** list pollution | Pilot uses **TTS-Projects** only |

---

## Result log (fill per run)

| Date (UTC) | Plugin | Tester | LOGIC / SYNC auto | DEL-1 | DEL-2 | DEL-3 | DEL-4 | DEL-5 | DEL-N1 | Notes |
|------------|--------|--------|-------------------|-------|-------|-------|-------|-------|--------|-------|
| 2026-10-18 | 2.0.31 | agent | LOGIC 1–9 pass. C pass. A landed on the real Inbox. B move not applied | | Pass | | | | | `#inbox` matched the real Inbox. Those tasks were deleted. |
| 2026-10-19 | 2.0.32 | agent | LOGIC 1–9 pass. A32 pass. B2 moved after reload | | Pass | | | | | LOGIC-B2 `6ad4df19…` is on TTS-nextAction (`6ad1abfe…fe46`) after reload. Tags on the task: `obsidian` only. |
| 2026-10-19 | 2.0.34 | agent | LOGIC 1–12 + SYNC 1–11 pass (vitest). **SYNC-L4/L5 pass live** | | | | | | | `6ad5a083…`: TT TTS-Inbox → `abyss-active.md` + `#inbox`; move to TTS-nextAction → TT tags `obsidian` only, line `#type/next` (no `#inbox`). |
| 2026-10-19 | 2.0.34→35 | agent + user sync | **SYNC-L2** push pass (`6ad5a152…`); TT rename+complete pass. **SYNC-L3** pull create pass (`6ad5a158…`). Pull rename/complete: user ran sync; verify lines `[x]` + new titles | | | | | | | Source-tag fix in 2.0.35: TT-born pull → `#ticktick`, not `#obsidian`. |
| 2026-10-19 | 2.0.36 | user | **R1/R2 pass** (TTS-Inbox → rename in TT → `abyss-active.md` matches) | | | | | | | |
| 2026-10-19 | 2.0.36→37 | agent + vault open | Phase B: pull+TT rename **pass**; **R7 pass**; R3 N/A (disk edit). Progress modal in **2.0.37** | skip C | | | | | | Probes cleaned from `abyss-active.md` |

---

## References

- `GTD_SYNC_CASES.md` §8  
- `CHANGELOG.md` (2.0.28 deletion UX)  
- `PROJECT_STATE.md` — Validation
