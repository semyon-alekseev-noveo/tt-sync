# 44 — Same-title TT duplicate **creation** root cause + live prove

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 44 (root cause / bug) |
| Case | `BUG-TT-DUP-CREATE-ON-STRIP-SYNC` |
| Status | **live pass** ×2 after parent-bypass fix (tip deploy); first tip@`8528baa` prove **fail** (inbox parent) |
| Related | Confirm InsertLine vault twins [`41-…`](./41-confirm-rebind-dup-fail.md); TT-only cleanup DoR [`43-…`](./43-conflict-resolution-tt-dedupe.md) / [#276](https://github.com/semyon-alekseev-noveo/tt-sync/issues/276); open-note Confirm [`42-…`](./42-opennote-delete-confirm.md) |

## Meta

| Field | Value |
|-------|--------|
| Vault | Thinkpad-tts-test (pilot) |
| Note | `10 Projects/PKM - journaling.md` |
| Titles | «Подумать над механикой»; «Подумать над интеграцией с другими механиками обсидиан» |
| Parent | `6ae17a048f0871a7dbb8c8ca` (project note) |
| Tip | **2.0.96** `tickticksync-abyss` with `resolveSameTitleCreate` + file-scoped title fallback |

## Ranked creation causes

1. **`checkFileForNewTasks` → `addNewTask` → `createTask`** (primary, preventable)  
   - `findOrphanByTitle` reattached only when **exactly one** Dexie orphan matched title+file.  
   - After strip / Rematch / multi-wave history, several same-title orphans → function returned `undefined` → **silent new TT**.  
   - Journal: **2026-11-02 05:32Z** created `6ae82055` / `6ae82058` / `6ae82059`; **2026-11-03 10:44Z** created `6ae9baf1`; **2026-11-04 07:56:47Z** created `6aeae53f64633723f94008aa` (write-trace: `addNewTask` / `checkFileForNewTasks` during `syncFiles`).

2. **Parent-key bypass (live fail 2026-11-04 09:36Z)**  
   - Tip after #279 (`8528baa`) still created `6aeafcb083c55223f9dcb7a2` on strip→flush: `convertLineToTask` inferred **inbox** (`parentId` empty / `projectId` inbox) while Dexie orphans stayed under project parent → `decideSameTitleCreate` parent filter dropped peers → `createTask`.  
   - Fix: file-scoped same-title orphan fallback (ignore parent mismatch after parent-matched pass).

3. **Confirm Rebind InsertLine** (secondary, vault-only — does **not** create TT)  
   - **2026-11-04 05:43:47Z** rematch `writeFile` `newCount:3` beside live same-title markers. Fixed for Confirm by `BUG-CONFIRM-REBIND-DUP`.

4. **Open-note 5s / Delete Confirm** — not a create path (`BUG-OPENNOTE-DELETE-CONFIRM` / identifiedOnly).

## Rule chosen (fix)

Fail-closed before `createTask` (`sameTitleCreateGuard` / `resolveSameTitleCreate`):

| Situation | Action |
|-----------|--------|
| Exactly one Dexie orphan, same title + **1A** parent, id absent from vault | **Reattach** |
| ≥2 Dexie orphans same title+parent | **Skip create + Notice** (no silent third TT) |
| File-scoped same-title orphans under **other** parent (inbox inference) | **Reattach** (unique) / **Skip** (multi) |
| Zero orphans but vault already has marked same-title sibling | **Skip create + Notice** |
| No same-title peers under file | **Create** (legitimate) |

## Live prove ×2 (2026-11-04)

Method: close note → strip `%%[ticktick_id::…]%%` (or already unmarked) → `taskModificationDetector.checkFileForNewTasks` (addNewTask path) → Synchronize with Rebind/Don’t delete (never Apply). Assert: **no journal `task`/`create`**; `afterCheckFileMarker` null (skip) or existing id (reattach); MCP ids ⊆ before set.

| Prove | Title | Before TT ids | After checkFile marker | After sync marker | New TT create? |
|-------|-------|---------------|------------------------|-------------------|----------------|
| 1 | Подумать над механикой | `6ae82055…591`, `6ae9baf1…606e`, `6aeae53f…08aa`, `6aeafcb0…b7a2` | **null** (skip) | `6aeafcb0…b7a2` (Rebind) | **no** |
| 2 | Подумать над интеграцией… | `6ae82059…593`, `6ae42397…588` | **null** (skip) | `6ae82059…593` (Rebind) | **no** |

Vault-local runner JSON (not committed): `.tickticksync/_prove44-1.json`, `_prove44-2.json`, `_prove44-NaN.json` (botched first attempt).

### First tip@`8528baa` attempt (honest fail)

| When (UTC) | Result |
|------------|--------|
| 09:36:48Z | Strip → edit flush `addNewTask` → **create** `6aeafcb083c55223f9dcb7a2` into inbox then moved under PKM parent. Parent-key hole. |

## Deduplicate still needed?

**Yes, as safety net — after prevention.** Owner lock: do not ship Deduplicate as the hero PR first. Prevention stops new waves; already-created TT-only extras (`6ae82055…`, `6ae9baf1…`, `6aeae53f…`, `6aeafcb0…`, …) still need `UX-SYNC-TT-DEDUPE` (#276).

## Checklist

- [x] Journal timeline reconstructed (this file)
- [x] AF case `BUG-TT-DUP-CREATE-ON-STRIP-SYNC`
- [x] Unit named by case id
- [x] Parent-bypass regression unit (inbox wantParent + file orphans)
- [x] Pilot prove ×2 after tip + fix (**pass**)
