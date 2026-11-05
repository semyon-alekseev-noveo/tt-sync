# UX-SET-SYNC-MASTER-OFF — Sync off kill switch

## Meta

| Field | Value |
|-------|-------|
| Case | `UX-SET-SYNC-MASTER-OFF` |
| Issue | [#287](https://github.com/semyon-alekseev-noveo/tt-sync/issues/287) |
| PR | [#288](https://github.com/semyon-alekseev-noveo/tt-sync/pull/288) merged into `abyss-mapping` |
| Vault | Thinkpad-tts-test (pilot) |
| Status | **owner live pass** (2026-11-05; Sync off verified OK) |

## Inputs

- Related: `UX-SET-INTERVAL-ZERO` (interval 0 greys progress only — not Sync off)
- Setting: `syncEnabled` (default on); UI near Automatic sync interval
- Expected: master **off** → no scheduled / startup / open-note / reactive TT writes; Maintenance **Synchronize** still works

## Evidence

- Unit: `src/test/uxSetSyncMasterOff.test.ts`
- Tip: `abyss-mapping` after merge #288 (`8edbf16`)
- Live: **owner pass** — Sync off verified OK on pilot (parent task 2026-11-05). Off silence + Synchronize-while-off accepted by owner; re-enable not separately logged.

## Conclusion

Engineering + owner live accept for Sync off kill switch. Close #287 with this file.

## Checklist

- [x] AF case + unit named by ID
- [x] Tip install (merge #288)
- [x] Live: master off → no open-note / no startup (owner)
- [x] Live: Synchronize while off (owner)
- [ ] Live: re-enable restores reactive paths (not separately logged; owner overall OK)
