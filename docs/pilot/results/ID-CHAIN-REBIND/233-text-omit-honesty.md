# 233 — TEXT-NO-MARKER + omit-from-backup honesty

| Field | Value |
|-------|--------|
| Issue | [#233](https://github.com/semyon-alekseev-noveo/tt-sync/issues/233) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) / [#228](https://github.com/semyon-alekseev-noveo/tt-sync/issues/228) E14/E15/C9 |
| Status | **unit pass**; TEXT-NO-MARKER live **pass** ×2 via #231; omit-from-backup live **not run** (detach covered by #215) |

## AF

| AF ID | Unit | Live |
|-------|------|------|
| `ID-TEXT-NO-MARKER` | **pass** | **pass** ×2 (`231-vault-restore.md`) |
| `ID-MISSING-FROM-TT-BACKUP` | **pass** (honest label/notice) | **not run** |
| `ID-TT-RESTORE-OMITTED` | **pass** (detach plan, no invent) | via #215 detach **pass** ×2 |

## Code / copy

- `TEXT_NO_MARKER_POLICY`, `TT_GONE_DETACH_NOTICE`, `formatTtGoneDetachNotice`
- Held labels: `gone from TickTick (deleted or not in backup)`
- Detach Notice uses honest omit wording; glossary intro mentions no silent auto-bind / no invent TT
- Tests: `idChain233Honesty.test.ts`

## Non-goals

- Silent title auto-bind on Synchronize
- Invent TickTick tasks from vault when omitted from backup

## Checklist

- [x] Unit + AF/TEST_PLAN
- [x] TEXT-NO-MARKER live already ×2 (#231)
- [ ] Dedicated omit-from-backup live (optional; #215 detach suffices for marker detach)
- [x] Comment #233
