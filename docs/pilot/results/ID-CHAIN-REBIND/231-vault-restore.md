# 231 — Vault backup restore identity (D10–D13)

| Field | Value |
|-------|--------|
| Issue | [#231](https://github.com/semyon-alekseev-noveo/tt-sync/issues/231) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) / [#228](https://github.com/semyon-alekseev-noveo/tt-sync/issues/228) |
| Status | **unit pass**; live **not run** |
| Inputs | `228-matrix-analyst.md` D10–D13; #216 rebind |

## AF coverage

| AF ID | Unit | Live |
|-------|------|------|
| `ID-VAULT-RESTORE-MATCH` | **pass** | **not run** |
| `ID-VAULT-RESTORE-TEXT-ONLY` / `ID-TEXT-NO-MARKER` | **pass** | **not run** |
| `ID-VAULT-RESTORE-CONFLICT` | **pass** | **not run** |

## Code

- `rebindFileContent`: one title claim per pass — second same-title task does not insert a dup checkbox.
- `rebindVaultFromPlanned`: skip `(Conflicted copy)` / `.sync-conflict-` paths.
- Guard: matching `presentIds` → no vault→TT plan; unmarked → hold + Rebind (`idVaultRestore231.test.ts`).

## Live plan

1. Tip install. Fixture A: markers match TT → Synchronize quiet (D10) ×2 notes.
2. Fixture B: strip markers leave titles → held → Rebind → markers rebound, no TT wipe (D12) ×2.
3. Never Apply after restore.

## Checklist

- [x] AF-named unit tests
- [x] TEST_PLAN stubs updated
- [ ] Live prove ×2
- [ ] Comment #231 with tip evidence
