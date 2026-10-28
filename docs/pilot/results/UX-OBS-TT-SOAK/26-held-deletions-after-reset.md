# 26 — Held deletions modal after soft Reset + remap + restore

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 26 |
| Case | Mass-delete guard / EMPTY-SIDE-GUARD companion (post-Reset false vault-absent) |
| Vault | Owner live / pilot (screenshot) |
| Status | **Owner action: DO NOT APPLY** — evidence from code + screenshot numbers |

## Owner action (immediate)

**НЕ нажимать Apply once.** Не путать с Settings → **Manage Deleted Tasks** (это другой UI: hard-delete soft-deleted Dexie rows).

На модалке **TickTickSync held deletions** нажать:

1. **Skip deletions this run** — безопасно; удаления не уходят в TickTick; `checkPoint` не двигается.
2. Опционально **Open report** — откроет `.tickticksync/reports/deletions-<timestamp>.md`, затем тот же эффект, что skip (не apply).
3. Закрытие модалки / таймаут без ответа → тоже **skip** (fail-closed).

Тост после skip: *Nothing destructive was applied. Checkpoint unchanged.*

## Inputs

- Screenshot: `87 task deletion(s) … 71.3% of 122 tracked … Creates and updates still run. The checkpoint stays until you apply deletions.`
- Preview lines: `vault-to-ticktick — task — delete` for real projects (Гоша, посудомойка, Налоги, …).
- Context: soft **Reset local sync database** → remap / restore → Synchronize.

## What `vault-to-ticktick — task — delete` means

Plan from `planVaultTaskDeletions` (`massDeleteGuard.ts`): Dexie has a live task (`deleted` false) whose `taskId` is **not** found in any vault `%%[ticktick_id:: …]%%` (`scanVaultForDeletionGuard` → `presentIds`), and the row is in push scope (or tagged `#obsidian`).

That is **not** «user deleted the checkbox.» After Reset + TT restore + pull:

1. Dexie refills from TickTick (122 tracked).
2. Vault lines may still lack matching markers (old pre-wipe ids, incomplete re-link, TT-only / project rows without vault checkboxes).
3. Guard sees «vault-absent» → plans vault→TT **delete**.
4. Threshold trips: 87 > 10 **and** 71.3% > 20% → modal holds the plan (`reason` likely `threshold`).

If **Apply once** → `TaskDeletionHandler.deleteTasksByIds` would delete those TickTick tasks for real.

## How to clear / dismiss without applying

There is **no persistent deletion queue** to purge in Settings. The plan is recomputed each sync.

| Action | Effect |
|--------|--------|
| **Skip deletions this run** | This run: `deletionConfirmMode = skip`; no vault→TT deletes; checkpoint held. Creates/updates still run. |
| Close / timeout | Same as skip. |
| **Open report** | Writes report; choice ≠ apply → same hold as skip. |
| Next Synchronize | Guard may show again until vault markers match Dexie (or counts fall under threshold). |
| **Manage Deleted Tasks** | Unrelated — permanent purge of already soft-deleted Dexie records. Do **not** use for this modal. |

Code: `MassDeleteGuardModal` → `settleGuardChoice` → `pullOptionsForMode('skip')` → `{ applyDeletions: false, advanceCheckpoint: false }`; `TaskDeletionHandler.processSyncRemovedTasks` returns early when mode is `skip`.

## Bug?

- Guard **holding** the batch: **working as designed** (EMPTY-SIDE-GUARD / threshold).
- **Planning** 87 real-project deletes as vault-absent after Reset+restore: **false-positive class** (Dexie has TT tasks; vault lines do not match → invented vault→TT deletes). Related to post-Reset rematch debt; companion to **BUG-RESET-CACHE-DELETE** (that one strips *vault* lines on orphan 404; this path would delete *TickTick* tasks). Not a reason to Apply.

## Checklist

- [x] Owner told Skip / DO NOT Apply
- [x] Direction decoded (`vault-to-ticktick`)
- [x] Discard path documented (modal Skip; no settings «discard queue»)
- [ ] Optional: later fix so rematch/bootstrap does not plan mass vault-absent deletes after Reset (product change; not this note)
