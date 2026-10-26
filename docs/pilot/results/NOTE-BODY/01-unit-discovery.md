# NOTE-BODY — unit discovery

## Meta

- Issue: [#152](https://github.com/semyon-alekseev-noveo/tt-sync/issues/152)
- Date: 2026-10-26
- Scope: prove parser/push/pull shape for upstream delimiter notes; no sync behavior change

## Inputs

- `docs/pilot/NOTE-BODY.md` working PO answers (§5)
- Cases NOTE-BODY-1 / NOTE-BODY-2 in `ABYSS_FIRST_CASES.md`

## Evidence

```text
npx vitest run src/test/noteBody.upstream.test.ts
# 4 passed (NOTE-BODY-1, NOTE-BODY-1b, NOTE-BODY-2, NOTE-BODY-3)
```

| ID | Result | Notes |
|----|--------|-------|
| NOTE-BODY-1 | **unit pass** | Delimiter block → `content` (no items) |
| NOTE-BODY-1b | **unit pass** | Delimiter block → `desc` (with checklist items) |
| NOTE-BODY-2 | **unit pass** | `content` → delimiter-wrapped vault note |
| NOTE-BODY-3 | **unit pass** | Abyss stamps excluded from `content` when Comments API on |
| Live BODY-1 / BODY-2 | **not run** | Pilot Synchronize still required before case **pass** |

## Conclusion

Upstream delimiter path already matches expected unit behavior; no implement fix in this PR. Keep #152 open until live BODY-1 then BODY-2 on `<pilot-vault>` (prove×2 if a live fail appears).

## Checklist

- [x] Unit tests named by catalog IDs
- [x] Working PO answers recorded in brief
- [ ] Live vault Synchronize BODY-1
- [ ] Live vault Synchronize BODY-2
