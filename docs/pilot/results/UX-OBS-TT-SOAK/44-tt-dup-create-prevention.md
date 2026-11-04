# 44 — Same-title TT duplicate **creation** root cause

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 44 (root cause / bug) |
| Case | `BUG-TT-DUP-CREATE-ON-STRIP-SYNC` |
| Status | **root cause** from pilot journal; unit fix this PR; live prove ×2 **not run** |
| Related | Confirm InsertLine vault twins [`41-…`](./41-confirm-rebind-dup-fail.md); TT-only cleanup DoR [`43-…`](./43-conflict-resolution-tt-dedupe.md) / [#276](https://github.com/semyon-alekseev-noveo/tt-sync/issues/276); open-note Confirm [`42-…`](./42-opennote-delete-confirm.md) |

## Meta

| Field | Value |
|-------|--------|
| Vault | Thinkpad-tts-test (pilot) |
| Note | `10 Projects/PKM - journaling.md` |
| Titles | «Подумать над механикой / шаблонами / интеграцией…» |
| Parent | `6ae17a048f0871a7dbb8c8ca` (project note) |

## Ranked creation causes

1. **`checkFileForNewTasks` → `addNewTask` → `createTask`** (primary, preventable)  
   - `findOrphanByTitle` reattached only when **exactly one** Dexie orphan matched title+file.  
   - After strip / Rematch / multi-wave history, several same-title orphans → function returned `undefined` → **silent new TT**.  
   - Journal: **2026-11-02 05:32Z** created `6ae82055` / `6ae82058` / `6ae82059`; **2026-11-03 10:44Z** created `6ae9baf1`; **2026-11-04 07:56:47Z** created `6aeae53f64633723f94008aa` (write-trace: `addNewTask` / `checkFileForNewTasks` during `syncFiles`).

2. **Confirm Rebind InsertLine** (secondary, vault-only — does **not** create TT)  
   - **2026-11-04 05:43:47Z** rematch `writeFile` `newCount:3` beside live same-title markers (`…eed586`–`…eed591` kept; planned ids `…eed592` / `…eed593` / `…606e` InsertLined).  
   - Existing TT ids reused on new vault lines → twins in Obsidian; TickTick unchanged. Fixed for Confirm by `BUG-CONFIRM-REBIND-DUP` (`allowDisplaceLiveSameTitle`).

3. **Open-note 5s / Delete Confirm** — not a create path (`BUG-OPENNOTE-DELETE-CONFIRM` / identifiedOnly).

## Rule chosen (fix)

Fail-closed before `createTask` (`sameTitleCreateGuard` / `resolveSameTitleCreate`):

| Situation | Action |
|-----------|--------|
| Exactly one Dexie orphan, same title + **1A** parent, id absent from vault | **Reattach** |
| ≥2 Dexie orphans same title+parent | **Skip create + Notice** (no silent third TT) |
| Zero orphans but vault already has marked same-title sibling | **Skip create + Notice** |
| No same-title peers under parent | **Create** (legitimate) |

## Deduplicate still needed?

**Yes, as safety net — after prevention.** Owner lock: do not ship Deduplicate as the hero PR first («иначе снова кнопка на кнопку»). Prevention stops new waves; already-created TT-only extras (`6ae82055…`, `6ae9baf1…`, `6aeae53f…`, …) still need `UX-SYNC-TT-DEDUPE` (#276) once a vault keeper exists.

## Checklist

- [x] Journal timeline reconstructed (this file)
- [x] AF case `BUG-TT-DUP-CREATE-ON-STRIP-SYNC`
- [x] Unit named by case id
- [ ] Pilot prove ×2 after tip (**not run**)
