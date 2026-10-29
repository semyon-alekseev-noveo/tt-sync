# ID-CHAIN-REBIND — vault ↔ Dexie ↔ TickTick identity

| Field | Value |
|-------|--------|
| Gate | ID-CHAIN-REBIND |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Vault | Thinkpad-tts-test (pilot only) |
| Goal | Survive wipe/restore without mass Apply or archive strip; Rematch-as-intended = **rebind tt-ids** |
| Status | **DoR / plan** — no P0–P1 code in scaffold PR |

## Related

- [#208](https://github.com/semyon-alekseev-noveo/tt-sync/issues/208) Rematch insert (prove 1 in `UX-OBS-TT-SOAK/35`; prove 2 open)
- `UX-OBS-TT-SOAK/34` AZ wipe root cause (`tt→obs` during empty TT)
- Analysts: dual brief 2026-10-29 (taxonomy + rebind plan)

## Phases

| # | Issue | File | Status |
|---|-------|------|--------|
| 0 | #214 | `214-plan-taxonomy-rebind.md` | **plan / DoR** |
| 1 | [#215](https://github.com/semyon-alekseev-noveo/tt-sync/issues/215) | `215-p0-safety.md` | **not run** (scaffold) |
| 2 | [#216](https://github.com/semyon-alekseev-noveo/tt-sync/issues/216) | `216-p1-rebind.md` | **not run** (scaffold) |
| 3 | [#217](https://github.com/semyon-alekseev-noveo/tt-sync/issues/217) | `217-p2-ux.md` | **not run** (scaffold) |
| 4 | [#218](https://github.com/semyon-alekseev-noveo/tt-sync/issues/218) | `218-p3-deletion-policy.md` | **not run** (scaffold) |

## Rules

- Pilot vault only. No secrets / personal absolute paths in committed prose.
- Do not invent live **pass**. Bug fixes: prove ×2 (`bug-prove-twice.mdc`).
- AF cases before code (`DEV_FLOW.md`). PR into `abyss-mapping` only.
