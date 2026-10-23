# Dual-analyst brief — PERF-DELTA / #62 after 2.0.81 idle fail

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [tt-sync #62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) |
| Recorded | 2026-10-23 UTC (agent) |
| Inputs | [81-idle-zero-2.0.81.md](81-idle-zero-2.0.81.md), [62-slice1-idle-comment-probe.md](62-slice1-idle-comment-probe.md), `docs/TICKTICK_DELTA_API.md` §3.2, dual-analyst consensus |
| Status | **consensus** — slice order locked; slice 2 implements in code |

## A + B agreement

Both analysts agree:

1. **Delta is cheap.** Quiet `[perf]` shows `batch/check` = 2; wall time is dominated by Abyss comment orchestration, not checkpoint pull.
2. **~1757 `getTaskComments` on quiet ×2** come from comment push/persist paths — not from slice-1’s `vaultLineBehindTask` matched-count gate (already unit-locked).
3. **No comment delta API.** Comments are not in `batch/check`. The only cheap signals are task-level `commentCount` / `etag` on `update[]` (and full `batch/check/0`).
4. **Unknown Dexie `commentCount` forces probes.** Echo-skip on matching `etag` can leave `commentCount` unset forever → idle paths treat “unknown + vault threads” as must-GET.
5. **Double-sweep is real but second-order for slice 2.** Manual quiet hits Comments API from the hash-unchanged path **and** `sweepAbyssCommentsInFile`; stopping that is slice 3 and must stay **BUG-COMMENT-NO-PUSH**-safe.
6. **`preparePersistNetwork` GETs every task in a file write group** even when the eventual vault write is a no-op (`vaultWrites` 0 on quiet). That is a first-class idle cost.

## API surfaces (relevant)

| Surface | Role for idle |
|---------|----------------|
| `GET batch/check/{cp}` | Cheap delta; carries `commentCount` / `etag` on tasks in `update[]` / `add[]` — **no comment bodies** |
| `GET .../task/{id}/comments` | Only N+1 body fetch; must be gated |
| Dexie `LocalTask.task.commentCount` / `etag` | Local cache of the cheap signals |
| Dexie `taskCommentMaps` | Identity for vault↔TT threads without re-GET when count matches and maps cover keys |

## Call graph — owners of the 1757

Quiet manual sync (evidence: `81-idle-zero-2.0.81.md`): `getTaskComments` **1757**, `getTaskById` **68**, `vaultWrites` **0**, `batch/check` **2**. Startup same session: comments **879** (~half).

| Owner | Why it fires on quiet | Approx shape |
|-------|----------------------|--------------|
| `syncAbyssCommentsToTickTick` | Always `getTaskComments` before plan + again after push (even when no creates/deletes) | Dominant per-task cost |
| Hash-unchanged path in `checkLineForModifications` | Calls sync when Comments API enabled and not `identifiedOnly` | Pass 1 of double-sweep |
| `sweepAbyssCommentsInFile` | BUG-COMMENT-NO-PUSH full-file sweep after line walk | Pass 2 of double-sweep (~2× vs startup) |
| `preparePersistNetwork` | `syncAbyssCommentsToTickTick` + **another** `getTaskComments` for merge/`_apiComments` before every file persist | Fires even when write later skipped |
| `vaultLineBehindTask` | Slice 1 already skips when `commentCount` matches; still probes when count **unknown** | Residual when Dexie lacks count |

Startup ~879 vs quiet ~1757 fits **one orchestration pass vs double-sweep**, not a larger vault.

## Ranked options

| Rank | Option | Leverage | Risk |
|------|--------|----------|------|
| **A (slice 2)** | Persist/refresh `commentCount` (+ `etag` if present) from delta into Dexie, including **echo-skip backfill** when local count missing; idle-fast skip inside `syncAbyssCommentsToTickTick`; gate `preparePersistNetwork` GET | Highest safe cut without touching NO-PUSH | Low if skip predicates match maps + count + no dup keys / wipe |
| **B (slice 3)** | Stop double-sweep / narrow manual quiet comment scope | ~2× remaining sweep GETs | Medium — must not regress BUG-COMMENT-NO-PUSH |
| **C** | Pilot `TP-DELTA-*` / `TP-DELTA-COMMENT` on tip | Unlocks §3.2 comment policy confidence | Evidence only |
| **D** | Re-pilot `TP-IDLE-ZERO` after A (+ ideally B) | Gate close / fail with new numbers | Depends on merge + release |
| **E (P2)** | TECH-START-1 / register full `.md` scan | Startup wall-time | Separate from comment N+1 |
| **F (P2)** | Per-phase `[perf]` comment counters | Diagnosis | No behavior change |

## Recommended slice order

1. **Slice 2 (this work):** (A) `commentCount` backfill on pull + idle-fast `syncAbyssCommentsToTickTick` + `preparePersistNetwork` gate.
2. **Slice 3:** Carefully stop double-sweep / quiet scope (BUG-COMMENT-NO-PUSH safe).
3. **Pilot:** `TP-DELTA-*` in parallel with engineering; **re-run `TP-IDLE-ZERO`** after slice 2/3 land on a released tip.
4. **Later:** TECH-START-1 / register scan; optional richer `[perf]` comment counters.

Do **not** invent a live pass for `TP-IDLE-ZERO` until re-measured.

## Open questions

1. Does a TickTick-app-only comment bump `commentCount` and/or `etag` and appear in `update[]`? (**TP-DELTA-COMMENT** — still not run.)
2. After slice 2, what share of the 1757 remains from double-sweep vs still-unknown counts on tasks never seen in a full `batch/check/0`?
3. Are the 68 quiet `getTaskById` a separate hotspot (register / move / other) or collateral of comment reconcile?
4. Is a one-shot full-checkpoint backfill of `commentCount` required for vaults that only ever delta-sync after upgrade, or is echo-skip merge enough once one full sync runs?

## Checklist linkage (#62)

- [x] Dual-analyst consensus written (this file)
- [ ] Slice 2 code + vitest (child issue / this PR)
- [ ] Slice 3 double-sweep (child)
- [ ] `TP-DELTA-*` pilot (child)
- [ ] Re-pilot `TP-IDLE-ZERO` after slice 2/3 (child)
- [ ] TECH-START-1 / register (optional P2 child)
- [ ] Per-phase `[perf]` comment counters (optional P2 child)
