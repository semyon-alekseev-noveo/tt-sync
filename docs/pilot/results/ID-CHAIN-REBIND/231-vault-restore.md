# 231 — Vault backup restore identity (D10–D13)

| Field | Value |
|-------|--------|
| Issue | [#231](https://github.com/semyon-alekseev-noveo/tt-sync/issues/231) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) / [#228](https://github.com/semyon-alekseev-noveo/tt-sync/issues/228) |
| Status | **unit pass**; live text-only / Rebind **pass** ×2 |
| Tip | branch `fix/id-chain-231-vault-restore` tip-installed on pilot |
| Inputs | `228-matrix-analyst.md` D10–D13; #216 rebind |

## AF coverage

| AF ID | Unit | Live |
|-------|------|------|
| `ID-VAULT-RESTORE-MATCH` | **pass** | **not run** (happy-path smoke) |
| `ID-VAULT-RESTORE-TEXT-ONLY` / `ID-TEXT-NO-MARKER` | **pass** | **pass** ×2 (below) |
| `ID-VAULT-RESTORE-CONFLICT` | **pass** | **not run** |

## Code

- `rebindFileContent`: one title claim per pass — second same-title task does not insert a dup checkbox.
- `rebindVaultFromPlanned`: skip `(Conflicted copy)` / `.sync-conflict-` paths.
- Guard: matching `presentIds` → no vault→TT plan; unmarked → hold + Rebind (`idVaultRestore231.test.ts`).

## Live prove ×2 — `ID-VAULT-RESTORE-TEXT-ONLY`

Pilot Thinkpad-tts-test. Tip: #231 branch. Strip markers on two project notes → Synchronize → **Rebind** (not Apply).

Fixtures: `10 Projects/PKM - journaling.md` (`6ae17a048f0871a7dbb8c8da`), `10 Projects/Годовые задачи.md` (`6ae17a048f0871a7dbb8c8d5`).

| Prove | When (UTC) | Decision | Planned | After |
|-------|------------|----------|---------|-------|
| 1 | 09:57:19 | **rematch** | 2 vault→TT (механикой + областями) | markers restored same ids; dedup |
| 2 | 09:57:27 | **rematch** | same 2 | markers kept; no Apply |

Reports: `.tickticksync/reports/deletions-2026-10-29T09-57-19-421Z.md`, `…09-57-27-444Z.md` (vault-local). Apply never. Checkpoint held.

## Checklist

- [x] AF-named unit tests
- [x] TEST_PLAN stubs updated
- [x] Live text-only Rebind prove ×2
- [ ] D10 / D13 live (optional smoke)
- [x] Comment #231 with tip evidence
