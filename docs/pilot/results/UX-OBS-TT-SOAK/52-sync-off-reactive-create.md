# BUG-SYNC-OFF-REACTIVE-CREATE — Sync off still created TT task

## Meta

| Field | Value |
|-------|-------|
| Case | `BUG-SYNC-OFF-REACTIVE-CREATE` |
| Issue | [#295](https://github.com/semyon-alekseev-noveo/tt-sync/issues/295) |
| Fix | [#296](https://github.com/semyon-alekseev-noveo/tt-sync/pull/296), merged `76cf71c6258d221ae55ed86e453d3ce6d98aa496` |
| Vault | Thinkpad-tts-test (pilot) |
| Runner | agent (Obsidian CLI + TickTick MCP), 2026-11-06 |
| Status | Original **live fail**; first tip run after `plugin:reload` **fail** (stale pre-fix handler); fully initialized tip **live pass ×2** plus fixed-runtime reload check |

## Inputs

- Owner: Sync off, but task «создалась» in TickTick (DON-253).
- Original toasts: `#status/cancelled` conflict dropped; `Task 6aedaecd83c55223f9dcb7ae updated: tags`.
- Pilot `data.json`: `syncEnabled=false` throughout; no manual Synchronize and no Apply once in these checks.
- Expected: unmarked-line settle / file modify creates no TT task; editing a marked line pushes no tag update while off.

## Original evidence (before the fix)

- MCP `get_task_by_id` `6aedaecd83c55223f9dcb7ae`: **create** `2026-11-06T10:41:22Z`, modify `10:41:58Z` (not a pre-existing id).
- Journal `.tickticksync/journal/2026-11-06.jsonl`: `op:create` then `op:update` with `syncId` prefix **`edit-`** (reactive redo session — not `sync-` / manual Synchronize).
- Tip wrappers already had `isAutomaticSyncEnabled`; detector `addNewTask` / line modify did not seal; disk vs memory lag possible under LiveSync.

## Tip install and regression gate

- Fetched and fast-forwarded local `abyss-mapping` to `76cf71c…`; PR #296 is **MERGED** into `abyss-mapping`.
- `npx vitest run`: **140 files / 997 tests passed**, including the synchronization integration suite.
- `npm run build`: **pass**; deployed `dist/{main.js,manifest.json,styles.css}` to the pilot plugin directory.
- Deployed `main.js` is byte-identical to `dist/main.js` (SHA-256 `5746ee0081d17c5e118dee98a255abcc3a793cf80e4e6fcc72fbe67d990605cc`).
- Production minification removes source comments, so comment text is not a useful bundle assertion. Minified guards are present: `syncEnabled!==!1`, `syncRunning?!0:…`, disk-false adopt `{persist:!1}`, and `loadData()` reconciliation in `fullTextNewTaskCheck` / `lineSettledCheck`.
- Runtime `addNewTask` also contains the early `Skipping addNewTask: sync master off` return.

## Failed first tip run — do not count as a pass

1. At `14:55:48Z`, ran `plugin:reload` after replacing an older running bundle. Disk settings still read `syncEnabled=false`.
2. At `14:56:39Z`, appended a unique unmarked checkbox to `30 Tasks/303 Личные задачи/Законспектировать-обучение-грудная-клетка.md`.
3. The old vault-modify handler ran before the new instance initialized `eventHandlerService`. Journal entry `mw53l3w1-3q-3s08` recorded `edit-… op:create`; TT id `6aedeaa783c55223f9dcb7af` and its vault marker appeared.
4. Deleted only that accidental proof task via MCP; the vault fixture retains no live marker. Direct calls into the newly loaded service then returned without TT writes.
5. This run remains a recorded **fail**, not hidden or reclassified as green. It identifies a reload-window hazard when the old running bundle predates the detector seal: a full vault reload is required for this proof after hot-swapping that old bundle. Arbitrary in-flight unload/reload interleavings are not claimed tested or fixed.

## Independent pass 1 — unmarked line, fully initialized tip

- Reloaded the whole vault at `15:00:52Z`; at `15:01:15Z` the current plugin had `eventHandlerService`, settings, detector, disk `syncEnabled=false`, and `syncRunning=false`.
- At `15:01:38Z`, appended `- [ ] BUG-SYNC-OFF-REACTIVE-CREATE prove2 unmarked …` to `30 Tasks/301 Noveo_tasks/DON-253.md` (line index 96).
- Waited past the reactive debounce and invoked `lineSettledCheck` plus `fullTextNewTaskCheck`; both were gated (`lineSettledCheck` returned `false`).
- Result: no marker added, MCP search for the unique title returned no task, and no new journal entry. **Pass.**

## Independent pass 2 — marked-line tag edit, same tip

- Added `#tts-sync-off-prove-20261106` to the existing DON-253 line carrying `6aedaecd83c55223f9dcb7ae` (line index 72).
- Invoked `lineSettledCheck`, `lineModifiedTaskCheck`, and `pushSettledActiveFile`; both line checks returned `false`; waited past the reactive debounce.
- MCP after the wait: TT tags remain exactly `note/don-253`, `inbox`, `obsidian`; `etag=tuwt3si9` and `modifiedTime=2026-11-06T10:41:58Z` are unchanged. The new vault-only tag was not pushed.
- Journal remained at 670 lines, ending with the failed reload-window entry above; no new `edit-` create/update. **Pass.**

## Additional fixed-runtime reload check

- At `15:04:44Z`, ran `plugin:reload` from the already-fixed runtime and appended a different unmarked line to `30 Tasks/303 Личные задачи/Законспектировать-обучение-грудная-клетка.md`.
- After the debounce, the current handlers were initialized, disk Sync remained off, MCP search returned no proof task, and the journal still had 670 lines.
- This is a third silence check, not a substitute for the two independent fixtures above.

## Conclusion

The original defect is fixed on the fully initialized #296 runtime: two independent pilot fixtures produced no reactive TT create/update with disk Sync off. The initial failed run is retained as evidence of the stale pre-fix-handler reload window, not counted toward prove ×2.

Manual **Synchronize** while off was optional and **not run** this session; its unit guard remains covered. `BUG-CREATE-MATCH-UNDEF` / #291 is separate and was **not run** (these fixtures intentionally must not create).

## Checklist

- [x] AF case + unit named by ID
- [x] Tip install after merge; regression gate green
- [x] Initial failed tip run recorded honestly
- [x] Live prove ×2 on fully initialized tip: no reactive create/update
- [x] Additional reload-from-fixed-runtime silence check
- [x] No Apply once
- [ ] Manual Synchronize while off (optional; not run)
- [ ] #291 open-note successful-create Notice prove (separate; not run)
