# 39 — ARCH-SYNC #261 pilot prove ×2

| Field | Value |
|-------|--------|
| Issue | [#261](https://github.com/semyon-alekseev-noveo/tt-sync/issues/261) |
| Epic | [#255](https://github.com/semyon-alekseev-noveo/tt-sync/issues/255) |
| Vault | Thinkpad-tts-test (`<pilot-vault>`) |
| Tip | `abyss-mapping` @`3729c0b` (merge [#267](https://github.com/semyon-alekseev-noveo/tt-sync/pull/267) / #260) installed to `tickticksync-abyss` **2.0.96** |
| Status | **live pass** ×2 |
| Date | 2026-11-03 |

## Goal

1. Mixed hold after **Rebind** does not Confirm-wipe rebound / Link-tombstoned ids.
2. Rematch path drains hold (identity + DetachMarker stack from #256–#260) without Apply wipe.

## Method

Stale in-scope markers → lower mass-delete thresholds for one run → Synchronize → Sync discrepancies → **Rebind** (auto-click hook on live window + `tts-sync` command) → restore thresholds. Assert rebound + dedup; Confirm/Apply not chosen (`Decision: rematch`). TT tasks still present via MCP `get_task_by_id`.

Vault-local JSON (not committed): `.tickticksync/_prove261-1.json`, `_prove261-2.json`.

## Evidence

| Prove | When (UTC) | Fixtures | Rematch report | Rebound | TT still live |
|-------|------------|----------|----------------|---------|---------------|
| 1 | 11:14 | PKM «Подумать над механикой» `…eed586`; Годовые «Подумать над областями» `…eed581` | `deletions-2026-11-03T11-14-14-131Z.md` Decision **rematch** | both, dedup | yes (MCP) |
| 2 | 11:16 | PKM «Подумать над шаблонами» `…eed587`; Годовые «Перевести в цифру» `…eed57d` | `deletions-2026-11-03T11-16-15-425Z.md` Decision **rematch** | both, dedup | yes (MCP) |

## Conclusion

`ARCH-SYNC-INTENT-IDENTITY` live **pass** ×2 on tip after #267. Epic #255 code children #256–#260 + prove #261 ready to close after this docs PR merges.

## Checklist

- [x] Tip from merged `abyss-mapping` (#267)
- [x] Prove 1 structured pass (different note pair)
- [x] Prove 2 structured pass (different titles)
- [x] TT ids not wiped (MCP)
- [x] AF / TEST_PLAN updated in closing PR
