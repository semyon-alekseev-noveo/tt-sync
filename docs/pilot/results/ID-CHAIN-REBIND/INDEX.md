# ID-CHAIN-REBIND — vault ↔ Dexie ↔ TickTick identity

| Field | Value |
|-------|--------|
| Gate | ID-CHAIN-REBIND |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Vault | Thinkpad-tts-test (pilot only) |
| Goal | Survive wipe/restore without mass Apply or archive strip; Rematch-as-intended = **rebind tt-ids** |
| Status | #233 honesty unit; #232/#231 done; empty-TT still #215 |

## Related

- [#208](https://github.com/semyon-alekseev-noveo/tt-sync/issues/208) Rematch insert (prove 1 in `UX-OBS-TT-SOAK/35`; prove 2 open)
- `UX-OBS-TT-SOAK/34` AZ wipe root cause (`tt→obs` during empty TT)
- Analysts: dual brief 2026-10-29 (taxonomy + rebind plan); full matrix [#228](https://github.com/semyon-alekseev-noveo/tt-sync/issues/228)

## Phases

| # | Issue | File | Status |
|---|-------|------|--------|
| 0 | #214 | `214-plan-taxonomy-rebind.md` | **plan / DoR** |
| 1 | [#215](https://github.com/semyon-alekseev-noveo/tt-sync/issues/215) | `215-p0-safety.md` | archive/TT-gone live **pass** ×2; empty-TT **not run** |
| 2 | [#216](https://github.com/semyon-alekseev-noveo/tt-sync/issues/216) | `216-p1-rebind.md` | **live pass** ×2 |
| 2b | [#223](https://github.com/semyon-alekseev-noveo/tt-sync/issues/223) | `223-tag-only-no-wipe.md` | **live pass** ×2 (tip #224) |
| 3 | [#217](https://github.com/semyon-alekseev-noveo/tt-sync/issues/217) | `217-p2-ux.md` + `217-glossary-rebind.md` | **unit pass**; owner 30s **not run** |
| 4 | [#218](https://github.com/semyon-alekseev-noveo/tt-sync/issues/218) | `218-p3-deletion-policy.md` | **not run** (scaffold) |
| — | [#228](https://github.com/semyon-alekseev-noveo/tt-sync/issues/228) | `228-matrix-analyst.md` | **DoR accepted** |
| 1b | [#230](https://github.com/semyon-alekseev-noveo/tt-sync/issues/230) | `230-reset-dual-zero.md` | **unit pass**; Reset live **pass** ×2; dual-zero live **not run** |
| 1c | [#231](https://github.com/semyon-alekseev-noveo/tt-sync/issues/231) | `231-vault-restore.md` | **unit pass**; text-only live **pass** ×2 |
| 1d | [#232](https://github.com/semyon-alekseev-noveo/tt-sync/issues/232) | `232-fm-presentids.md` | **unit pass**; live **not run** |
| 2c | [#233](https://github.com/semyon-alekseev-noveo/tt-sync/issues/233) | `233-text-omit-honesty.md` | **unit pass**; TEXT-NO-MARKER live via #231 |

## Rules

- Pilot vault only. No secrets / personal absolute paths in committed prose.
- Do not invent live **pass**. Bug fixes: prove ×2 (`bug-prove-twice.mdc`).
- AF cases before code (`DEV_FLOW.md`). PR into `abyss-mapping` only.
