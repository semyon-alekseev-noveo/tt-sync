# 40 — Why #37 / #38 / #259 missed Confirm Rebind

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 40 (analyst review / gap) |
| Case | `UX-SYNC-CONFIRM-REBIND` |
| Status | **documented** — fix on `fix/confirm-sync-discrepancies-rebind` |
| Related | debate [`37`](./37-sync-intent-identity-debate.md), plan [`38`](./38-sync-intent-identity-plan.md) step 4, child [#259](https://github.com/semyon-alekseev-noveo/tt-sync/issues/259), epic [#255](https://github.com/semyon-alekseev-noveo/tt-sync/issues/255) (closed) |

## Meta

Owner hit under-threshold **Confirm** (PushDeleteTT / `TaskDeletionModal`) after unmarked vault lines and saw Don’t delete / Apply once only — **no Rebind**. Held `MassDeleteGuardModal` already had Rebind. Acceptance for plan #38 step 4 / #259 said one Sync discrepancies UI with Don’t delete / Rebind / Apply; implementation and tests did not fully match.

## Root cause (analyst + developer + test hole)

1. **Acceptance said “one UI”** (held + Confirm) with Rebind = Link, but the #259 PR mostly **shared title/lead/skip/apply constants** onto Confirm and left the Rebind button on the held modal path only.
2. **Developer wiring** treated Rebind as a mass-delete-guard / held concern (`canOfferRematch` on `PlannedDeletion[]`), not as a Confirm-modal button when `getDeletionItems` already carries `id` + `filePath`.
3. **Regression hole:** unit `held + Confirm share Sync discrepancies…` in `archSyncIntentIdentity.test.ts` asserted Confirm has Sync discrepancies **copy** (`SYNC_DISCREPANCY_*`) and `#259`, **not** `REBIND_BUTTON_LABEL` / `confirmOffersRematch` — so Confirm without Rebind stayed green.
4. Check residual Confirm reused `TaskDeletionModal` the same way and also lacked a rematch branch until this fix.

## Fix direction (this PR)

- `confirmRematch.ts` — map Confirm items → rematch candidates; `applyConfirmRematch` (no TT deletes).
- `TaskDeletionModal` — offer Rebind when `confirmOffersRematch`; `DeletionPromptResult.rematch`.
- `TaskDeletionHandler` + `checkDatabase` — rematch → apply, skip deletes.
- Tests named `UX-SYNC-CONFIRM-REBIND` + tighten #259 assert; glossary Confirm row names Rebind explicitly.

## Checklist

- [x] AF case `UX-SYNC-CONFIRM-REBIND`
- [x] Unit / source asserts for modal + handler + checkDatabase
- [ ] Live pilot prove ×2 (optional; mark **not run** until done)
