# 216 — P1 vault-wide rebind

| Field | Value |
|-------|--------|
| Issue | [#216](https://github.com/semyon-alekseev-noveo/tt-sync/issues/216) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Status | **not run** (scaffold) |
| Inputs | `215-p0-safety.md`, `214-plan-taxonomy-rebind.md` |

## Goal

`ID-REBIND-RESTORE` / `ID-REBIND-DEDUP`: after TT restore with new ids, rebind in-scope markers (rewrite in place preferred); no TT deletes; no duplicate lines.

## Evidence

- None yet. Do not confuse with #208 Rematch insert prove (`UX-OBS-TT-SOAK/35`).

## Conclusion

Blocked on P0 policy + implementation.

## Checklist

- [ ] Rebind module + units
- [ ] Live prove ×2 different fixtures
- [ ] TEST_PLAN in code PR
