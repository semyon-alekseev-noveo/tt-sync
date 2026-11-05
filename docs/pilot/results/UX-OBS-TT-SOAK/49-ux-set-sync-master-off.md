# UX-SET-SYNC-MASTER-OFF — Sync off kill switch

## Meta

| Field | Value |
|-------|-------|
| Case | `UX-SET-SYNC-MASTER-OFF` |
| Issue | [#287](https://github.com/semyon-alekseev-noveo/tt-sync/issues/287) |
| Vault | Thinkpad-tts-test (pilot) when run |
| Status | **not run** (unit + PR only; live prove deferred) |

## Inputs

- Related: `UX-SET-INTERVAL-ZERO` (interval 0 greys progress only — not Sync off)
- Setting: `syncEnabled` (default on); UI near Automatic sync interval
- Expected: master **off** → no scheduled / startup / open-note / reactive TT writes; Maintenance **Synchronize** still works

## Evidence

- Unit: `src/test/uxSetSyncMasterOff.test.ts` (this PR)
- Live: **not run**

## Conclusion

Engineering gate for Sync off. Do not mark AF / TEST_PLAN live **pass** until pilot prove (prefer ×2: open-note silence + Synchronize still works).

## Checklist

- [x] AF case + unit named by ID
- [ ] Tip install
- [ ] Live: master off → no open-note / no startup
- [ ] Live: Synchronize while off
- [ ] Live: re-enable restores reactive paths
