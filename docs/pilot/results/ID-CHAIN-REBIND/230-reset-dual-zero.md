# 230 — Dexie Reset + dual-zero fail-closed

| Field | Value |
|-------|--------|
| Issue | [#230](https://github.com/semyon-alekseev-noveo/tt-sync/issues/230) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) / matrix [#228](https://github.com/semyon-alekseev-noveo/tt-sync/issues/228) |
| Status | **unit pass**; live **not run** |
| Inputs | `228-matrix-analyst.md` A2 + B4–B6 |

## AF coverage

| AF ID | Unit | Live |
|-------|------|------|
| `ID-DEXIE-RESET-NO-WIPE` | **pass** (`massDeleteGuard.test.ts`) | **not run** |
| `ID-DUALZERO-VAULT-DEXIE-EMPTY` | **pass** | **not run** |
| `ID-DUALZERO-STALE-DEXIE` | **pass** | **not run** |
| `ID-DUALZERO-VAULT-ONLY` | **pass** | **not run** |

## Behavior locked

- Reset / empty Dexie / checkPoint 0: orphan vault-line strip skipped (`shouldSkipOrphanVaultLineDelete`); mass deletes `empty-dexie`.
- After refill with missing vault markers: `empty-vault` hold + Rebind offered (`isRestoreShapedHold`); Skip does not Apply.
- Dual-zero vault+Dexie empty: no vault→TT plan from empty Dexie; invented deletes blocked.
- Stale Dexie with vault+TT empty: fail-closed (`empty-vault` / `empty-ticktick`).
- Vault-only (Dexie+TT empty): no orphan strip; empty-dexie hold; no invent TT.

## Live plan (after tip)

1. Tip install. **Reset local sync cache** → Synchronize → Skip/Rebind only → markers intact (A2).
2. Second fixture: empty vault scope + live TT (or dual-zero protocol) — Skip; no Apply.

Do not empty production TT for dual-zero proves without owner backup OK (see #215 empty-TT).

## Checklist

- [x] AF IDs + named unit tests
- [x] TEST_PLAN rows for #230
- [ ] Live prove ×2
- [ ] Comment on #230 with tip evidence
