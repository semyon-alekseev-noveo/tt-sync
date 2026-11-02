# ID-CHAIN-REBIND — vault ↔ Dexie ↔ TickTick identity

| Field | Value |
|-------|--------|
| Gate | ID-CHAIN-REBIND |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Vault | Thinkpad-tts-test (pilot only) |
| Goal | Survive wipe/restore without mass Apply or archive strip; Rematch-as-intended = **rebind tt-ids** |
| Status | Eng children + #208 Rematch closed; residual optional #218 |

## Related

- [#208](https://github.com/semyon-alekseev-noveo/tt-sync/issues/208) Rematch (insert missing lines) — live **pass** ×2 (`UX-OBS-TT-SOAK/35`)
- `UX-OBS-TT-SOAK/34` AZ wipe root cause (`tt→obs` during empty TT)
- Analysts: dual brief 2026-10-29 (taxonomy + rebind plan); full matrix [#228](https://github.com/semyon-alekseev-noveo/tt-sync/issues/228)

## Phases

| # | Issue | File | Status |
|---|-------|------|--------|
| 0 | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) | `214-plan-taxonomy-rebind.md` | epic **open** (optional #218) |
| 1 | [#215](https://github.com/semyon-alekseev-noveo/tt-sync/issues/215) | `215-p0-safety.md` | **closed** — archive + empty-TT live **pass** ×2 |
| 2 | [#216](https://github.com/semyon-alekseev-noveo/tt-sync/issues/216) | `216-p1-rebind.md` | **closed** — live **pass** ×2 |
| 2b | [#223](https://github.com/semyon-alekseev-noveo/tt-sync/issues/223) | `223-tag-only-no-wipe.md` | **closed** — live **pass** ×2 |
| 3 | [#217](https://github.com/semyon-alekseev-noveo/tt-sync/issues/217) | `217-p2-ux.md` + `217-glossary-rebind.md` | **closed** |
| 4 | [#218](https://github.com/semyon-alekseev-noveo/tt-sync/issues/218) | `218-p3-deletion-policy.md` | **open** — optional refactor |
| — | [#228](https://github.com/semyon-alekseev-noveo/tt-sync/issues/228) | `228-matrix-analyst.md` | **closed** — DoR accepted |
| 1b | [#230](https://github.com/semyon-alekseev-noveo/tt-sync/issues/230) | `230-reset-dual-zero.md` | **closed** — Reset live ×2; dual-zero live deferred |
| 1c | [#231](https://github.com/semyon-alekseev-noveo/tt-sync/issues/231) | `231-vault-restore.md` | **closed** — text-only live ×2 |
| 1d | [#232](https://github.com/semyon-alekseev-noveo/tt-sync/issues/232) | `232-fm-presentids.md` | **closed** — unit; live deferred |
| 2c | [#233](https://github.com/semyon-alekseev-noveo/tt-sync/issues/233) | `233-text-omit-honesty.md` | **closed** |
| 2d | [#234](https://github.com/semyon-alekseev-noveo/tt-sync/issues/234) | `234-notebook-restore-safe.md` | **closed** — unit; live deferred |
| — | [#208](https://github.com/semyon-alekseev-noveo/tt-sync/issues/208) | `UX-OBS-TT-SOAK/35` | **closed** — Rematch live **pass** ×2 |

## Rules

- Pilot vault only. No secrets / personal absolute paths in committed prose.
- Do not invent live **pass**. Bug fixes: prove ×2 (`bug-prove-twice.mdc`).
- AF cases before code (`DEV_FLOW.md`). PR into `abyss-mapping` only.
