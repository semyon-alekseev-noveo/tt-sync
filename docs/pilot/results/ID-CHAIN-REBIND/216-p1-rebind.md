# 216 — P1 vault-wide rebind

| Field | Value |
|-------|--------|
| Issue | [#216](https://github.com/semyon-alekseev-noveo/tt-sync/issues/216) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Status | **live pass** ×2 (tip after #224/#225) |
| Inputs | `215-p0-safety.md`, `214-plan-taxonomy-rebind.md` |

## Goal

`ID-REBIND-RESTORE` / `ID-REBIND-DEDUP`: after TT restore with new ids, rebind in-scope markers (rewrite in place preferred); no TT deletes; no duplicate lines.

## Evidence

- Code: `src/sync/rebindVault.ts`; `rematchPhase` calls `rebindVaultFromPlanned`; `canOfferRematch` true when any vault→TT candidate (mixed plans OK).
- Unit: `npx vitest run src/test/idRebindVault.test.ts` — pass.

### Live prove ×2 (2026-10-29)

Pilot Thinkpad-tts-test. Tip includes #216 rebind. Method: stale two in-scope markers → lower mass-delete thresholds for one run → held modal → **Rematch into vault (keep TickTick)** (CLI auto-click) → restore thresholds.

| Prove | When (UTC) | Fixtures | Rematch | Rebound | Dedup | Report |
|-------|------------|----------|---------|---------|-------|--------|
| 1 | 07:52 | PKM `…c8da` «Подумать над механикой»; Годовые `…c8d5` «Подумать над областями» | clicked | both | 1 line each | `deletions-2026-10-29T07-52-00-429Z.md` Decision: **rematch** |
| 2 | 07:53 | same titles, second independent stale→Rematch | clicked | both | 1 line each | `deletions-2026-10-29T07-53-06-139Z.md` Decision: **rematch** |

Vault-local JSON (not committed): `.tickticksync/_prove216-1.json`, `_prove216-2.json`. Guard thresholds restored to 10 / 20 after each run. TickTick not wiped (Rematch path).

## Conclusion

`ID-REBIND-RESTORE` / `ID-REBIND-DEDUP` live **pass** ×2.

## Checklist

- [x] Rebind module + units
- [x] Live prove ×2 different fixtures (two notes; two runs)
- [x] TEST_PLAN in code PR
