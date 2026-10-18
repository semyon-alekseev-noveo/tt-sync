# Smoke tests — pilot vault (`Thinkpad-tts-test`)

**Purpose:** Repeatable checks before touching live `Thinkpad`.  
**Primary goal (2026-10-17):** Prove **Obsidian line removed → TickTick task deleted** after you confirm once per sync (**plugin ≥ 2.0.28**).

Full case write-ups: `GTD_SYNC_CASES.md` §8 (`CASE-DEL-*`).  
Operator preset: `00 Inbox/TTS-data-preset.json`, runbook `00 Inbox/TTS-PILOT-RUN.md`.

---

## Before you start

| Check | Expected |
|--------|----------|
| Vault | `/home/sam/obsidian/Thinkpad-tts-test` only |
| Plugin | `tickticksync-abyss` **≥ 2.0.28** (BRAT latest on `tt-sync`) |
| Login | Access Control shows valid session |
| GTD settings | `syncedLists` = six `TTS-*`; `syncScopeFolders` = `00 Inbox/`, `10 Projects/`, `30 Tasks/` |
| Sync mode | Manual (`automaticSynchronizationInterval`: 0) |
| Evidence | `.tickticksync/journal/YYYY-MM-DD.jsonl`; note `ticktick_id` before delete |

**Pass rule for deletion suite:** Every **Must** row below is **Pass** with evidence (journal `dir":"obs->tt"`, `op":"delete"`, matching `taskId`, or TT UI/MCP shows task gone).

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

| Date (UTC) | Plugin | Tester | DEL-1 | DEL-2 | DEL-3 | DEL-4 | DEL-5 | DEL-N1 | Notes |
|------------|--------|--------|-------|-------|-------|-------|-------|--------|-------|
| | 2.0.28 | | | | | | | | |

---

## References

- `GTD_SYNC_CASES.md` §8  
- `CHANGELOG.md` (2.0.28 deletion UX)  
- `PROJECT_STATE.md` — Validation
