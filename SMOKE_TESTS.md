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
| Plugin | `tickticksync-abyss` **≥ 2.0.33** for the logic rows; **≥ 2.0.28** for deletion |
| Login | Access Control shows valid session |
| GTD settings | `syncedLists` = six `TTS-*`; `syncScopeFolders` = `00 Inbox/`, `10 Projects/`, `30 Tasks/` |
| Sync mode | Manual (`automaticSynchronizationInterval`: 0) |
| Evidence | `.tickticksync/journal/YYYY-MM-DD.jsonl`; note `ticktick_id` before delete |

**Pass rule for deletion suite:** Every **Must** row below is **Pass** with evidence (journal `dir":"obs->tt"`, `op":"delete"`, matching `taskId`, or TT UI/MCP shows task gone).

---

## Logic smoke (must pass)

Automated rows run with:

```bash
npx vitest run src/test/logicSmoke.test.ts src/test/listMapping.test.ts src/test/projectParentKeep.test.ts src/test/foolCases.test.ts
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
| LOGIC-12 | Editor sync waits 5 seconds, not 1 | `EventHandlerService.ts` (`5000`) |

Not in this automated run (needs Obsidian):

| ID | What you prove |
|----|----------------|
| LOGIC-A | A line with `#inbox` and no `inbox = TTS-Inbox` row stays on the file default **TTS-Inbox**. It must not land on the real list named Inbox. **≥ 2.0.32** |
| LOGIC-B | Add `#type/next` to a task that is already on TTS-Inbox. Sync moves it to **TTS-nextAction** and drops that tag from the TickTick task. **≥ 2.0.32** |
| LOGIC-C | A checkbox with no stage tag still syncs to TTS-Inbox. A rename and complete in TickTick come back onto the line. |
| LOGIC-D | TickTick → Obsidian: complete + rename on TTS-Inbox updates the checkbox. |
| LOGIC-E | A task created in **TTS-Inbox** appears in `00 Inbox/abyss-active.md` with `#inbox`. |
| LOGIC-F | Move that task to **TTS-nextAction**. Sync. The `inbox` tag is gone on the task and on the line. |

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
| Pull / list files / tag routing | `CASE-T*`, `CASE-L*` in `GTD_SYNC_CASES.md` |
| Live **Projects** list pollution | Pilot uses **TTS-Projects** only |

---

## Result log (fill per run)

| Date (UTC) | Plugin | Tester | LOGIC-1…12 | DEL-1 | DEL-2 | DEL-3 | DEL-4 | DEL-5 | DEL-N1 | Notes |
|------------|--------|--------|-----------|-------|-------|-------|-------|-------|--------|-------|
| 2026-10-18 | 2.0.31 | agent | 1–9 pass. C pass. A landed on the real Inbox. B move not applied | | Pass | | | | | `#inbox` matched the real Inbox. Those tasks were deleted. |
| 2026-10-19 | 2.0.32 | agent | 1–9 pass. A32 pass. B2 moved after reload | | Pass | | | | | LOGIC-B2 `6ad4df19…` is on TTS-nextAction (`6ad1abfe…fe46`) after reload. Tags on the task: `obsidian` only. |
| 2026-10-19 | working tree | agent | 1–12 pass (18 tests). E and F not run live | | | | | | | LOGIC-10 drops `inbox` off a non-inbox list. LOGIC-11 skips `%%`. LOGIC-12 debounce is 5s. |

---

## References

- `GTD_SYNC_CASES.md` §8  
- `CHANGELOG.md` (2.0.28 deletion UX)  
- `PROJECT_STATE.md` — Validation
