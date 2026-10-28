# 25 — BUG-RESET-CACHE-DELETE prove (post-#187)

## Meta

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 25 |
| Case | **BUG-RESET-CACHE-DELETE** (companion to **UX-RESET-1**) |
| Plugin | tickticksync-abyss **2.0.94** (manifest; tip after #187, no version bump) |
| Tip | `bc89f3173e8bb604b9cb757c24fe25b23fbdf6d6` (merge [#187](https://github.com/semyon-alekseev-noveo/tt-sync/pull/187)) |
| Vault | Thinkpad-tts-test (paths vault-relative) |
| Runner | agent (Obsidian CLI) |
| Status | **install pass**; Reset-path prove **blocked** (no Reset CLI; owner must click) |
| Recorded | 2026-10-28 ~05:53 UTC |

## Inputs

- Fail observation: [`24-post-reset-delete-modal.md`](24-post-reset-delete-modal.md)
- Merged PR: [#187](https://github.com/semyon-alekseev-noveo/tt-sync/pull/187) into `abyss-mapping`
- Fixture: `30 Tasks/301 Noveo_tasks/DON-253.md` — 10 lines with `%%[ticktick_id:: …]%%` (incl. «Merge MR, run `deploy_prod`» / `6ad3324d80c8b04a254e8109`)

## Evidence

### Install

1. Fetched `tt-sync/abyss-mapping`; tip = merge #187 `bc89f31` (exact HEAD).
2. `npm run build` → `dist/{main.js,manifest.json,styles.css}` version **2.0.94**; bundle contains `skipOrphanVaultLineDeletes`.
3. Copied only those three files into `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/`.
4. `data.json` SHA256 unchanged (`646822482c…`); remapping (`statusListMappings`, `syncedLists`, inbox ids, `syncScopeFolders`) kept.
5. `obsidian plugin:reload id=tickticksync-abyss` → enabled **2.0.94**.

### Reset CLI

- Palette / `obsidian commands`: **no** `Reset local sync database` command (only settings button from UX-RESET-1 / #184).
- Agent cannot invoke Reset without owner UI click. Full empty-Dexie prove path **not run** here.

### Smoke Synchronize ×2 (healthy Dexie — not the bug path)

Precondition: `checkPoint` ≠ 0 (`1793162423849`) — vault already past earlier Cancel + later syncs.

| Step | Result |
|------|--------|
| Markers before | DON-253 = **10** `ticktick_id` lines |
| `tts-sync` #1 | Executed (~05:51–05:52Z); journal grew |
| `tts-sync` #2 | Executed (~05:52Z); journal grew |
| Markers after | DON-253 still **10**; Merge MR line unchanged |
| Modal via CLI | Not observable; no agent-visible Confirm Deletion |
| `checkPoint` | Unchanged (`1793162423849`) — idle/delta; not a Reset bootstrap |

This smoke does **not** count as BUG-RESET-CACHE-DELETE live pass (Dexie not empty / checkPoint not 0).

## Expected owner prove ×2 (manual Reset)

1. Settings → TickTickSync (Abyss) → Tasks/Notes → **Reset local sync database** → confirm.
2. Notice: local DB cleared; vault notes remain; `checkPoint` → `0`.
3. **Synchronize** (CLI `tickticksync-abyss:tts-sync` or ribbon).
4. Expect: **no** modal «task not found in local cache» / Confirm Deletion for vault lines; DON-253 markers stay.
5. **Synchronize** again (second independent proof).
6. Same expect; then normal day-to-day Synchronize (system inbox remap already in `data.json`).

If a modal still appears → **Cancel** only; record fail in this file / reopen.

## Conclusion

#187 tip is installed on the pilot vault with remapping preserved. Agent smoke sync ×2 kept DON-253 lines on a **healthy** cache. Live Reset→Synchronize prove ×2 remains **owner-gated** until Settings Reset is clicked (no CLI).

## Checklist

- [x] Tip #187 built and installed (2.0.94 string)
- [x] `data.json` remapping preserved
- [x] Smoke `tts-sync` ×2 after install (not Reset path)
- [ ] Owner Reset → Synchronize prove A
- [ ] Owner Reset path prove B (second Synchronize / second fixture)
- [ ] Mark TEST_PLAN / ABYSS live **pass** only after both proves
