# 216 — P1 vault-wide rebind

| Field | Value |
|-------|--------|
| Issue | [#216](https://github.com/semyon-alekseev-noveo/tt-sync/issues/216) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Status | **unit pass**; live prove **not run** |
| Inputs | `215-p0-safety.md`, `214-plan-taxonomy-rebind.md` |

## Goal

`ID-REBIND-RESTORE` / `ID-REBIND-DEDUP`: after TT restore with new ids, rebind in-scope markers (rewrite in place preferred); no TT deletes; no duplicate lines.

## Evidence

- Code: `src/sync/rebindVault.ts`; `rematchPhase` calls `rebindVaultFromPlanned`; `canOfferRematch` true when any vault→TT candidate (mixed plans OK).
- Unit: `npx vitest run src/test/idRebindVault.test.ts` — pass.
- Live: **not run** — owner Rematch on held modal after tip; check markers rewritten not duplicated (`bug-prove-twice`).

## Conclusion

Unit DoD for P1 rebind met. Tip + live prove ×2 before close #216.

## Checklist

- [x] Rebind module + units
- [ ] Live prove ×2 different fixtures
- [x] TEST_PLAN in code PR
