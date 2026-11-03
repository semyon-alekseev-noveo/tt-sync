# 39 — ARCH-SYNC #261 pilot prove ×2

| Field | Value |
|-------|--------|
| Issue | [#261](https://github.com/semyon-alekseev-noveo/tt-sync/issues/261) |
| Epic | [#255](https://github.com/semyon-alekseev-noveo/tt-sync/issues/255) |
| Vault | Thinkpad-tts-test (`<pilot-vault>`) |
| Status | **blocked / in progress** — tip installed from **#260 branch** (PR [#267](https://github.com/semyon-alekseev-noveo/tt-sync/pull/267) still **OPEN**); structured prove ×2 **not** closed |
| Date | 2026-11-03 |

## Goal

Two independent live proofs:

1. Mixed hold after **Rebind** does not Confirm-wipe rebound / Link-tombstoned ids.
2. **DetachMarker** (снять id, текст оставить) drains detach-heavy hold (no Rebind loop).

Unit green alone is not enough (`bug-prove-twice.mdc`).

## Tip

- Built `feat/arch-sync-260-check-enumerator` → installed to  
  `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/` (`main.js` / `manifest` / `styles`, label **2.0.96**).
- Includes unit landings #256–#260 (types → Check enumerator).
- **Do not** treat as `abyss-mapping` tip until [#267](https://github.com/semyon-alekseev-noveo/tt-sync/pull/267) merges.

## Agent attempt (2026-11-03)

| Attempt | Result |
|---------|--------|
| CLI `eval` Rematch auto-click | Unreliable: Sync discrepancies modal not always reachable from CLI `document`; several `scheduledSynchronization` **timeouts** |
| `plugin:reload` / startup sync | Held reports with `notify-only` (expected for non-manual) |
| Manual-path reports while tip loaded | `deletions-2026-11-03T10-45-26-595Z.md` Decision **rematch** (35 task deletions held); `deletions-2026-11-03T10-48-51-943Z.md` Decision **rematch** (13) — useful breadcrumbs, **not** yet two structured prove JSON fixtures with rebound/dedup asserts |

**Honesty:** do **not** mark `ARCH-SYNC-INTENT-IDENTITY` live **pass**. Fixture notes were churned (detach/stale/restore); owner should re-prove on a clean tip after #267 merge.

## Owner prove (after #267 merge)

1. Tip install from `abyss-mapping` tip (or re-copy `dist/` after merge).
2. Reload plugin. Guard thresholds default (e.g. 10 / 20).
3. **Prove 1:** Stale two in-scope markers (different notes) → Synchronize → Sync discrepancies → **Rebind** (not Apply). Assert: live ids restored, no TT wipe of rebound tasks; next sync does not Confirm-wipe those ids.
4. **Prove 2:** Different titles/fixtures. Prefer detach-heavy hold → Rebind → DetachMarker notice / residual hold without re-loop of gone-from-TT rows.
5. Save vault-local JSON under `.tickticksync/_prove261-1.json` / `_prove261-2.json` (not secrets). Update this file + AF/TEST_PLAN in the closing PR.

## Checklist

- [x] Tip build of #260 stack onto pilot plugin folder
- [ ] #267 merged into `abyss-mapping`
- [ ] Prove 1 structured pass
- [ ] Prove 2 structured pass (different fixtures)
- [ ] AF / TEST_PLAN live status only after both
- [ ] Epic #255 comment links both proofs before close
