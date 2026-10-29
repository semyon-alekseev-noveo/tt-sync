# 218 — P3 DeletionPolicy refactor (optional)

| Field | Value |
|-------|--------|
| Issue | [#218](https://github.com/semyon-alekseev-noveo/tt-sync/issues/218) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Status | **not run** (scaffold) |

## Goal

Single deletion/identity policy if P1 still fights divergent paths (`massDeleteGuard`, `VaultSyncCoordinator`, `TaskDeletionHandler`, push orphan, legacy `syncModule`).

## Checklist

- [ ] Decision: needed or wontfix
- [ ] If needed: refactor PR + regression prove
