# 51 — DON-253 after Reset→Sync (ghost markers + create `.match`)

## Meta

| Field | Value |
|-------|--------|
| Date (UTC) | 2026-11-05 |
| Vault | Thinkpad-tts-test |
| Build | tip **2.0.96** (pre-fix) → fix PR |
| Runner | owner live + agent investigate / fix |
| Cases | `BUG-GHOST-MARKER-AFTER-RESET` (#290), `BUG-CREATE-MATCH-UNDEF` (#291) |
| Result | live **fail** (investigation); unit **pass** (this PR); live re-prove **not run** |

## Inputs

- Owner Reset→Sync item 2 report (RU).
- Screenshots: sync «1 task(s) gone… detached»; open-note create + Failed `.match`.
- Note: `30 Tasks/301 Noveo_tasks/DON-253.md`.

## Evidence (live fail)

- On disk after incident: Cutover/Validation lines still carry `%%[ticktick_id:: 6ad332…]%%` except Remove tcp-services → `6aec900783c55223f9dcb7ad`.
- MCP: sampled `6ad3324d…` / `6ad33250…` / `6ad33254…` / `6ad3325080c8b04a254e810d` → `resource_not_found`.
- MCP: `6aec900783c55223f9dcb7ad` **exists** (inbox; tags `note/don-253`, `obsidian`, `inbox`).
- Journal `2026-11-05.jsonl`: one `obs→tt` create at `14:17:43Z` (title Remove tcp-services…); commit id `6aec9007…`.
- Write-trace: `updateTaskLineInFile` / `commitVaultText` at `14:17:44Z` on DON-253; flush push `14:17:45Z`.
- No `%%tt-detached%%` on DON-253. «1 gone» toast aligned with other notes, not bulk DON-253 detach.

## Root cause (fix)

1. **Ghost markers:** `ID-TT-GONE-DETACH` / post-Reset orphan path skipped strip but **left** vault-only markers when Dexie miss + TT 404. Fix: **detach** (`%%tt-detached%%`, text kept); never invent TT; still never Confirm-wipe (`BUG-RESET-CACHE-DELETE`).
2. **`.match` toast:** editor-path create wrote vault but did not `fileMap.replaceLines` → `getTaskRecord(newId)` index -1 → `abyssRegionEnd` → `indentWidth(undefined).match` → outer «Failed to add… not modified» after create Notice. Fix: sync fileMap on successful editor write; harden abyssRegionEnd; post-create errors must not say «not modified».

## Recovery (owner; no Apply once)

- Keep `6aec9007…` on Remove tcp-services.
- Remaining `6ad332…` lines: tip after fix should detach on Synchronize; or strip only the `%%[ticktick_id:: …]%%` manually.
- Do **not** Apply once / mass-delete.

## Checklist

- [x] Issues filed (#290, #291)
- [x] AF + TEST_PLAN rows
- [x] Unit + fix PR
- [ ] Live prove ×2 after fix
