# 50 — DON-253 after Reset→Sync (ghost markers + create `.match`)

## Meta

| Field | Value |
|-------|--------|
| Date (UTC) | 2026-11-05 |
| Vault | Thinkpad-tts-test |
| Build | tip **2.0.96** |
| Runner | owner live + agent investigate |
| Cases | `BUG-GHOST-MARKER-AFTER-RESET` (#290), `BUG-CREATE-MATCH-UNDEF` (#291) |
| Result | **fail** (investigation only; no fix in this doc PR) |

## Inputs

- Owner Reset→Sync item 2 report (RU).
- Screenshots: sync «1 task(s) gone… detached»; open-note create + Failed `.match`.
- Note: `30 Tasks/301 Noveo_tasks/DON-253.md`.

## Evidence

- On disk after incident: Cutover/Validation lines still carry `%%[ticktick_id:: 6ad332…]%%` except Remove tcp-services → `6aec900783c55223f9dcb7ad`.
- MCP: sampled `6ad3324d…` / `6ad33250…` / `6ad33254…` / `6ad3325080c8b04a254e810d` → `resource_not_found`.
- MCP: `6aec900783c55223f9dcb7ad` **exists** (inbox; tags `note/don-253`, `obsidian`, `inbox`). `filter_tasks` tag `note/don-253` → only that task.
- Journal `2026-11-05.jsonl`: one `obs→tt` create at `14:17:43Z` (title Remove tcp-services…); commit id `6aec9007…`.
- Write-trace: `updateTaskLineInFile` / `commitVaultText` at `14:17:44Z` on DON-253; flush push `14:17:45Z`.
- No `%%tt-detached%%` on DON-253. «1 gone» toast aligns with other notes (e.g. abyss-active / Годовые), not bulk DON-253 detach.
- Pilot Manual/Repo checklist blocks under DON-253 are empty vs personal Thinkpad copy (pre-existing loss; not tonight’s focus).

## Conclusion

1. **Ghost markers (expected post-Reset gap):** Dexie wiped → `ID-TT-GONE-DETACH` never sees vault-only ids missing from TT → lines look synced; create blocked until marker stripped.
2. **Strip-then-appear:** correct — unmarked line → `addNewTask` → TT create.
3. **`.match` toast:** real tip bug (#291) after successful create Notice; exact stack not in tonight’s Obsidian log.
4. **Reset×2:** not a full pass while #290 open (vault↔TT id honesty).

## Recovery (owner; no Apply once)

- Keep `6aec9007…` on Remove tcp-services.
- For each remaining `6ad332…` line: remove only `%%[ticktick_id:: …]%%` (keep text/tags); let open-note/Synchronize create **or** Rebind after a real TT restore.
- Do **not** Apply once / mass-delete.

## Checklist

- [x] Issues filed (#290, #291)
- [x] AF + TEST_PLAN rows
- [ ] Unit + fix PRs
- [ ] Live prove ×2 after fix
