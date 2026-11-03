# 37 — Analyst debate: sync conflict refactor (identity × intents)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 37 (analysis) |
| Case | UX-SYNC-ONE-FLOW (product) → refactor target below |
| Status | **Agreed** — implementation not started |
| Analysts | A Identity pipeline; B Policy matrix |

## Trigger

Post-2.0.96 pilot: Rebind (~28) does not drain detach-heavy holds (~195); Rebind marker rewrite → Confirm Deletion false wipe of displaced TT ids. Owner: stacked patches break neighbors. Need one coherent logic before more UX copy.

## Hypotheses

| | A — Identity pipeline | B — Intent / policy matrix |
|--|----------------------|---------------------------|
| Core | One mutation authority; identity (Link/Detach/Insert/prune) **before** delete planners | Keep detectors; every mutation typed Intent + precedence; threshold only on destructives |
| Fix false wipe | Provenance: rewrite ≠ user-removed | Link tombstones block PushDeleteTT same run |
| Fix Rebind loop | DetachMarker for TT-gone in same identity pass | DetachMarker first-class; never inflate wipe threshold |

## Debate outcome (both signed)

**Unified logic (convergence):**

1. Synchronize: prepare → **identity/Link apply with provenance** → re-scan `presentIds` → compile remaining intents → apply by precedence → one discrepancy UI for residual **destructives** only.
2. Intents: `Link`, `DetachMarker`, `InsertLine`, `PullStripVault`, `PushDeleteTT` (+ comment siblings).
3. Precedence: Link ≻ DetachMarker ≻ InsertLine ≻ PullStripVault ≻ PushDeleteTT.
4. **Mismatch ≠ auto PushDeleteTT.** Confirm/Apply only for proven user-removed or explicit authorize.
5. Threshold / empty-side guard counts **destructive** intents only.
6. Rebind/Rematch = Link (+ InsertLine) modes; stamp tombstones on displaced ids.
7. Remote-gone → DetachMarker in-session (text kept); must not re-hold after Rebind.
8. Check sync cache = rare full scan of the **same** enumerator (no second wipe dialect).
9. Bootstrap empty Dexie / checkPoint 0 stays fail-closed; no invent from empty baseline.
10. Pilot gate: mixed hold after Rebind must not Confirm-wipe rebound/displaced ids; prove ×2.

## Non-goals (this note)

- No code in this phase.
- Title-matching quality unchanged (still conservative; collisions → skip/report).

## Next

- Analyst case ID in `ABYSS_FIRST_CASES.md` for the refactor epic (e.g. `ARCH-SYNC-INTENT-IDENTITY`).
- Developer: failing tests named by that ID, then phase order change (identity before `prepareDeletionGuard` residual destructives).

## References

- Live symptoms: `deletions-2026-11-03T08-46-17-235Z.md` (227 = 32 delete + 195 detach); toast rebound 28 / inserted 0.
- `UX-SYNC-ONE-FLOW`, `massDeleteGuard.ts`, `rebindVault.ts`, `deletionGuardRun.ts`, `TaskDeletionHandler.ts`
- `CHANGELOG.md`
