# Changelog

### Iteration 2026-10-23 14:07 UTC

- Context: [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) — live `TP-COMMENT-TT-DELETE` fail on **2.0.85** (vault re-push after TT delete).
- Target: Single mapped miss waits for pull (any origin); keep STALE-MAPS multi re-push; no invented live pass.
- Actions log: Rework `vaultHasUnpushedCommentThreads`; update `commentSyncMatch` + ABYSS/TEST_PLAN; evidence `TP-COMMENT-TT-DELETE/104-unit-fix.md`.
- Validation: `npx vitest run` → **715** passed; `npm run build` → ok.
- Problems: Live re-pilot still **not run** (`open` until vault evidence).
- To Be Done: Owner merges PR; bump/release when ready; re-run TT-DELETE on Thinkpad-tts-test.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/104, `docs/pilot/results/TP-COMMENT-TT-DELETE/104-unit-fix.md`, `CHANGELOG.md`

### Iteration 2026-10-23 13:54 UTC

- Context: Owner merged #105; asked to finish [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102) remainder on **2.0.85**.
- Target: Fill every checklist row pass/fail/not run; close #102; leave #104 open.
- Actions log: Quiet line-stable + checkpoint; open-note ACTIVE push; type-during-sync CLI approx; QUIET-TITLE/guard/fence deferred with reason; evidence + TEST_PLAN.
- Validation: TT title `post102-active-135332` via MCP; markers survived sync; `checkPoint` advanced; TT-DELETE still fail (#104).
- Problems: TT-DELETE (`open` #104); several not-run (modal/fixtures/no-mtime) — documented.
- To Be Done: Owner merges this PR; close #102; next #104 or #84.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/102, #104, `docs/pilot/results/POST-PERF-REGRESSION/102-post-perf-regression.md`, `CHANGELOG.md`

### Iteration 2026-10-23 12:36 UTC

- Context: After GitHub close of [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62), start [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102) post-PERF regression on **2.0.85**.
- Target: Idle reconfirm + comments smoke + vitest; record honest fails; leave editor rows not run if not executed.
- Actions log: Quiet ×2 (byId/comments 0); `TP-BUG-COMMENT-NO-PUSH` pass; `TP-COMMENT-TT-DELETE` fail → [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104); evidence `POST-PERF-REGRESSION/`; vitest **715**.
- Validation: Quiet2 ~6.6 s / probes 0; NO-PUSH marker in TT Comments; TT-DELETE re-pushed; `npx vitest run` → **715** passed.
- Problems: TT-DELETE live fail (`open` #104); editor/guard/quiet-title still **not run**.
- To Be Done: Finish remaining #102 rows or defer; merge this PR after #103 epic-close docs on tip.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/102, #104, #62, `docs/pilot/results/POST-PERF-REGRESSION/102-post-perf-regression.md`, `CHANGELOG.md`

### Iteration 2026-10-23 12:30 UTC

- Context: Idle path done on **2.0.85**; user asked to close epic [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) then start [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102).
- Target: Close #62 with honest deferral of `TP-DELTA-*` to #84; no invented delta pass; unlock #102.
- Actions log: Wrote `PERF-DELTA/62-epic-close.md` + INDEX; `TEST_PLAN` delta rows stay **not run** → #84; PROJECT_STATE / PO_STATUS / issues INDEX.
- Validation: Done-when: idle-zero **pass**, probes/wall-time down; `TP-DELTA-*` **not run** (allowed); tip has #101 evidence.
- Problems: None for epic close (`resolved`); #84/#86/#87 remain open follow-ons.
- To Be Done: Owner merges; close #62; run #102 post-PERF regression on Thinkpad-tts-test.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/62, #84, #102, `docs/pilot/results/PERF-DELTA/62-epic-close.md`, `CHANGELOG.md`

### Iteration 2026-10-23 08:49 UTC

- Context: Owner installed **2.0.85**; #85 asked for live `TP-IDLE-ZERO` after slice 5 byId cut.
- Target: Quiet sync ×2 on Thinkpad-tts-test; record real `[perf]`; update `TEST_PLAN` honestly; PR into `abyss-mapping`.
- Actions log: Obsidian CLI reload + `tts-sync` ×2; `[perf]` hook; wrote `PERF-DELTA/85-idle-zero-2.0.85.md` + INDEX; updated `TEST_PLAN` / `ABYSS_FIRST_CASES` / PROJECT_STATE / issues INDEX.
- Validation: Quiet1/Quiet2: `getTaskComments` **0**, `getTaskById` **0**, `vaultWrites` 0, `batch/check` 2, `totalMs` ~7 s; vs 2.0.84 quiet byId **44** / ~18 s.
- Problems: None for idle-zero (`resolved`); epic #62 remains open for `#84` / P2.
- To Be Done: Owner merges docs PR; close #85; leave #62 open for delta pilot.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/85, #62, #98, `docs/pilot/results/PERF-DELTA/85-idle-zero-2.0.85.md`, `CHANGELOG.md`

### Iteration 2026-10-23 08:31 UTC

- Context: Owner merged [#99](https://github.com/semyon-alekseev-noveo/tt-sync/pull/99) (PERF/DELTA slice 5 / #98); tip still **2.0.84** — need bump before tag (PROC-RELEASE-GATE #30).
- Target: Bump **2.0.85** on a release PR into `abyss-mapping`; tag/release only after owner merges.
- Actions log: Branch `chore/release-2.0.85` from merge tip `8572070`; `npm version 2.0.85`; PO/PROJECT_STATE install pointers; no behavior change beyond #99 already on tip.
- Validation: `npx vitest run` → **102** files, **715** passed; `npm run build` → ok (`manifest.json` **2.0.85**).
- Problems: GitHub release **2.0.85** blocked on merge (`open` until owner); live `#85` re-pilot still pending — do not invent.
- To Be Done: Owner merges this PR; then tag **2.0.85** once on `abyss-mapping` tip; update plugin; `#85` re-pilot; leave epic #62 open.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/pull/99, https://github.com/semyon-alekseev-noveo/tt-sync/issues/62, #98, #85, `CHANGELOG.md`

### Iteration 2026-10-23 08:17 UTC

- Context: Live **2.0.84** quiet still **44** `getTaskById` (20 ProjectScheme + 24 false parentChanged → list-move); comments already **0** (#98).
- Target: Cut quiet byId probes (`TP-IDLE-BYID-ZERO`); no version bump; leave #85/#62 open.
- Actions log: Dexie/`updated` in `ProjectScheme.run`; `vaultParentMeaningfullyChanged`; list-move GET only when projectIds differ; tests `tpIdleByIdZero.test.ts`; evidence `PERF-DELTA/98-slice5-idle-byid.md`.
- Validation: `npx vitest run` → **102** files, **715** passed; `npm run build` → ok.
- Problems: Live byId still open until #85 after release (`open`); failed-move with local already at destination remains a residual edge.
- To Be Done: Owner merges; bump/release; #85 re-pilot; leave #62 open.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/98, #62, #85, `CHANGELOG.md`

### Iteration 2026-10-23 07:53 UTC

- Context: Owner installed **2.0.84**; #85 asked for live `TP-IDLE-ZERO` after slice 4 empty-sweep.
- Target: Quiet sync ×2 on Thinkpad-tts-test; record real `[perf]`; update `TEST_PLAN` honestly; PR into `abyss-mapping`.
- Actions log: Obsidian CLI reload + `tts-sync` ×2; `[perf]` hook; wrote `PERF-DELTA/84-idle-zero-2.0.84.md` + INDEX; updated `TEST_PLAN` / `ABYSS_FIRST_CASES` / PROJECT_STATE / issues INDEX.
- Validation: Quiet1/Quiet2: `getTaskComments` **0**, `getTaskById` **44**, `vaultWrites` 0, `batch/check` 2, `totalMs` ~18 s; vs 2.0.83 quiet **871** / ~250–276 s.
- Problems: Idle-zero still **fail** (byId 44≠0) — comments win (`open` on #85/#62 for residual byId); do not invent pass.
- To Be Done: Owner merges docs PR; next cut quiet `getTaskById` / #84; leave epic #62 open.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/85, #62, #94, `docs/pilot/results/PERF-DELTA/84-idle-zero-2.0.84.md`, `CHANGELOG.md`

### Iteration 2026-10-23 07:39 UTC

- Context: Owner merged [#95](https://github.com/semyon-alekseev-noveo/tt-sync/pull/95) (PERF/DELTA slice 4 empty-sweep / #94); tip still **2.0.83** — need bump before tag (PROC-RELEASE-GATE #30).
- Target: Bump **2.0.84** on a release PR into `abyss-mapping`; tag/release only after owner merges.
- Actions log: Branch `chore/release-2.0.84` from merge tip `3242405`; `npm version 2.0.84`; PO/PROJECT_STATE install pointers; no behavior change beyond #95 already on tip.
- Validation: `npx vitest run` → **101** files, **712** passed; `npm run build` → ok (`manifest.json` **2.0.84**).
- Problems: GitHub release **2.0.84** blocked on merge (`open` until owner); live `#85` re-pilot still pending — do not invent.
- To Be Done: Owner merges this PR; then tag **2.0.84** once on `abyss-mapping` tip; update plugin; `#85` re-pilot; leave epic #62 open.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/pull/95, https://github.com/semyon-alekseev-noveo/tt-sync/issues/62, #94, #85, `CHANGELOG.md`

### Iteration 2026-10-23 07:05 UTC

- Context: After **2.0.83** live quiet still ~**871** `getTaskComments` (`PERF-DELTA/83-idle-zero-2.0.83.md`); many are empty Abyss threads / double hash-unchanged+file-sweep calls (#94).
- Target: Skip Comments GET when threads+maps empty; defer per-line comment sync on full-file checks to `sweepAbyssCommentsInFile`; no version bump.
- Actions log: `canSkipAbyssCommentNetwork` empty-fast; `deferCommentSweep` in `scan.ts`; cases `TP-IDLE-EMPTY-SWEEP`; evidence `PERF-DELTA/94-slice4-empty-sweep.md`; TEST_PLAN / ABYSS / INDEX / PROJECT_STATE.
- Validation: `npx vitest run` → **101** files, **712** passed; `npm run build` → ok.
- Problems: Live idle still open (#85) — do not invent pass; leave epic #62 open.
- To Be Done: Owner merges this PR; bump/release; #85 re-pilot; leave #62 open.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/94, #62, #85, `docs/pilot/results/PERF-DELTA/94-slice4-empty-sweep.md`, `CHANGELOG.md`

### Iteration 2026-10-23 06:54 UTC

- Context: Owner installed **2.0.83**; #85 asked for live `TP-IDLE-ZERO` after slice 3 double-sweep.
- Target: Quiet sync ×2 on Thinkpad-tts-test; record real `[perf]`; update `TEST_PLAN` honestly; PR into `abyss-mapping`.
- Actions log: Obsidian CLI reload + `tts-sync` ×2; `[perf]` hook; wrote `PERF-DELTA/83-idle-zero-2.0.83.md` + INDEX; updated `TEST_PLAN` / `ABYSS_FIRST_CASES` / PROJECT_STATE / issues INDEX.
- Validation: Quiet1/Quiet2: `getTaskComments` **871**, `getTaskById` **44**, `vaultWrites` 0, `batch/check` 2, `totalMs` ~250–276 s (`phaseMs.push` ~30 ms); vs 2.0.82 quiet **1741** / ~475 s.
- Problems: Idle-zero still **fail** (871≠0) — remaining `syncFiles` sweep (`open` on #85/#62); do not invent pass.
- To Be Done: Owner merges docs PR; next idle cuts / #84; leave epic #62 open.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/85, #62, #83, `docs/pilot/results/PERF-DELTA/83-idle-zero-2.0.83.md`, `CHANGELOG.md`

### Iteration 2026-10-23 06:04 UTC

- Context: Owner merged [#91](https://github.com/semyon-alekseev-noveo/tt-sync/pull/91) (PERF/DELTA slice 3 stop double-sweep / #83); tip still **2.0.82** — need bump before tag (PROC-RELEASE-GATE #30).
- Target: Bump **2.0.83** on a release PR into `abyss-mapping`; tag/release only after owner merges.
- Actions log: Branch `chore/release-2.0.83` from merge tip `fae3fc4`; `npm version 2.0.83`; PO/PROJECT_STATE install pointers; no behavior change beyond #91 already on tip.
- Validation: `npx vitest run` → **101** files, **710** passed; `npm run build` → ok (`dist/manifest.json` **2.0.83**).
- Problems: GitHub release **2.0.83** blocked on merge (`open` until owner); live `#85` re-pilot still pending — do not invent.
- To Be Done: Owner merges this PR; then tag **2.0.83** once on `abyss-mapping` tip; update plugin; `#85` re-pilot; leave epic #62 open.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/pull/91, https://github.com/semyon-alekseev-noveo/tt-sync/issues/62, #83, #85, `CHANGELOG.md`

### Iteration 2026-10-23 05:42 UTC

- Context: Live `TP-IDLE-ZERO` still **fail** on **2.0.82** (`getTaskComments` 1741 ≈ 2× startup); epic #62 slice 3 = stop double-sweep (#83).
- Target: Quiet/manual Synchronize must not full-vault comment-sweep twice; keep BUG-COMMENT-NO-PUSH for edited/active; no version bump.
- Actions log: Narrowed `pathsForPrePullPush` (drop manual all-paths); `syncFiles` skips mods for `ctx.locallyEdited`; cases `TP-IDLE-MANUAL-SCOPE`; evidence `PERF-DELTA/83-slice3-manual-scope.md`; brought `82-idle-zero-2.0.82.md` onto tip docs.
- Validation: `npx vitest run` + `npm run build` (see PR); `bugCommentNoPush.test.ts` green.
- Problems: Live idle still open (#85) — do not invent pass; residual NO-PUSH soak on tip (#65).
- To Be Done: Owner merges this PR; bump/release; #85 re-pilot; leave #62 open.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/83, #62, #85, `docs/pilot/results/PERF-DELTA/83-slice3-manual-scope.md`, `CHANGELOG.md`

### Iteration 2026-10-23 04:47 UTC

- Context: Owner installed **2.0.82** on pilot; #85 asked for live `TP-IDLE-ZERO` re-measure after slice 2.
- Target: Quiet sync ×2 on Thinkpad-tts-test; record real `[perf]`; update `TEST_PLAN` honestly; PR into `abyss-mapping` (no merge/release; leave #85/#62 open on fail).
- Actions log: Obsidian CLI reload + `tts-sync` ×2; hooked `[perf]` into `.tickticksync/perf-pilot.log`; wrote `PERF-DELTA/82-idle-zero-2.0.82.md` + INDEX; updated `TEST_PLAN` / `ABYSS_FIRST_CASES` / PROJECT_STATE / issues INDEX.
- Validation: Quiet1/Quiet2 `[perf]`: `getTaskComments` **1741**, `getTaskById` **68**, `vaultWrites` 0, `batch/check` 2, `totalMs` ~475–478 s; startup same session comments **871** / byId **44**.
- Problems: Live idle still **fail** (only −16 vs 1757 on 2.0.81) — likely need #83 double-sweep (`open`); do not invent pass.
- To Be Done: Owner merges docs PR; comment #85/#62; implement #83; re-pilot; leave epic #62 open.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/85, #62, #83, `docs/pilot/results/PERF-DELTA/82-idle-zero-2.0.82.md`, `CHANGELOG.md`

### Iteration 2026-10-23 04:05 UTC

- Context: Owner merged [#88](https://github.com/semyon-alekseev-noveo/tt-sync/pull/88) (PERF/DELTA slice 2 idle-fast + `commentCount` backfill); tip still **2.0.81** — need a bump before tag (PROC-RELEASE-GATE #30).
- Target: Bump **2.0.82** on a release PR into `abyss-mapping`; tag/release only after owner merges (no feature-branch tag, no retag).
- Actions log: Branch `chore/release-2.0.82` from merge tip `d40b7e9`; `npm version 2.0.82`; PO/PROJECT_STATE install pointers; reopen epic #62 (auto-closed by #88); no behavior change beyond #88 already on tip.
- Validation: `npx vitest run` → **101** files, **708** passed; `npm run build` → ok (`dist/manifest.json` **2.0.82**).
- Problems: GitHub release **2.0.82** blocked on merge (`open` until owner); live `#85` re-pilot still **not run** — do not invent.
- To Be Done: Owner merges this PR; then tag **2.0.82** once on `abyss-mapping` tip; update plugin; `#85` re-pilot; leave epic #62 open.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/pull/88, https://github.com/semyon-alekseev-noveo/tt-sync/issues/62, #82, #85, `CHANGELOG.md`

### Iteration 2026-10-23 03:50 UTC

- Context: Dual-analyst consensus after **2.0.81** `TP-IDLE-ZERO` fail (1757 comment GETs); epic #62 needs slice 2 + child trackers.
- Target: Brief + children under #62; implement slice 2 (`commentCount` backfill, idle-fast sync, preparePersist gate); PR into `abyss-mapping` (no bump/merge/release/close #62).
- Actions log: Wrote `PERF-DELTA/62-analyst-dual-brief.md` + INDEX; filed #82–#87 and commented on #62; `canSkipAbyssCommentNetwork` + pull echo-skip backfill; gate `preparePersistNetwork`; cases `TP-IDLE-ZERO-SWEEP`; docs INDEX/TEST_PLAN/PROJECT_STATE.
- Validation: `npx vitest run` → **101** files, **708** passed; `npm run build` → ok; PR https://github.com/semyon-alekseev-noveo/tt-sync/pull/88.
- Problems: Live idle still **fail** until re-pilot #85; double-sweep deferred to #83 (`open`).
- To Be Done: Owner merges this PR; slice 3 #83; pilots #84/#85; no invented pass rows.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/62, #82–#87, `docs/pilot/results/PERF-DELTA/62-analyst-dual-brief.md`, `CHANGELOG.md`

### Iteration 2026-10-23 03:17 UTC

- Context: Owner installed **2.0.81** on pilot; #62 still needed live `[perf]` / `TP-IDLE-ZERO` (unit-only after slice 1).
- Target: Quiet sync ×2 on Thinkpad-tts-test; record real `[perf]` under `PERF-DELTA/`; update `TEST_PLAN` honestly; PR into `abyss-mapping` (no merge/release/close #62).
- Actions log: Obsidian CLI `tts-sync` ×2 after reload; hooked `[perf]` into `.tickticksync/perf-pilot.log`; wrote `81-idle-zero-2.0.81.md` + INDEX; `TEST_PLAN` TP-IDLE-ZERO → fail.
- Validation: Quiet1/Quiet2 `[perf]`: `getTaskComments` **1757**, `getTaskById` **68**, `vaultWrites` 0, `totalMs` ~468–472 s; startup same session comments **879** / byId **44**.
- Problems: Live idle still far from zero comment GETs (`open` for next #62 slice); Obsidian hybrid-search MCP unavailable (`mitigated` via CLI).
- To Be Done: Owner merges docs PR; comment #62 with evidence link; next slice find remaining comment GET sites / unknown `commentCount`.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/62, `docs/pilot/results/PERF-DELTA/81-idle-zero-2.0.81.md`, `CHANGELOG.md`

### Iteration 2026-10-23 01:54 UTC

- Context: Owner merged [#79](https://github.com/semyon-alekseev-noveo/tt-sync/pull/79) (PERF/DELTA slice 1 idle comment-probe cut); tip still **2.0.80** — need a bump before tag (PROC-RELEASE-GATE #30).
- Target: Bump **2.0.81** on a release PR into `abyss-mapping`; tag/release only after owner merges (no feature-branch tag, no retag).
- Actions log: Branch `chore/release-2.0.81` from merge tip `eb3ad3a`; `npm version 2.0.81`; PO/PROJECT_STATE install pointers; no behavior change beyond #79 already on tip.
- Validation: `npx vitest run` → **100** files, **703** passed; `npm run build` → ok (`dist/manifest.json` **2.0.81**).
- Problems: GitHub release **2.0.81** blocked on merge (`open` until owner); live `[perf]` / `TP-IDLE-ZERO` pilot still **not run**.
- To Be Done: Owner merges this PR; then tag **2.0.81** once on `abyss-mapping` tip; comment #62; leave epic open.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/pull/79, https://github.com/semyon-alekseev-noveo/tt-sync/issues/62, `CHANGELOG.md`

### Iteration 2026-10-23 01:43 UTC

- Context: Epic [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) PERF/DELTA first slice; quiet sync still GETed Comments for every task with Abyss threads (`vaultThreads > 0`), against TP-IDLE-ZERO / `TICKTICK_DELTA_API.md` §3.2.
- Target: Cut avoidable `getTaskComments` on idle when `commentCount` already matches vault threads; lock with vitest; scaffold `docs/pilot/results/PERF-DELTA/`; PR into `abyss-mapping` (no release).
- Actions log: Restored count/unknown/dup-only probe gate in `VaultSyncCoordinator.vaultLineBehindTask`; tests `TP-IDLE-ZERO` matched-count skip; `TEST_PLAN` / `ABYSS_FIRST_CASES` / `PROJECT_STATE` / PO pointers; issue label P0; baseline note under `PERF-DELTA/`.
- Validation: `npx vitest run` → **100** files, **703** passed; `npm run build` → ok.
- Problems: Live pilot `[perf]` / `TP-DELTA-*` / `TP-IDLE-ZERO` still **not run** (`open`); TECH-START-1 and `ensureVaultFilesRegistered` scan deferred.
- To Be Done: Pilot `[perf]` baseline on tip after merge; next slices TECH-START-1 soften, full-vault register scan, §3.5 delta pilot.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/62, `docs/pilot/results/PERF-DELTA/`, `CHANGELOG.md`

### Iteration 2026-10-22 12:05 UTC

- Context: Documented backlog gaps had no GitHub trackers; owner asked to file issues with **perf/delta as P0**.
- Target: Few high-signal issues on `semyon-alekseev-noveo/tt-sync`; update `docs/github-issues/INDEX.md` + `PROJECT_STATE.md` pointers; PR into `abyss-mapping` (no merge/release).
- Actions log: Created #62 (PERF/DELTA P0), #63 (product risks), #64 (pilot config), #65 (NOTE-L3b residual), #66 (post-#31 / TECH-API-1); skipped DEL-3/CTX-D2 (under #20) and items already on #15–#33.
- Validation: `gh issue view 62,63,64,65,66 --repo semyon-alekseev-noveo/tt-sync` → open with P0/P1/P2 labels; INDEX table lists them.
- Problems: No changes — tracker-only iteration (`resolved`).
- To Be Done: Owner merges docs PR; pick up #62 after #15 soft dependency allows; do not invent pilot pass rows.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/62, `docs/github-issues/INDEX.md`, `CHANGELOG.md`

### Iteration 2026-10-22 11:30 UTC

- Context: Owner merged [#60](https://github.com/semyon-alekseev-noveo/tt-sync/pull/60); release **2.0.80** from `abyss-mapping` tip (PROC-RELEASE-GATE).
- Target: One tag at merge commit; vitest+build; pilot deploy; close #27; leave #28/#29 open unless case-verified.
- Actions log: Fetched `abyss-mapping` @ `e13c195`; vitest+build; tagged `2.0.80` once; GitHub release with assets; deployed release to Thinkpad-tts-test; Synchronize; evidence `60-release-2.0.80-smoke.md`; PO install pointer → **2.0.80**.
- Validation: `npx vitest run` → **100** files, **701** passed; `npm run build` → ok; plugin **2.0.80**; `task-11-16` stays **4** Abyss bullets (no ISO twins).
- Problems: #28/#29 case pilots still **not run** — issues stay open (`open`).
- To Be Done: Case-specific pilot for #28/#29 when fixtures exist; continue #15 (#17/#18).
- References: https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.80, `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/60-release-2.0.80-smoke.md`, `CHANGELOG.md`

### Iteration 2026-10-22 10:58 UTC

- Context: After release **2.0.79**, pilot `task-11-16` still had ~21 Abyss comment twins; #27 stayed open (merge collapse never ran on quiet sync).
- Target: Synchronize rewrites in-scope vault twins by `normalizedCommentKey`; ship **2.0.80** PR into `abyss-mapping`; do not release until merged.
- Actions log: Branch `fix/bug-comment-vault-dup-key-2.0.80`; `vaultHasDuplicateCommentKeys`; `vaultLineBehindTask` → `vault-comment-dup-keys` (no TT wipe); twins-only hash mismatch not sticky `local-edit`; bump **2.0.80**; docs + `27-vault-dup-key-2.0.80-unit.md`.
- Validation: `npx vitest run` → **100** files, **701** passed; `npm run build` → ok; pilot local deploy → `task-11-16` 20→4 bullets (`vault-comment-dup-keys`).
- Problems: GitHub release **2.0.80** still blocked on merge (`open` until owner).
- To Be Done: Owner merges [#60](https://github.com/semyon-alekseev-noveo/tt-sync/pull/60); release **2.0.80** from `abyss-mapping`; then close #27. Docs [#59](https://github.com/semyon-alekseev-noveo/tt-sync/pull/59) already on `abyss-mapping`.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/27, `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/27-vault-dup-key-2.0.80-unit.md`, `CHANGELOG.md`

### Iteration 2026-10-22 10:47 UTC

- Context: PR #58 merged on `abyss-mapping`; owner asked for release **2.0.79** + pilot smoke (no feature-branch tag, no retag).
- Target: Tag merge tip once; deploy Thinkpad-tts-test; record evidence; close #27/#28/#29 only if case-verifiable.
- Actions log: Fetched `abyss-mapping` @ `38e7371`; vitest+build; GitHub release **2.0.79** with assets; pilot deploy/reload/`tts-sync`; docs under `PILOT-BATCH-EDITOR-SAFETY/`.
- Validation: `npx vitest run` → **100** files, **697** passed; `npm run build` → ok; plugin **2.0.79**; `checkPoint` `1792660281617` → `1792664146187`.
- Problems: #27 live twins still on `task-11-16` after Synchronize; #28/#29 case paths not induced — issues stay **open**.
- To Be Done: Case-specific pilot for #27 (collapse/cleanup) then #28/#29; continue #15 (#17/#18).
- References: https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.79, `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/58-release-2.0.79-smoke.md`, `CHANGELOG.md`

### Iteration 2026-10-22 10:26 UTC

- Context: P0 comment safety bugs #27/#28/#29 on tip **2.0.78** (vault stamp twins; empty-vault wipe; getTaskComments fail-open).
- Target: Ship **2.0.79** with failing BUG-* tests → fixes; one PR into `abyss-mapping`; do not release from feature branch.
- Actions log: Branch `fix/p0-comment-bugs-2.0.79`; merge collapse by `normalizedCommentKey`; wipe only with hash flag + vault-origin maps; `getTaskComments` → `null` on unknown; bump **2.0.79**; docs + pilot results under `PILOT-BATCH-EDITOR-SAFETY`.
- Validation: `npx vitest run` → **100** files, **697** passed; `npm run build` → ok.
- Problems: Pilot vault re-verify for #27–#29 — **not run** (unit only this iteration).
- To Be Done: Owner merges PR → release **2.0.79** from `abyss-mapping`; pilot evidence; close #27/#28/#29 after verify.
- References: issues #27/#28/#29, `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/`, `CHANGELOG.md`

### Iteration 2026-10-22 10:00 UTC

- Context: Owner decided release policy for PROC-RELEASE-GATE (#30) after retagging **2.0.78** from pre-merge tip onto the merge commit.
- Target: Encode “release only after merge to `abyss-mapping`; never retag the same `2.0.x`” in process docs/rules.
- Actions log: Updated `DEV_FLOW.md` Versioning/releases + Branches; `.cursor/rules/dev-flow.mdc`; `docs/github-issues/30-proc-release-gate.md` + INDEX; comment on #30.
- Validation: Docs-only; no `vitest` / build run required for this iteration.
- Problems: Actions gate items on #30 remain open (`open`).
- To Be Done: Owner merges this docs PR; encode `release.yml` checks when ready.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/30, `DEV_FLOW.md`, `CHANGELOG.md`

### Iteration 2026-10-22 09:29 UTC

- Context: Owner asked to bring stale comment-fix PRs #24/#26 and bump #54 into mergeable state on modularized `abyss-mapping` (release tip **2.0.77**).
- Target: One combined tip **2.0.78** — modularization + BUG-COMMENT-ABYSS-VIEW + BUG-COMMENT-DUP-STAMP; open PR into `abyss-mapping`; close obsolete #24/#26/#54; release + pilot smoke.
- Actions log: Branch `feat/comment-fixes-2.0.78` from `chore/release-2.0.77-modularization`; cherry-pick dee9569 / ab05fdf / 5b8467b with conflict resolution (keep modular structure); bump **2.0.78**; docs/PO/TEST_PLAN.
- Validation: `npx vitest run` → **100** files, **693** passed; `npm run build` → ok (`dist/main.js` **2.0.78**). Release **2.0.78** published. Pilot smoke **pass**: deploy + reload + `tts-sync` (cleared stuck `syncRunning`); `checkPoint` advanced (`55-release-smoke.md`).
- Problems: First `tts-sync` after reload left `syncRunning` stuck true until cleared via eval — **mitigated** for smoke; still open for #30 reliability.
- To Be Done: Owner merges [#55](https://github.com/semyon-alekseev-noveo/tt-sync/pull/55); BRAT Check for updates → **2.0.78**; continue PROC-RELEASE-GATE (#30); fix #27 vault dup key.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/pull/55, https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.78, `docs/pilot/results/COMMENT-FIXES-2.0.78/`, `CHANGELOG.md`

### Iteration 2026-10-22 08:15 UTC

- Context: Epic #31 TECH-SYNC-MODULARIZATION stack (#34–#40) merged on `abyss-mapping`; owner asked for release + pilot smoke before closing the epic.
- Target: Release **2.0.77** from modularization tip; encode epic-close ⇒ release + gate; close #31 with evidence.
- Actions log: Branch `chore/release-2.0.77-modularization`; bump `package.json` / `manifest.json` / `versions.json`; update `DEV_FLOW.md`, `.cursor/rules/dev-flow.mdc`, `PO_STATUS.md`, `PROJECT_STATE.md`, `TEST_PLAN.md`, pilot results; GitHub release + pilot deploy.
- Validation: `npx vitest run` → **100** files, **688** passed; `npm run build` → ok (`dist/main.js` 2.0.77). Pilot smoke **pass**: deploy + reload + `tts-sync`; `checkPoint` advanced (`31-release-2.0.77-smoke.md`).
- Problems: GitHub releases **2.0.75**/**2.0.76** (comment fixes) are still on open PRs #24/#26 — not ancestors of this tip (`open` for #30).
- To Be Done: Owner merges version-bump PR [#54](https://github.com/semyon-alekseev-noveo/tt-sync/pull/54) into `abyss-mapping`; land #24/#26 or re-cut after merge; continue PROC-RELEASE-GATE (#30).
- References: https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.77, https://github.com/semyon-alekseev-noveo/tt-sync/pull/54, `docs/pilot/results/TECH-SYNC-MODULARIZATION/`, `DEV_FLOW.md`, `CHANGELOG.md`

### Iteration 2026-10-22 07:19 UTC

- Context: TECH-SYNC-MODULARIZATION (#31) PR 7 — orchestrator phases still imported Dexie; store was concrete classes only.
- Target: Extract-only store ports (`FileTaskQueries` / `TaskRepository` / `SyncMeta`); no `db` in sync phases; no behavior change.
- Actions log: Added `repositories/ports/*` + `SyncMetaRepository`; typed `PluginContext`; rewired phases + deletion/ops handlers; guard `storePorts.noDexieInOrchestrator`; docs + pilot `31-pr7-store-ports.md`.
- Validation: `npx vitest run` → **100** files, **688** passed; `npm run build` → ok.
- Problems: - No changes
- To Be Done: PR into `abyss-mapping` (stack on #39); comment #31; next = timed `vaultDeletion` or further store extract.
- References: `docs/SYNC_MODULARIZATION.md`, `docs/pilot/results/TECH-SYNC-MODULARIZATION/31-pr7-store-ports.md`, `CHANGELOG.md`

### Iteration 2026-10-22 07:10 UTC

- Context: TECH-SYNC-MODULARIZATION (#31) PR 6 — monolithic `TaskModificationDetector` (~1138 lines) after taskParser split.
- Target: Extract-only split detect vs push under `src/sync/vault-push/taskModification/`; keep `@/services/TaskModificationDetector` stable; no behavior change.
- Actions log: Added modules (types, detect, push, newTasks, scan) + mixin facade; services re-export + vault-push barrel; docs + pilot `31-pr6-task-modification-detector.md`.
- Validation: `npx vitest run` → **99** files, **687** passed; `npm run build` → ok.
- Problems: - No changes
- To Be Done: PR into `abyss-mapping` (stack on #38); comment #31; next = PR 7 store ports or timed `vaultDeletion`.
- References: `docs/SYNC_MODULARIZATION.md`, `docs/pilot/results/TECH-SYNC-MODULARIZATION/31-pr6-task-modification-detector.md`, `CHANGELOG.md`

### Iteration 2026-10-22 06:54 UTC

- Context: TECH-SYNC-MODULARIZATION (#31) PR 5 — monolithic `taskParser.ts` (~1545 lines) after PluginContext extract.
- Target: Extract-only split by concern under `src/taskParser/`; keep `@/taskParser` imports stable; no behavior change.
- Actions log: Added concern modules (regex, tags, reminders, markers, structure, diff, notes, convertToLine/ToTask) + mixin facade; root re-export; docs + pilot `31-pr5-task-parser.md`.
- Validation: `npx vitest run` → **99** files, **687** passed; `npm run build` → ok.
- Problems: - No changes
- To Be Done: PR into `abyss-mapping` (stack on #37); comment #31; next = PR 6 `TaskModificationDetector` split or store ports.
- References: `docs/SYNC_MODULARIZATION.md`, `docs/pilot/results/TECH-SYNC-MODULARIZATION/31-pr5-task-parser.md`, `CHANGELOG.md`

### Iteration 2026-10-22 06:41 UTC

- Context: TECH-SYNC-MODULARIZATION (#31) PR 4 — `main` ↔ `services` cycle (**TECH-CIRC-1**) after vault-io extract.
- Target: Extract-only dependency inversion via `PluginContext`; services stop importing `@/main`; no behavior change.
- Actions log: Added `src/pluginContext.ts`; `TickTickSync implements PluginContext`; retargeted services/fileOperation/taskParser/sync + service modals/settingsstore; guard test `pluginContext.noMainImport`; docs + pilot `31-pr4-plugin-context.md`.
- Validation: `npx vitest run` → **99** files, **687** passed; `npm run build` → ok.
- Problems: - No changes
- To Be Done: PR into `abyss-mapping` (stack on #36); comment #31; next = PR 5 `taskParser` split or store ports.
- References: `docs/SYNC_MODULARIZATION.md`, `docs/pilot/results/TECH-SYNC-MODULARIZATION/31-pr4-plugin-context.md`, `CHANGELOG.md`

### Iteration 2026-10-22 03:42 UTC

- Context: TECH-SYNC-MODULARIZATION (#31) PR 3 — vault write/cache/pending-marker modules still split across `services/` and `sync/`.
- Target: Extract-only `vault-io` facade; push/pull import `@/sync/vault-io` only; no behavior change.
- Actions log: Moved `vaultWrite`, `fileRunCache`, `pendingMarkerTaskIds` under `src/sync/vault-io/`; added facade `index.ts` + thin old-path re-exports; retargeted consumers; docs + pilot `31-pr3-vault-io.md`.
- Validation: `npx vitest run` → **98** files, **686** passed; `npm run build` → ok.
- Problems: - No changes
- To Be Done: PR into `abyss-mapping` (stack on #35); comment #31; next = PR 4 main↔services break.
- References: `docs/SYNC_MODULARIZATION.md`, `docs/pilot/results/TECH-SYNC-MODULARIZATION/31-pr3-vault-io.md`, `CHANGELOG.md`

### Iteration 2026-10-22 03:32 UTC

- Context: TECH-SYNC-MODULARIZATION (#31) PR 2 — Phase 2 delete still inline in `syncFiles`; handler imported pending-marker module directly.
- Target: Extract-only lifecycle boundary — `runVaultDeletionPhase` + `TaskDeletionHandler` via `SyncRunContext.isPendingMarker` only.
- Actions log: Added `src/sync/lifecycle/runVaultDeletionPhase.ts`; wired `syncFiles`/`runSyncFilesPhase` to pass ctx; removed `pendingMarkerTaskIds` import from handler; docs + pilot `31-pr2-lifecycle.md`.
- Validation: `npx vitest run` → **98** files, **686** passed; `npm run build` → ok.
- Problems: - No changes
- To Be Done: PR into `abyss-mapping` (stack on #34); comment #31; next = PR 3 vault-io facade.
- References: `docs/SYNC_MODULARIZATION.md`, `docs/pilot/results/TECH-SYNC-MODULARIZATION/31-pr2-lifecycle.md`, `CHANGELOG.md`

### Iteration 2026-10-22 03:28 UTC

- Context: Resume #31 after prior agent disconnect; PR 1 extract already on `feat/tech-sync-modularization-pr1`.
- Target: Re-verify gate, open PR into `abyss-mapping`, comment evidence on #31.
- Actions log: Re-ran vitest + build; opened PR #34; commented on #31 with module map + next slice.
- Validation: `npx vitest run` → **97** files, **685** passed; `npm run build` → ok.
- Problems: - No changes
- To Be Done: Owner merges #34; next slice = PR 2 lifecycle (`runVaultDeletionPhase` out of `syncFiles`).
- References: https://github.com/semyon-alekseev-noveo/tt-sync/pull/34, `docs/pilot/results/TECH-SYNC-MODULARIZATION/`, `CHANGELOG.md`

### Iteration 2026-10-22 03:15 UTC

- Context: Epic #31 TECH-SYNC-MODULARIZATION — sync takes ~45s on pilot; god `TickTickService` blocks safe perf/fix slices.
- Target: PR 1 extract-only — move `synchronizationInner` phase bodies into `src/sync/phases/*` with no behavior change.
- Actions log: Added projects/register/deletionGuard/push/pull/vaultReconcile/subtasks/syncFiles phase modules; thinned orchestrator; wired `SyncRunContext.projects` / `pushSinceMs` / `guardedPull`; updated SYNC_MODULARIZATION, ANALYST_REFERENCE_DIAGRAMS, PROJECT_STATE; wrote `docs/pilot/results/TECH-SYNC-MODULARIZATION/`.
- Validation: `npx vitest run` → **97** files, **685** passed; `npm run build` → ok (`dist/main.js`).
- Problems: - No changes
- To Be Done: PR into `abyss-mapping`; comment #31; next slice = lifecycle extract from `syncFiles` (PR 2).
- References: `docs/SYNC_MODULARIZATION.md`, `docs/pilot/results/TECH-SYNC-MODULARIZATION/`, `CHANGELOG.md`

### Iteration 2026-10-21 14:59 UTC

- Context: After **2.0.76**, run P0 **PILOT-BATCH-EDITOR-SAFETY** #16 open-note/editor verify; sticky `local-edit` on `2026-10-19.md`.
- Target: Record #16 pilot results; file vault-side comment twin bug if confirmed.
- Actions log: Pilot TP-EMPTY-EDITOR-DISK / TP-NO-CARET-REWRITE / TP-ACTIVE-PUSH-DURING-SYNC / TP-NO-STALE-VIEW-READ on **2.0.76**; evidence under `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/`; `gh issue create` #27 **BUG-COMMENT-VAULT-DUP-KEY**.
- Validation: Four #16 rows **pass**; vault note has 8 Abyss bullets for 4 keys (fail → #27); vitest editor-cluster subset **7 passed**.
- Problems: **BUG-COMMENT-VAULT-DUP-KEY** — **open** (analyst).
- To Be Done: #17 EMPTY-SIDE-GUARD; #18 deferred-id; fix #27 with failing test.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/16, https://github.com/semyon-alekseev-noveo/tt-sync/issues/27, `CHANGELOG.md`

### Iteration 2026-10-21 14:52 UTC

- Context: **BUG-COMMENT-DUP-STAMP** (#25) — Abyss push left stamped+plain TT Comment pairs for the same normalized key.
- Target: One TT comment per vault thread; strip stamp on all POSTs; collapse remote twins; ship **2.0.76**.
- Actions log: Failing tests in `abyssCommentSync.test.ts`; dedupe-by-key before plan; skip vaultOnly when key present; linked re-post uses plain title; bump **2.0.76**; pilot results folder.
- Validation: `npx vitest run` → **685 passed**; `npm run build` → dist **2.0.76**; pilot MCP `get_comment` on `task-11-16` → **4** plain titles (no stamped twins).
- Problems: Concurrent double-flush race still possible without mutex — **mitigated** by key-present skip + dedupe.
- To Be Done: Close #25; next P0 **PILOT-BATCH-EDITOR-SAFETY** (#15/#16).
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/25, `docs/pilot/results/BUG-COMMENT-DUP-STAMP/`, `CHANGELOG.md`

### Iteration 2026-10-21 14:41 UTC

- Context: After **BUG-COMMENT-ABYSS-VIEW** / #23 verify on `task-11-16`, owner saw TickTick Comments as stamped+plain pairs (count 8 for 4 threads).
- Target: File analyst case **BUG-COMMENT-DUP-STAMP** + GitHub issue; no code fix.
- Actions log: `gh issue create` #25 with screenshot; catalog row; `docs/github-issues/BUG-COMMENT-DUP-STAMP.md` + INDEX; comment on #23.
- Validation: Issue URL returned; case ID unique in `ABYSS_FIRST_CASES.md` (no prior DUP-STAMP).
- Problems: **BUG-COMMENT-DUP-STAMP** — **open** (analyst; hypothesized stamp/race double POST).
- To Be Done: Failing test + fix in a later PR; do not reopen #23.
- References: https://github.com/semyon-alekseev-noveo/tt-sync/issues/25, `docs/github-issues/BUG-COMMENT-DUP-STAMP.md`, `CHANGELOG.md`

### Iteration 2026-10-21 14:35 UTC

- Context: Owner approved commit + BRAT release **2.0.75** for **BUG-COMMENT-ABYSS-VIEW**; asked canonical docs to explain Abyss → vault.modify → push path.
- Target: Ship **2.0.75**; document open-note triggers vs POST body; close #23; PR into `abyss-mapping` (no merge).
- Actions log: Bump manifest/package/versions/dist; architecture notes in `ANALYST_REFERENCE_DIAGRAMS` §2b, `COMMENT_SYNC_MODEL`, `TICKTICK_DELTA_API`, `ABYSS_NOTES_ALIGNMENT`; update TEST_PLAN/PO/PROJECT_STATE/cases; `gh release create 2.0.75`.
- Validation: `npm run build` → dist **2.0.75**; prior vitest **682**; release assets match **2.0.74** pattern.
- Problems: Duplicate-comment race under syncRunning — **open** (unchanged).
- To Be Done: BRAT Check for updates on pilot; next P0 **PILOT-BATCH-EDITOR-SAFETY** (#15–#18).
- References: `docs/pilot/results/BUG-COMMENT-ABYSS-VIEW/`, `docs/ANALYST_REFERENCE_DIAGRAMS.md`, `CHANGELOG.md`

### Iteration 2026-10-21 14:27 UTC

- Context: User added comments on **task-11-16** in Abyss view (did not leave Abyss); TT Comments empty on **2.0.74**.
- Target: **BUG-COMMENT-ABYSS-VIEW** — Abyss `vault.modify` must schedule open-note push; Comments land without markdown editor.
- Actions log: Baseline evidence; fix `EventHandlerService` + `activeFilePush` (`shouldNotifyPushOnVaultModify`, flush without active-file requirement, Abyss sweep); tests; deploy pilot (no version bump); verify MCP + write-trace.
- Validation: `npx vitest run` → **682 passed**; `npm run build` ok; MCP Comments for `6ad83d…` include `comment 1`, `коммент 2`, `abyss-view-verify-*`; write-trace `push-abyss-or-background`.
- Problems: Startup sync can stick `syncRunning` and defer push briefly — **mitigated** by release-after-sync; possible duplicate TT Comments under race — **open**.
- To Be Done: Owner commit/PR when ready; optional release bump; watch duplicate-comment race.
- References: `docs/pilot/results/BUG-COMMENT-ABYSS-VIEW/`, `CHANGELOG.md`

### Iteration 2026-10-21 14:05 UTC

- Context: Owner asked to commit, push feature branch, and publish BRAT release **2.0.74**.
- Target: Ship TickTick v2 comment POST body fix + pilot gate evidence on `tt-sync`; install pointer **2.0.74**.
- Actions log: Staged code/tests/docs/pilot/github-issues; commit on `feat/comment-sync-2.0.63`; push `tt-sync`; `gh release create 2.0.74` with plugin assets; PO_STATUS install → **2.0.74**.
- Validation: Versions in manifest/package/versions/dist = **2.0.74**; release URL returned after create (see this iteration References).
- Problems: - No changes
- To Be Done: Optional PR into `abyss-mapping` (do not merge); BRAT Check for updates on pilot.
- References: `docs/BRAT_INSTALL.md`, `docs/pilot/results/PILOT-GATE-TEST-11-12/`, `CHANGELOG.md`

### Iteration 2026-10-21 13:37 UTC

- Context: Gate Comments pass on **2.0.74** already evidenced; tracker/docs still showed open.
- Target: Close #10–#14/#21; align INDEX / PO_STATUS / TEST_PLAN / gate plan to **pass**.
- Actions log: Updated results + github-issues INDEX; PO_STATUS + `PILOT-GATE-TEST-11-12.md` + TEST_PLAN rows; closed issues via `gh` with evidence links.
- Validation: `gh issue list` — #10–#14/#21 **CLOSED**; #15–#20 remain **OPEN**.
- Problems: write-trace stall after Phase 3b sync — **open** / non-blocking.
- To Be Done: Next P0 focus **PILOT-BATCH-EDITOR-SAFETY** (#15–#18); optional write-trace follow-up.
- References: `docs/pilot/results/PILOT-GATE-TEST-11-12/INDEX.md`, `docs/github-issues/INDEX.md`, `CHANGELOG.md`

### Iteration 2026-10-21 13:34 UTC

- Context: **2.0.74** POST fix deployed; need Phase 3b Comments proof on `test-11-12`.
- Target: Reload + Synchronize; record Comments non-empty; link #13 / #21.
- Actions log: Deploy dist; `plugin:reload` → **2.0.74**; `tts-sync`; cookie GET + MCP `get_comment` → `comment 1` + `test-new-verision`; write `16-phase-3b-verify.md`; create issue #21; comment #13.
- Validation: Comments n=2 with `createdTime` ≈ 13:32:50 UTC; vitest **680** / build already green this cycle.
- Problems: write-trace did not append gate decision for this sync (stall) — **open** / non-blocking for Comments criterion.
- To Be Done: Optional clean sync for `in-sync` write-trace; owner close #13/#14/#21 when ready.
- References: `docs/pilot/results/PILOT-GATE-TEST-11-12/16-phase-3b-verify.md`, `CHANGELOG.md`, issues #13 #21

### Iteration 2026-10-21 13:31 UTC

- Context: Phase 1b — v2 `POST /comment` HTTP 500 while Open API POST worked; Dexie maps empty.
- Target: **BUG-COMMENT-API-POST-500** — recover plugin comment write; ship **2.0.74**; re-verify gate Comments.
- Actions log: Live probe: `{title}`/`{title,content}` → 500; webapp body (`id`,`taskId`,`projectId`,`createdTime`,…) → 200 empty + comment created. `buildAddTaskCommentBody`; empty-body `makeRequest`; test `bugCommentApiPost500.test.ts`; bump **2.0.74**; evidence `15-phase-2b-post-fix.md`.
- Validation: `npx vitest run` → **680 passed** (96 files); `npm run build` ok; live cookie POST with new body → 200 + GET titles.
- Problems: Gate Phase 3b still needs reload + Synchronize evidence — **open** until Comments land.
- To Be Done: Deploy + reload + `tts-sync`; MCP/plugin GET comments on `6ad83bc…`; comment #13; create BUG issue if missing.
- References: `docs/pilot/results/PILOT-GATE-TEST-11-12/15-phase-2b-post-fix.md`, `src/api/index.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 13:23 UTC

- Context: Phase 3 fail on **2.0.73** — need why `vault-comments-ahead` with empty TT Comments before any bump.
- Target: Written hypothesis + case ID; no version bump unless POST path is fixable in-plugin.
- Actions log: Read Phase 0–3 results; dump Dexie maps (empty); probe plugin `addTaskComment` → HTTP 500; MCP POST control OK; write `14-phase-1b-no-post.md`; update INDEX + `ABYSS_FIRST_CASES` (`BUG-COMMENT-API-POST-500`); comment #13.
- Validation: Plugin v2 POST 500 on multiple tasks/bodies; GET comments + task body OK; maps table writable but unused.
- Problems: TickTick v2 comment create broken for this account — **open**; gate blocked — **open**.
- To Be Done: Recover v2 POST or Open API write path; then failing test + fix + **2.0.74** only if code changes; re-run Phase 3.
- References: `docs/pilot/results/PILOT-GATE-TEST-11-12/14-phase-1b-no-post.md`, `CHANGELOG.md`, issue #13

### Iteration 2026-10-21 13:22 UTC

- Context: Second agent pass on Phase 3 (#13) — corroborate fail without inventing pass.
- Target: Same gate check; enrich `13-phase-3-verify.md` if new evidence.
- Actions log: `app:reload` + `tts-sync`; Cookie GET comments → `[]`; note extra `vault-comments-ahead` at 13:18; sync often stalls after vaultReconcile (no new perf line).
- Validation: Comments still empty; body `new`; version **2.0.73**; issues left open.
- Problems: Gate still **fail**; POST path / stall after reconcile — open.
- To Be Done: New hypothesis before version bump; keep #12–#14 open.
- References: `docs/pilot/results/PILOT-GATE-TEST-11-12/13-phase-3-verify.md`, `CHANGELOG.md`, issue #13

### Iteration 2026-10-21 13:12 UTC

- Context: Phase 3 (#13) after **2.0.73** deploy — agent must reload/sync without asking the human.
- Target: Verify `test-11-12` Comments on TickTick; record pass/fail with evidence.
- Actions log: `obsidian plugin:reload` + `command id=tickticksync-abyss:tts-sync`; probe `getTaskComments` via eval; write `13-phase-3-verify.md`; update INDEX, `ABYSS_FIRST_CASES`, `TEST_PLAN`.
- Validation: Loaded **2.0.73**; write-trace `vault-comments-ahead`; TT Comments **empty** (n=0); task `content`=`new`.
- Problems: Gate **fail** — comments not pushed; `syncRunning` can stick true after reload — open.
- To Be Done: New hypothesis (stale maps / empty `vaultOnly`) before next bump; do not close #12–#14.
- References: `docs/pilot/results/PILOT-GATE-TEST-11-12/13-phase-3-verify.md`, `CHANGELOG.md`, issue #13

### Iteration 2026-10-21 12:58 UTC

- Context: PILOT-GATE-TEST-11-12 Phase 2 (#12) — hypothesis said no-op vault-ahead push must not report `in-sync`.
- Target: **BUG-COMMENT-RECONCILE-UPDATE** — keep `vault-comments-ahead` when `vaultWantsPush && !pushed`; ship **2.0.73** to pilot; evidence file for #12.
- Actions log: Verified coordinator + remoteOnly `changed` guard; strengthened `vaultCommentBehind` expect; bump **2.0.73**; deploy `dist/` to pilot plugin folder; write `12-phase-2-fix.md` + INDEX; update `TEST_PLAN.md` row (pilot still **not run**).
- Validation: `npx vitest run` → **677 passed** (95 files); `npm run build` ok; pilot `manifest.json` = **2.0.73**.
- Problems: Live vault Phase 3 (#13) not run — open.
- To Be Done: Human Phase 3 — reload Obsidian, Synchronize, confirm TT Comments on `test-11-12`.
- References: `docs/pilot/results/PILOT-GATE-TEST-11-12/12-phase-2-fix.md`, `CHANGELOG.md`, issue #12

### Iteration 2026-10-21 12:55 UTC

- Context: Need GitHub trackers for next P0/P1 work after comment gate #14 without dumping every BUG-*.
- Target: Sibling epic for shipped-but-unverified editor/safety pilots + Active Zone bug + Step 7 AF soak (blocked).
- Actions log: Created tt-sync #15–#20; templates `docs/github-issues/10–13`, `15`, `20` + `INDEX.md`; plan `docs/pilot/PILOT-BATCH-EDITOR-SAFETY.md`; commented sibling link on #14.
- Validation: `gh issue list -R semyon-alekseev-noveo/tt-sync --state open` shows #10–#20; no code/vitest this iteration.
- Problems: Pilot results for #15–#18 not started; #20 blocked by #14+#15 — open.
- To Be Done: Finish #14 Phase 2–3; then #16–#18 evidence under `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/`.
- References: `docs/github-issues/INDEX.md`, `CHANGELOG.md`, issues #15–#20

### Iteration 2026-10-21 12:48 UTC

- Context: Pilot results workflow should be a Cursor project rule, not only buried in docs.
- Target: Agents always see handoff rules via `.cursor/rules/`.
- Actions log: Added `.cursor/rules/pilot-results.mdc`; pointer from `dev-flow.mdc`, `AGENTS.md`; trimmed workflow duplicate from `docs/pilot/results/README.md`.
- Validation: Docs only.
- References: `.cursor/rules/pilot-results.mdc`, `CHANGELOG.md`

### Iteration 2026-10-21 12:40 UTC

- Context: Need git archive for pilot phase results so agents chain evidence without relying on issue comments.
- Target: `docs/pilot/results/` convention + migrate PILOT-GATE Phase 0–1 from GitHub comments.
- Actions log: Added `docs/pilot/results/README.md`, `PILOT-GATE-TEST-11-12/INDEX.md`, `10-phase-0-baseline.md`, `11-phase-1-hypothesis.md`; linked from `docs/pilot/PILOT-GATE-TEST-11-12.md` and issue templates.
- Validation: Docs only.
- References: `docs/pilot/results/README.md`, `CHANGELOG.md`

### Iteration 2026-10-21 12:20 UTC

- Context: Repeated pilot fixes without a closed gate; user asked for a documented plan and GitHub checklists per `DEV_FLOW.md`.
- Target: **PILOT-GATE-TEST-11-12** — freeze scope to one task; phases 0–3; no further code until Phase 0 evidence on deployed build.
- Actions log: Added `docs/pilot/PILOT-GATE-TEST-11-12.md`; GitHub issue bodies `docs/github-issues/00–04`; case + results row in `ABYSS_FIRST_CASES.md`; `PO_STATUS.md` P0 row.
- Validation: Docs only; no code or vitest run this iteration.
- Problems: Pilot gate still **not run**; `gh` not on agent PATH — issues created manually from markdown files.
- References: `DEV_FLOW.md`, `docs/pilot/PILOT-GATE-TEST-11-12.md`, `CHANGELOG.md`

### Iteration 2026-10-21 11:55 UTC

- Context: Pilot **test-11-12** still empty after **2.0.71**; trace showed `vault-comments-ahead` without TT rows, then `in-sync` with open note.
- Target: **BUG-COMMENT-DISK-READ** — reconcile reads comment bullets from disk; push on every `vaultAhead` (no `vaultHasUnpushed` gate); map-only upsert must not count as push success.
- Actions log: `vaultLineBehindTask` uses `syncRead`; `vaultHasUnpushed` single-thread vault-origin/unmapped fix; `abyssCommentSync` remoteOnly `changed` guard. Bump **2.0.72**; pilot plugin refreshed.
- Validation: `npx vitest run` → **677 passed**; `npm run build` ok.
- Problems: Pilot **test-11-12** — **not run** until **2.0.72** reload + **Synchronize**.
- References: `src/services/VaultSyncCoordinator.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 11:18 UTC

- Context: Pilot **2.0.70** on `test-11-12` (`6ad83bc…`): vault has `comment 1` + `test-new-verision`; TT Comments empty after reload/sync; `write-trace` flipped from `vault-comments-ahead` to `behindComments` (11:11 UTC).
- Target: **BUG-COMMENT-RECONCILE-UPDATE** — vault-ahead must not open TT→Obs pull when vault still needs push (failed POST or stale maps); only TT-delete-pending uses `behindComments` when `vaultHasUnpushedCommentThreads` is false.
- Actions log: `VaultSyncCoordinator` tracks `vaultWantsPush`; `behindComments` on vault-ahead only when not pushing; warn when push returns no changes. Test `vaultCommentBehind` pilot stale-map fixture. Bump **2.0.71**; pilot plugin folder refreshed.
- Validation: `npx vitest run` → **677 passed**; `npm run build` ok; MCP `add_comment` on task succeeds (API healthy).
- Problems: Pilot **test-11-12** — **not run** until **2.0.71** reload + **Synchronize**; remove stray `mcp-probe-comment` on task if present.
- To Be Done: MCP `get_comment` after pilot sync; GitHub issues for bug + fix checklist (gh unavailable in agent shell).
- References: `src/services/VaultSyncCoordinator.ts`, `src/test/vaultCommentBehind.test.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 10:58 UTC

- Context: Pilot **2.0.69** on `test-11-12` (`6ad83bc…`): vault has `comment 1` + `test-new-verision`; TT Comments empty; `write-trace` showed `vault-comments-ahead` without MCP comments.
- Target: **BUG-COMMENT-RECONCILE-UPDATE** — comment reconcile must run when `commentCount` disagrees with vault threads; must not treat count mismatch as vault-cleared wipe; honor vault-origin stale maps; accept numeric POST `/comment` ids.
- Actions log: `VaultSyncCoordinator` `commentsNeedSync` includes `commentCountMismatch`; `pushedVaultComments` only when `syncAbyssCommentsToTickTick` returns true; `vaultHasUnpushedCommentThreads` when count > 0 and GET empty; `parseTaskCommentFromApiResponse` coerces numeric ids. Bump **2.0.70**.
- Validation: `npx vitest run` → **676 passed**; `npm run build` ok; pilot plugin folder refreshed from `dist/`.
- Problems: Pilot **test-11-12** — **not run** until **2.0.70** reload + **Synchronize**.
- To Be Done: Remove stray MCP probe comment on task if present; confirm TT Comments via MCP.
- References: `src/services/VaultSyncCoordinator.ts`, `src/sync/comments/match.ts`, `src/api/index.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 08:40 UTC

- Context: Pilot **2.0.68**: `task-11-16` gained TT Comments; `test-11-12` (`6ad83bc…`) vault bullets stayed empty on TT after **Synchronize**.
- Target: **BUG-COMMENT-RECONCILE-UPDATE** — reconcile must not skip comment push when task is already `hasChanged`; stale vault-origin maps must re-push after failed POST.
- Actions log: `VaultSyncCoordinator` calls `vaultLineBehindTask` for `update` and `none`; `vaultHasUnpushedCommentThreads` honors `origin: vault` on single stale map. Bump **2.0.69**.
- Validation: `npx vitest run` → **671 passed**; `npm run build` ok.
- Problems: Pilot **test-11-12** — **not run** until **2.0.69** deploy.
- To Be Done: Reload plugin; sync `2026-10-21.md`; MCP Comments on `6ad83bc…`.
- References: `src/services/VaultSyncCoordinator.ts`, `src/sync/comments/match.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 08:25 UTC

- Context: Pilot **2.0.67** still left TT Comments on `task-11-16` and did not push `test-11-12` after vault edits; wipe only ran on hash change and reconcile re-pulled as `behindComments`.
- Target: **BUG-COMMENT-VAULT-WIPE** (complete) — empty vault + vault-origin Dexie maps must delete all TT comments without hash change; coordinator must wipe even when notes field is `behind`.
- Actions log: `TaskCommentMap.origin`; `vaultHadSyncedCommentBullets`; coordinator `vaultClearedAllComments` path; detector comment sync on zero threads when hash matches; drop `!behind` guard for comment probe. Bump **2.0.68**.
- Validation: `npx vitest run` → **671 passed** (incl. test-11-12 `vaultCommentBehind`); `npm run build` ok; pilot plugin folder refreshed from `dist/`.
- Problems: Pilot **BUG-COMMENT-VAULT-WIPE** / **BUG-COMMENT-VAULT-AHEAD** on `test-11-12` — **not run** until Obsidian reload + manual **Synchronize**.
- To Be Done: Tag **2.0.68**; pilot sync `2026-10-19.md` and `2026-10-21.md`.
- References: `src/abyssCommentSync.ts`, `src/services/VaultSyncCoordinator.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 08:08 UTC

- Context: Pilot `task-11-16`: user removed all comment bullets in Obsidian (only `- > коммент 6` left); **Synchronize** did not remove TickTick Comments (five rows remained).
- Target: **BUG-COMMENT-VAULT-WIPE** — vault removal of all comment bullets must delete TT Comments when line hash changes and Dexie maps exist.
- Actions log: `obsidianRemovedCommentBullets` option on `syncAbyssCommentsToTickTick`; detector passes it when hash changes and vault has zero comment threads. Bump **2.0.67**.
- Validation: `npx vitest run` → **667 passed**; `npm run build` ok.
- Problems: Deleting **one** of several comment bullets while TT has extra comments may still need a follow-up (TT-ahead delete guard).
- To Be Done: Tag **2.0.67**; pilot re-sync `2026-10-19.md`.
- References: `src/abyssCommentSync.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 07:59 UTC

- Context: Pilot after **2.0.65**: `task-11-16` comments partly in TT but Obsidian showed `14:46: 2026-10-21T12:09:07+07:00: comment 2` duplicates; `2026-10-21.md` / `test-11-12` vault `коммент 1` not in TT.
- Target: **BUG-COMMENT-PULL-DOUBLE-STAMP** — pull must not stack vault stamp on ISO text already in API `title`.
- Actions log: `formatApiCommentAsAbyssLines` uses `commentBodyWithoutStamp` before `createdTime` stamp; test added. Bump **2.0.66**.
- Validation: `npx vitest run` → **666 passed**; `npm run build` ok.
- Problems: `коммент 1` on `6ad83bc…` — **open** until post-**2.0.66** manual sync; `- > коммент 6` is description not Comments API.
- To Be Done: Tag **2.0.66**; pilot sync both notes.
- References: `src/abyssCommentSync.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 07:50 UTC

- Context: Pilot **2.0.64**: manual sync logged **27** `addTaskComment` HTTP calls but `task-11-16` still had only two TickTick Comments; vault had `comment 2`–`comment 5`.
- Target: **BUG-COMMENT-PUSH-NO-ID** — comments must actually land in TickTick after push.
- Actions log: Parse POST `/comment` responses (`ok`/`result`/`data`); push plain comment text (no ISO stamp in TT title); `vaultHasUnpushedCommentThreads` when several stale maps + TT still has other comments; refresh remote before delete phase in `syncAbyssCommentsToTickTick`. Bump **2.0.65**.
- Validation: `npx vitest run` → **665 passed**; `npm run build` ok.
- Problems: Pilot **BUG-COMMENT-PUSH-NO-ID** — **not run** (deploy **2.0.65**, sync `2026-10-19.md`).
- To Be Done: Tag **2.0.65**; verify MCP `get_comment` on `6ad83d…`.
- References: `src/api/index.ts`, `src/sync/comments/match.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 07:06 UTC

- Context: Pilot on **2.0.63**: TickTick comments pulled into Obsidian, but vault `comment 2` / `comment 3` did not reach TickTick after **Synchronize**.
- Target: **BUG-COMMENT-BOTH-WAYS** — reconcile must push vault-ahead threads before (or alongside) TT-ahead pull, not TT-ahead-only `behindComments`.
- Actions log: `VaultSyncCoordinator.vaultLineBehindTask` — push when `vaultAhead`, then still set `behindComments` when `remoteAhead`; test in `vaultCommentBehind.test.ts`. Bump **2.0.64**.
- Validation: `npx vitest run` → **659 passed**; `npm run build` ok.
- Problems: Pilot **BUG-COMMENT-BOTH-WAYS** — **not run** (deploy **2.0.64** to pilot, reload, sync `2026-10-19.md`).
- To Be Done: Tag **2.0.64**; pilot verify MCP Comments include `comment 2` and `comment 3`.
- References: `src/services/VaultSyncCoordinator.ts`, `ABYSS_FIRST_CASES.md`, `CHANGELOG.md`

### Iteration 2026-10-21 06:42 UTC

- Context: Pilot on **2.0.62**: Abyss comment did not reach TT; second comment created in TickTick disappeared after **Synchronize**.
- Target: Release **2.0.63** — **BUG-COMMENT-TT-AHEAD-NO-DELETE** plus shipped **2.0.61**/**2.0.62** comment fixes.
- Actions log: Push must not `deleteTaskComment` for TT-ahead keys (`remoteCommentKeysAheadOfVault`) because push runs before pull; **BUG-COMMENT-STALE-MAPS**, **BUG-COMMENT-NO-MASS-DELETE**, coordinator comment probe. Tests **658**; pilot MCP both TT comments after sync on **2.0.63**.
- Validation: `npx vitest run` → **658 passed**; `npm run build` ok; pilot `6ad83d…` kept `comment 1` + `pilot-tt-second-comment` after manual sync.
- Problems: Vault→TT push for new Abyss-only lines — still verify in UI after **2.0.63** BRAT install.
- To Be Done: Tag **2.0.63**; PR into `abyss-mapping`.
- References: `src/abyssCommentSync.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 06:20 UTC

- Context: Pilot **Thinkpad-tts-test** `00 Inbox/2026-10-19.md` / `task-11-16`; agent ran Obsidian + **Synchronize**; MCP `get_comment` stayed empty while vault had Abyss bullets.
- Target: **BUG-COMMENT-STALE-MAPS** — push after mass TT wipe with stale Dexie maps; keep **TP-COMMENT-TT-DELETE** when TT still has other comments.
- Actions log: Rework `vaultHasUnpushedCommentThreads`; allow comment probe/push when mass-delete guard is `skip` but vault is ahead on keys; pilot line + deploy **2.0.62**. Automated **657** tests.
- Validation: `npx vitest run` → **657 passed**; pilot: `write-trace` `vault-comments-ahead` on `2026-10-19.md` (manual sync 06:17 UTC); MCP still showed only probe comment — plugin `addTaskComment` from Obsidian not confirmed in this run.
- Problems: Pilot **BUG-COMMENT-STALE-MAPS** — **partial** (reconcile push path fires; TT Comments panel not fully verified).
- To Be Done: User re-test from Abyss UI + **Synchronize** on **2.0.62**; tag release.
- References: `src/sync/comments/match.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 05:52 UTC

- Context: Pilot after **2.0.60**: add Abyss comment on `2026-10-19.md` / `task-11-16`, **Synchronize** → all TickTick Comments deleted.
- Target: Hotfix **2.0.61** — **BUG-COMMENT-NO-MASS-DELETE** on push path.
- Actions log: `syncAbyssCommentsToTickTick` uses `plan.mapWithoutVault` + vault key set; skip TT deletes when `getTaskComments` returns `[]`; regression tests in `abyssCommentSync.test.ts`. Case in `ABYSS_FIRST_CASES.md`, `TEST_PLAN.md`. Bump **2.0.61**.
- Validation: `npx vitest run` → **655 passed**; `npm run build` ok.
- Problems: Pilot **BUG-COMMENT-NO-MASS-DELETE** — **not run** (pending BRAT **2.0.61**).
- To Be Done: Tag **2.0.61**; pilot re-sync `2026-10-19.md`.
- References: `src/abyssCommentSync.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 05:38 UTC

- Context: CI failed **TP-COMMENT-TT-DELETE** after **2.0.59** `vault-comments-ahead` push treated mapped TT-deleted threads as unpushed vault edits.
- Target: Hotfix **2.0.60** on `abyss-mapping`.
- Actions log: `vaultHasUnpushedCommentThreads` — push only when vault comment bullets are not mapped deletions with `commentCount === 0`; else `behindComments` pull for merge strip. Bump **2.0.60**.
- Validation: `npx vitest run` → **653 passed**; `npm run build` ok.
- Problems: — 
- To Be Done: Tag **2.0.60**; BRAT on pilot.
- References: `commentSyncMatch.test.ts`, `CHANGELOG.md`

### Iteration 2026-10-21 05:30 UTC

- Context: Pilot `task-11-16` on `00 Inbox/2026-10-19.md` (ISO Abyss comment bullets, TT Comments empty); owner asked for push and release **2.0.59**.
- Target: Tag **2.0.59** on `abyss-mapping`.
- Actions log: **BUG-COMMENT-VAULT-AHEAD** — `VaultSyncCoordinator` pushes when vault has comment threads and TT API does not (no false `behindComments` pull). **BUG-COMMENT-MERGE-NO-STRIP** — empty Comments API without `commentCount: 0` does not drop vault bullets on merge. **BUG-COMMENT-MANUAL-PRE-PULL** — manual sync pre-pull walks all in-scope registered notes. Bump to **2.0.59**; `PO_STATUS.md`.
- Validation: `npx vitest run` → **93** files, **652 passed**; `npm run build` ok.
- Problems: Pilot NOTE-L3b / **BUG-COMMENT-VAULT-AHEAD** on Thinkpad after install — **not run** (pending BRAT **2.0.59**).
- To Be Done: BRAT **2.0.59**; re-sync `2026-10-19.md` and confirm TT Comments for `6ad83d003e30f4429d749e0a`.
- References: `ABYSS_FIRST_CASES.md`, `TEST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-21 05:05 UTC

- Context: PR #9 merged into `abyss-mapping`; owner asked for release **2.0.58**.
- Target: Tag **2.0.58** on `abyss-mapping`.
- Actions log: Bump `package.json`, `manifest.json`, `versions.json` to **2.0.58**; `PO_STATUS.md` install baseline. Ships PR #9: normalized comment keys (`planCommentSync`, **BUG-COMMENT-KEY-EQUIV**), no TT comment wipe when vault has no bullets (**BUG-COMMENT-NO-TT-WIPE**), active note in pre-pull push (**BUG-COMMENT-ACTIVE-NOTE**), `SyncRunContext` / `preparePhase` scaffold.
- Validation: `npx vitest run` → **93** files, **649 passed**; `npm run build` ok.
- Problems: Pilot **NOTE-L3b** / comment cases in `TEST_PLAN.md` — **not run**.
- To Be Done: `git push tt-sync 2.0.58`; BRAT **2.0.58** on Thinkpad-tts-test; pilot comment soak.
- References: `docs/COMMENT_SYNC_MODEL.md`, `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-21 04:55 UTC

- Context: Owner said go on PR B — wire comment sync model to push/pull equivalence checks.
- Target: Branch `feat/comment-sync-wire` — **BUG-COMMENT-KEY-EQUIV** + modular scaffold + pilot comment fixes (merged as PR #9).
- Actions log: Wire `apiCommentsDifferFromVault` and `syncAbyssCommentsToTickTick` to `planCommentSync` / `normalizedCommentKey`; `mergeAbyssBlock` TT-delete hints use normalized keys; `src/sync/comments/*`, `SyncRunContext`, `preparePhase`, `pushLocalPaths`.
- Validation: `npx vitest run` → **93** files, **649 passed**; `npm run build` ok.
- Problems: Pilot **NOTE-L3b** / **BUG-COMMENT-KEY-EQUIV** not run on Thinkpad-tts-test.
- To Be Done: Release **2.0.58** (done in 05:05 iteration).
- References: `docs/COMMENT_SYNC_MODEL.md`, `TEST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-21 04:45 UTC

- Context: Owner asked for comment match model (Abyss stamp vs TickTick plain title) and failing tests before wiring push/pull.
- Target: `src/sync/comments/` + `docs/COMMENT_SYNC_MODEL.md`; no full wire to `apiCommentsDifferFromVault` yet.
- Actions log: `normalizedCommentKey`, `planCommentSync`, `commentSetsEquivalentByNormalizedKey`; tests `commentSyncKeys`, `commentSyncMatch`, `commentSyncModel` (`it.fails` wire test). Case **BUG-COMMENT-KEY-EQUIV**. Prior local fixes: **BUG-COMMENT-NO-TT-WIPE**, **BUG-COMMENT-ACTIVE-NOTE**, `preparePhase`, `pushLocalPaths`.
- Validation: `npx vitest run` → **648 passed**, **1 expected fail** (`commentSyncModel.test.ts` wire gap).
- Problems: Push/pull still use legacy fingerprints in places; pilot comments not re-validated.
- To Be Done: Wire `apiCommentsDifferFromVault` + `syncAbyssCommentsToTickTick` to `planCommentSync`; release **2.0.58**; continue sync phase extract.
- References: `docs/COMMENT_SYNC_MODEL.md`, `docs/SYNC_MODULARIZATION.md`, `CHANGELOG.md`

### Iteration 2026-10-21 04:10 UTC

- Context: Owner asked for modular sync plan after comparing with obsidian-todoist-plugin; reduce `TickTickService` god-object risk (`TECH-CIRC-1`).
- Target: Phase 0 scaffolding only — no behavior change to sync phases.
- Actions log: `src/sync/SyncRunContext.ts`; `src/sync/phases/types.ts` stub; `docs/SYNC_MODULARIZATION.md` (module map, PR 1 file list); `synchronizationInner` uses `createSyncRunContext` for pending-marker reconcile + debug `syncId`. `syncRunContext.test.ts`. `PROJECT_STATE.md` updated.
- Validation: `npx vitest run` → 89 files, **637 passed**; `npm run build` ok.
- Problems: Phase 1 extract not started; `guardedPull` / `locallyEdited` still on `TickTickService`.
- To Be Done: PR 1 per `docs/SYNC_MODULARIZATION.md`.
- References: `docs/SYNC_MODULARIZATION.md`, `PROJECT_STATE.md`, `CHANGELOG.md`

### Iteration 2026-10-21 03:58 UTC

- Context: Pilot repro **BUG-DEFERRED-ID-PHASE2-DELETE** on Thinkpad-tts-test (`00 Inbox/2026-10-21.md`, `test-10-35`) on **2.0.56**: TickTick task created while `%%[ticktick_id:: …]%%` deferred (caret on line) → false Phase 2 deletion prompt.
- Target: Release **2.0.57** on branch `feat/bug-deferred-id-phase2-delete`.
- Actions log: `pendingMarkerTaskIds` registry; `registerPendingMarkerTaskId` when marker write defers; `TaskDeletionHandler.processSyncRemovedTasks` skips pending ids; `prunePendingMarkerTaskIds` at sync start via `idsPresentInVault`. Regression `pendingMarkerDeletion.test.ts`. Docs in `ABYSS_FIRST_CASES.md`, `TEST_PLAN.md`, `PO_STATUS.md`. Bump `manifest.json`, `package.json`, `versions.json` to **2.0.57**.
- Validation: `npx vitest run` → 88 files, **635 passed**; `npm run build` ok.
- Problems: Pilot **BUG-DEFERRED-ID-PHASE2-DELETE** in `TEST_PLAN.md` is **not run**.
- To Be Done: PR into `abyss-mapping`; owner tags **2.0.57** after merge; pilot case on Thinkpad-tts-test.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-21 03:32 UTC

- Context: Owner asked for release **2.0.56** after **TP-EMPTY-EDITOR-DISK** on `feat/tp-empty-editor-disk`.
- Target: Tag **2.0.56**.
- Actions log: Merged `feat/tp-empty-editor-disk` into `abyss-mapping`. **2.0.56** ships empty-editor repair (`repairEmptyEditorFromDisk`, disk fallback in `readNoteForWrite`, `syncDiskToMatchEditor` after open patch); `PO_STATUS.md` install baseline.
- Validation: `npx vitest run` → 87 files, **634 passed**; `npm run build` ok.
- Problems: Pilot **TP-EMPTY-EDITOR-DISK** in `TEST_PLAN.md` is **not run**.
- To Be Done: BRAT **2.0.56**; pilot empty-editor case on Thinkpad-tts-test.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-21 03:25 UTC

- Context: Pilot repro **BUG-EMPTY-EDITOR-DISK** on Thinkpad-tts-test (`00 Inbox/2026-10-20.md`): disk had text, markdown view empty after reopen on **2.0.55**.
- Target: **TP-EMPTY-EDITOR-DISK** / release **2.0.56** on branch `feat/tp-empty-editor-disk`.
- Actions log: `repairEmptyEditorFromDisk` on file-open and active-leaf focus; `readNoteForWrite` disk fallback when buffer empty; `syncDiskToMatchEditor` after open-note patch; `identifiedOnly` documented as **TP-NEW-TASK-NOT-5S**. Docs in `ABYSS_FIRST_CASES.md`, `TEST_PLAN.md`, `PO_STATUS.md`.
- Validation: `npx vitest run` → 87 files, **634 passed**; `npm run build` ok. Copied `dist/main.js` (+ manifest) to Thinkpad-tts-test plugin folder.
- Problems: Pilot **TP-EMPTY-EDITOR-DISK** row still **not run** after install.
- To Be Done: Manual pilot on Thinkpad-tts-test; PR into `abyss-mapping`.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-21 02:50 UTC

- Context: Owner merged PR #6 (open note buffer rollback on 2.0.54) and asked for release **2.0.55**.
- Target: Tag **2.0.55**.
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.55**; `PO_STATUS.md` install baseline. **2.0.55** ships PR #6: `lastVaultSync` after vault save, cursor/selection defer spans, `syncRead` / `syncCachedRead`, local Abyss child keep in `mergeAbyssBlock`, optional `debugWriteTrace`, and related tests in `TEST_PLAN.md`.
- Validation: `npx vitest run` → 87 files, **631 passed**; `npm run build` ok.
- Problems: Pilot rows for **BUG-OPEN-NOTE-BUFFER** and prior **2.0.54** hotfix cases in `TEST_PLAN.md` are **not run**.
- To Be Done: BRAT **2.0.55**; pilot open-note-buffer and hotfix sections.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 15:20 UTC

- Context: On 2.0.54 the open note's editor buffer rolled back while the file on disk stayed current. It did not happen on 2.0.47. `commitVaultText` (PR #4) did not stop it.
- Target: No version bump. A local edit on the open line is pushed, not overwritten. The 5-second push is rescheduled when a sync is running. Obsidian's own `vault.read` is not replaced during a sync.
- Actions log: After a vault→TickTick save, `lastVaultSync` matches `updatedAt`. `vaultLineBehindTask` treats a hash mismatch as a local edit. A span that covers the cursor or selection is deferred while that editor has focus; the 2-second typing window still defers the whole file. One editor is patched per file. Notes large enough to skip the line diff use a prefix/suffix span while an editor is open. `lastVaultPushWallMs` is taken before the deletion-guard prefetch (that prefetch is `getUpdatedTasks`), and this run still compares files to the previous stamp. Plugin writes are excluded by path and mtime, only when the write moved the mtime. `app.vault.read` / `cachedRead` are not swapped; plugin code uses `syncRead` / `syncCachedRead` and does not cache a file open in an editor. `mergeAbyssBlock` keeps an unpushed local description or comment and does not put the old TickTick comment back beside it. The merge write-back in the 5-second push is skipped when the note changed after the push started. Setting `debugWriteTrace` (default off) logs each write and update decision to the console (`warn`, prefix `[write-trace]`) and to `<vault>/.tickticksync/write-trace.jsonl`. Reload the plugin after turning it on so the view-reload check is installed. Enable it in Settings → Write trace.
- Validation: `npx vitest run` → 87 files, **631 passed**; `npm run build` ok. The five new cases failed before the fix and pass now. Pilot rows in `TEST_PLAN.md` are **not run** (vault Thinkpad-tts-test).
- Problems: Pilot not run. A task with no `lineHash` still uses the field compare. An editor patch does not move disk mtime; a later autosave can look like a user edit. The second leaf is not patched. The `setViewData` check needs a reload.
- To Be Done: Pilot the new section. Do not tag from this branch.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `PO_STATUS.md`

### Iteration 2026-10-20 14:15 UTC

- Context: Owner merged PR #4 (stale editor write hotfix) and PR #5 (mass-deletion guard) and asked for release **2.0.54**.
- Target: Tag **2.0.54**.
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.54**; `PO_STATUS.md` install baseline. **2.0.54** ships open-note writes through `commitVaultText`, redo journal patches for editor transactions, and mass-deletion / empty-side guard (`massDeleteGuard.ts`, settings, manual modal).
- Validation: `npx vitest run` → 85 files, **625 passed**; `npm run build` ok.
- Problems: Pilot hotfix rows and `TP-EMPTY-SIDE-GUARD` in `TEST_PLAN.md` are **not run**.
- To Be Done: BRAT **2.0.54**; pilot hotfix and deletion-guard cases.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 13:50 UTC

- Context: Owner asked to record open-editor line patches in the redo journal.
- Target: `commitVaultText` writes a journal entry before an `editor.transaction` and before a re-applied span, with the buffer from before and after. Undo restores that patch with the note open or closed. A patch that does not land is not committed.
- Actions log: `setNoteJournal` from `instrumentVault`. `makeEnv.read` uses the open editor. Cases **TP-JOURNAL-EDITOR-PATCH** and **TP-UNDO-EDITOR-PATCH** in `TEST_PLAN.md` (not run on a vault).
- Validation: `npx vitest run` → 84 files, **613 passed**; `npm run build` — this iteration. `noWholeNoteWrite.test.ts` still passes.
- Problems: Pilot **TP-JOURNAL-EDITOR-PATCH** and **TP-UNDO-EDITOR-PATCH** are not run. If the file changes again after the re-applied span was journaled, that record stays uncommitted and the note is not written.
- To Be Done: Pilot the two new rows.
- References: `src/services/vaultWrite.ts`, `src/redo/obsidian.ts`, `src/test/journalEditorPatch.test.ts`, `TEST_PLAN.md`

### Iteration 2026-10-20 11:40 UTC

- Context: Owner extended the stale-editor hotfix. `completeTaskInTheFile` and `uncompleteTaskInTheFile` still wrote the whole note with `vault.modify`.
- Target: Every note that may be open goes through `commitVaultText`. No version bump.
- Actions log: Checkbox complete and uncomplete, tag and link stamps, recurring roll, detach, duplicate-id strip, subtask reorder, tag rename, project-note repair, folder merge, `forceUpdates`, and undo restore/remap use the helper. `TEST_PLAN.md` adds **TP-COMPLETE-DURING-TYPE** and **TP-UNCOMPLETE-DURING-TYPE** (not run). A source scan refuses `vault.modify`, `vault.process`, `adapter.write`, and `editor.setValue` outside the helper.
- Validation: `npx vitest run` → 83 files, **607 passed**; `npm run build` — this iteration. Pilot rows stay **not run**.
- Problems: Journal jsonl (`.tickticksync/journal`) and CSV backups are new files, not open notes. Pilot rows stay **not run**.
- To Be Done: Pilot **TP-COMPLETE-DURING-TYPE** and **TP-UNCOMPLETE-DURING-TYPE**.
- References: `TEST_PLAN.md`, `src/services/vaultWrite.ts`, `src/test/noWholeNoteWrite.test.ts`

### Iteration 2026-10-20 11:10 UTC

- Context: Open note editor was cleared or reverted while the file on disk stayed current (`BUG-STALE-EDITOR-WRITE`). A comment deleted in TickTick stayed in the note, so the stale write ran on every sync.
- Target: No version bump. Network work finishes before the write snapshot. An open note is patched on matching task lines. A quiet second sync writes nothing.
- Actions log: `commitVaultText` refuses a stale `vault.process` and uses `editor.transaction` on open files. `readFileContent` checks `activeEditor.file`. `mergeAbyssBlock` drops comments present in the previous `taskCommentMaps` and absent from the Comments API. The 5-second push skips the comment sweep. `lastVaultPushWallMs` is set after vault writes. Cases in `ABYSS_FIRST_CASES.md`. `TEST_PLAN.md` hotfix section, the missing **2.0.52** section, and **After §3.5** items 1–2 marked done in **2.0.53**.
- Validation: `npx vitest run` → 81 files, **600 passed**; `npm run build` — this iteration. Pilot rows in the hotfix section are **not run**.
- Problems: `TP-EDITOR-*`, `TP-COMMENT-TT-DELETE`, and `TP-NO-SELF-REPUSH` are not run on the pilot. `TP-DELTA-*` are still not run, while `skipPushWhenTickTickRenamedVaultLine` stays off.
- To Be Done: Owner merges. Pilot the hotfix section. Do not tag from this branch.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `ABYSS_FIRST_CASES.md`

### Iteration 2026-10-20 09:10 UTC

- Context: Owner asked to release the idle-sync change.
- Target: Tag **2.0.53**.
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.53**; `PO_STATUS.md` install baseline.
- Validation: `npx vitest run` → **589 passed**; `npm run build` ok.
- Problems: `TP-IDLE-ZERO` and `TP-DELTA-*` not run on the pilot. Daily reconcile, closed, and trash are not in this tag.
- To Be Done: BRAT **2.0.53**; read one `[perf]` line on a quiet Synchronize.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 09:05 UTC

- Context: Owner asked to implement `docs/TICKTICK_DELTA_API.md` §3. §3.5 is still not run; defaults from §3.2 are in code.
- Target: Idle sync does not call `getTaskById` per quiet task. Echo uses `etag`.
- Actions log: `pull.ts` skips a row only when etags match. `vaultLineBehindTask` reads Dexie; `getTaskComments` only if `commentCount` ≠ vault threads. `skipPushWhenTickTickRenamedVaultLine` no longer fetches the task. Tests `TP-IDLE-ZERO`, `TP-ECHO-ETAG`.
- Validation: `npx vitest run` → **589 passed**; `npm run build` ok.
- Problems: Closed/trash endpoints and the daily job are not implemented. `updateTask` still refetches the task after a push. §3.5 rows stay **not run**.
- To Be Done: Run `TP-DELTA-*`, then daily reconcile if the pilot requires it.
- References: `docs/TICKTICK_DELTA_API.md`, `TEST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-20 08:40 UTC

- Context: Owner asked to release the comment round-trip fix after the **2.0.51** pilot fail.
- Target: Tag **2.0.52**.
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.52**; `PO_STATUS.md` install baseline.
- Validation: `npx vitest run` → 80 files, **587 passed**; `npm run build` — this iteration.
- Problems: NOTE-L3b not re-run on **2.0.52**.
- To Be Done: BRAT **2.0.52**; NOTE-L3b on the pilot.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 08:35 UTC

- Context: NOTE-L3b on **2.0.51** stripped vault comment bullets on **tt→obs** rewrite while TickTick Comments stayed empty.
- Target: A vault comment thread is the same entity as a TickTick comment: keep it across a line rewrite and push it before that rewrite.
- Actions log: `mergeAbyssBlock` keeps local comments unless they were in a synced `Comments:` block and are absent from the new block. `persistToFile` calls `syncAbyssCommentsToTickTick` before `convertTaskToLine`.
- Validation: `npx vitest run` → 80 files, **587 passed**.
- Problems: Pilot NOTE-L3b not re-run on this build.
- To Be Done: Build and re-run NOTE-L3b on the pilot.
- References: `src/abyssFormat.ts`, `src/fileOperation.ts`, `CHANGELOG.md`

### Iteration 2026-10-20 06:22 UTC

- Context: Owner installed **2.0.51** on pilot; requested tester run per `DEV_FLOW.md`.
- Target: **TP-BUG-COMMENT-NO-PUSH** / **NOTE-L3b** on Thinkpad-tts-test.
- Actions log: Added comment bullets on `gate-comment-249` (`6ad6f43a…`); **Synchronize** via Obsidian CLI (`vault=Thinkpad-tts-test`, `tickticksync-abyss:tts-sync`); MCP `get_comment`; journal `2026-10-20.jsonl`. Updated `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `PO_STATUS.md`.
- Validation: `npx vitest run` → **586 passed** (repo). Pilot NOTE-L3b → **fail**; TP1-CHILD-COMMENT → **fail**; sync completes (journal commits).
- Problems: Vault comment lines removed on **tt→obs** without TT Comments API entries; tag shuffle on `gate-comment-249` (`#note/note-l3b-gate` → `#note/abyss-active`); overlapping `sync-mvgaaegu` / `sync-mvg8smb7` at same second.
- To Be Done: Root-cause why `syncAbyssCommentsToTickTick` / sweep does not run or pull overwrites before map; consider isolated single-task note for next gate.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `CHANGELOG.md`

### Iteration 2026-10-20 06:15 UTC

- Context: Owner merged PR #3 into `abyss-mapping` and requested release **2.0.51**.
- Target: Tag **2.0.51** (BUG-COMMENT-NO-PUSH pre-pull push, delta `add` parsing, delta API research doc).
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.51**; `PO_STATUS.md` install baseline.
- Validation: `npx vitest run` → 80 files, **586 passed**; `npm run build` → ok.
- Problems: NOTE-L3b live gate still **not run** on **2.0.51** build.
- To Be Done: BRAT **2.0.51** on pilot; **TP-BUG-COMMENT-NO-PUSH**; **TP-DELTA-*** per `docs/TICKTICK_DELTA_API.md`.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 06:10 UTC

- Context: Owner shared delta API research (`tt-sync-ticktick-delta-api.md`); canonical copy and small code alignment.
- Target: Preserve research in repo; stop dropping `syncTaskBean.add`; pilot plan for etag/comment policy.
- Actions log: Added `docs/TICKTICK_DELTA_API.md`; `getUpdatedTasks` merges `add` into `update`; `getUpdatedTasks.deltaAdd.test.ts`; `TEST_PLAN.md` TP-DELTA-*; pointers in `PROJECT_STATE.md`, `PO_STATUS.md`, `ANALYST_REFERENCE_DIAGRAMS.md`.
- Validation: `npx vitest run` → 80 files, **586 passed**; `npm run build` ok.
- Problems: etag echo and idle zero-probe remain design-only until TP-DELTA-* pilot.
- To Be Done: Run TP-DELTA-* on pilot; NOTE-L3b with BUG-COMMENT-NO-PUSH build.
- References: `docs/TICKTICK_DELTA_API.md`, `DEV_FLOW.md`, `CHANGELOG.md`

### Iteration 2026-10-20 06:00 UTC

- Context: Owner approved fix path for **BUG-COMMENT-NO-PUSH** per `DEV_FLOW.md`.
- Target: Pre-pull push must run when vault `mtime` > last push wall time even if TickTick checkpoint is newer.
- Actions log: `SyncMeta.lastVaultPushWallMs`; `pushLocalEditsFirst` uses it instead of checkpoint; integration test `BUG-COMMENT-NO-PUSH`.
- Validation: `npx vitest run` → **585 passed** (superseded by 06:10 run, 586 with delta test); `npm run build` ok in same session as 06:10.
- Problems: NOTE-L3b live gate still **not run** on build with this fix.
- To Be Done: Release or pilot copy; NOTE-L3b on `abyss-active.md`; merge via PR.
- References: `DEV_FLOW.md`, `TEST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-20 05:50 UTC

- Context: Owner installed **2.0.50** on pilot; requested TP-PERF performance test.
- Target: Run `TEST_PLAN.md` TP-PERF-* on **Thinkpad-tts-test**.
- Actions log: Obsidian CLI sync with session hooks on `endFull` / `console.info`; quiet-task check on `abyss-active.md` `6ad5bb47…`. Updated `TEST_PLAN.md` perf Results.
- Validation: TP-PERF-UI, TP-PERF-SAME, TP-PERF-R-SYNC-OK → pass; TP-PERF-LOG → partial (JSON line needs DevTools or single long-lived Obsidian session). `npx vitest run` perf tests → 10 passed; bench test → pass.
- Problems: Each `obsidian eval` reloads app package and clears hooks; file append hook did not fire when CLI sync ran without a stable desktop session.
- To Be Done: Sam — one manual `[perf]` JSON screenshot; TP-PERF-ACTIVE + R-FENCE/DUP/MOVE if needed.
- References: `TEST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-20 05:15 UTC

- Context: Owner merged PR #2 into `abyss-mapping` and requested release **2.0.50**.
- Target: Tag **2.0.50** (vault id index, per-sync file cache, `[perf]` sync timings).
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.50**; `PO_STATUS.md` install baseline.
- Validation: `npx vitest run` → 79 files, 584 passed; `npm run build` → ok.
- Problems: NOTE-L3b / BUG-COMMENT-NO-PUSH still open on pilot; TP-PERF-* not run live yet.
- To Be Done: BRAT **2.0.50** on pilot; TP-PERF-* rows in `TEST_PLAN.md`; return to comment push fix.
- References: `TEST_PLAN.md`, `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 04:45 UTC

- Context: Owner requested release **2.0.49**, cleanup pilot test notes/tasks, assess PR #2 merge.
- Target: Tag **2.0.49** (comment sweep + ticktick id leak fixes); remove `manual-test.md` / `tp1-cli-smoke.md` and related TT tasks on pilot vault.
- Actions log: Version **2.0.49**; push tag to `tt-sync`. Deleted pilot notes under `00 Inbox/`; deleted TickTick tasks `6ad6e474…`, `6ad6ea84…`, `6ad6ea86…`, `6ad6d78f…`, `6ad6d915…` on TTS-Inbox project.
- Validation: `npx vitest run` → 75 files, 572 passed; `npm run build` → ok.
- Problems: PR #2 branch **behind** `abyss-mapping` by 3 commits (draft); rebase before merge.
- To Be Done: BRAT **2.0.49** on pilot; re-run NOTE-L3b; rebase/merge PR #2 after owner review.
- References: `PO_STATUS.md`, `CHANGELOG.md`

### Iteration 2026-10-20 04:30 UTC

- Context: PO попросил завести три пункта в `PO_STATUS.md` и продолжить по `DEV_FLOW.md` после ручного пилота 2.0.48.
- Target: Зафиксировать P0/P1 баги; regression tests + mitigations для Comments sweep и loose `ticktick_id`.
- Actions log: `PO_STATUS.md` — BUG-COMMENT-NO-PUSH, BUG-ACTIVEZONE-COMMENT-SHUFFLE, BUG-TICKTICK-ID-LEAK; кейсы в `ABYSS_FIRST_CASES.md`. `TaskModificationDetector.sweepAbyssCommentsInFile`; `taskParser` canonical id + title strip. Tests `bugCommentNoPush.test.ts`, `bugTicktickIdLeak.test.ts`.
- Validation: `npx vitest run` → 75 files, **572 passed**; `npm run build` → ok.
- Problems: BUG-ACTIVEZONE-COMMENT-SHUFFLE open; pilot NOTE-L3b not re-run on new build.
- To Be Done: Deploy build to pilot; NOTE-L3b; repro test for Active Zone shuffle.
- References: `PO_STATUS.md`, `DEV_FLOW.md`, `CHANGELOG.md`

### Iteration 2026-10-20 03:05 UTC

- Context: Owner enabled Obsidian CLI; asked to run `TEST_PLAN.md` on pilot vault **2.0.48**.
- Target: Execute pilot rows where CLI + **Synchronize** + TickTick MCP suffice; record honest pass/fail.
- Actions log: `00 Inbox/tp1-cli-smoke.md`; `obsidian command id=tickticksync-abyss:tts-sync`; journal wait on `.tickticksync/journal/2026-10-20.jsonl`; MCP task/comment checks. Updated `TEST_PLAN.md` Results and `ABYSS_FIRST_CASES.md` gate log.
- Validation: pass — TP1-NEW-ON-SYNC, TP1-CHILD-DESC, TP1-R-SYNC-OK, TP1-R-CHECKPOINT. fail — TP1-CHILD-COMMENT, TP1-R-TITLE, NOTE-L3b (Comments API). not run — debounce/editor/modal/network rows.
- Problems: Comment bullets do not reach TickTick Comments on vault-disk + sync path (open). Title rename via `vault.modify` lost on pull (TP1-R-TITLE). `syncRunning` unreliable after manual clear; journal `commit` lines are the completion signal.
- To Be Done: UI pass for debounce rows; fix or case-id comment push from `pushLocalEditsFirst`; manual AF-5 + DEL-* gate.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `CHANGELOG.md`

### Iteration 2026-10-20 02:40 UTC

- Context: Owner requested release **2.0.48** then pilot tests per `TEST_PLAN.md` / `ABYSS_FIRST_CASES.md`.
- Target: Tag **2.0.48** on merged PR #1 (`fail-closed` pull, debounced open-file push, child-comment push, integration test); run automated gate and deploy build to pilot vault.
- Actions log: Bumped `package.json`, `manifest.json`, `versions.json` to **2.0.48**; `npx vitest run` and `npm run build` on `8f58d9a` + version commit; push tag `2.0.48` to `tt-sync` (GitHub Actions release zip). Copied `dist/*` into `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/`. Stash `pre-PR1-merge WIP` not merged (conflicts); comment-hash sweep deferred.
- Validation: `npx vitest run` → 73 files, **569 passed**; `npm run build` → ok. Manual TP1-* / AF gate: **not run** — Obsidian was not running on the test host (`pgrep` empty); pilot plugin files updated to **2.0.48** for the next Obsidian session.
- Problems: Manual rows remain **not run** until owner opens pilot Obsidian and executes steps (or BRAT pull after release assets publish).
- To Be Done: Run live gate AF-5 → NOTE-L3b → DEL-1 → DEL-3; fill `TEST_PLAN.md` Results; set BRAT frozen version to **2.0.48** after release zip is live.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `DEV_FLOW.md`, `CHANGELOG.md`

### Iteration 2026-10-20 02:25 UTC

- Context: Owner approved merge of cloud PR #1 (`cursor/dev-flow-reliability-816a`) into `abyss-mapping`.
- Target: Land dev flow docs, fail-closed sync, integration test, and analyst reference diagrams without reverting PR #1 PO statuses.
- Actions log: Fast-forward merge to `0a9b805`; added `docs/ANALYST_REFERENCE_DIAGRAMS.md`; linked from `PO_STATUS.md` and `DEV_FLOW.md`. Local pre-merge WIP remains in git stash `pre-PR1-merge WIP` (not applied).
- Validation: `npx vitest run` → 73 files, 569 passed; `npm run build` → ok.
- Problems: Version still **2.0.47** in `manifest.json` until owner tags next release; stash may contain comment-hash sweep to replay in a follow-up branch.
- To Be Done: Push `abyss-mapping`; pilot TP1-* and AF gate (`TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`); optionally cherry-pick stash comment fixes.
- References: `DEV_FLOW.md`, `docs/ANALYST_REFERENCE_DIAGRAMS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 17:24 UTC

- Context: First slice of the large-vault performance review. Do not change sync results. The `getTaskById` / `getTaskComments` probe in `vaultLineBehindTask` stays for a later PR.
- Target: Per-run timings and counters; an id→path index with the same hits as `String.includes`; a per-run cache of file text and `NewFileMap`.
- Actions log: Branch `cursor/sync-perf-index-cache-aa83`, rebased onto `abyss-mapping` after PR #1 and **2.0.49**. No version bump. No tag. No merge.
- Validation: `npx vitest run` → 77 files, 581 passed; `npm run build` → ok. Synthetic vault 2000 notes / 5000 tasks: id scan 555.8 ms → 5.1 ms, file reads 6000 → 4000, reconcile 586.9 ms → 22.3 ms. Idle-sync `getTaskById` baseline stays 3. Live vault and pilot Obsidian were **not** run.
- Problems: RISK-LARGE-VAULT is only partly mitigated. `ensureVaultFilesRegistered` still walks every markdown file, and a quiet task is still probed with `getTaskById`.
- To Be Done: Owner merges PR #2; run TP-PERF-* on `<pilot-vault>`.
- References: `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md` PERF-INDEX, PERF-CACHE, PERF-COUNTERS, `CHANGELOG.md`

### Iteration 2026-10-19 16:55 UTC

- Context: Owner rule — every behavior change is recorded in the test plan, in the same PR.
- Target: `TEST_PLAN.md` for PR #1; the rule in `DEV_FLOW.md`, `AGENTS.md`, `.cursor/rules/dev-flow.mdc`.
- Actions log: Manual cases for the open-note debounce, child comment/description push, fail-closed pull, load notice, comment fingerprints, comment-map cleanup, and the regressions those must not break. Pilot status is **not run**.
- Validation: docs only; `npx vitest run` and `npm run build` re-run on this commit.
- Problems: None in code. Startup sync still runs auto-cleanup after a failed pull; manual and scheduled sync skip it. The test plan says so.
- To Be Done: A person or a local agent runs the TP1-* rows on `<pilot-vault>`.
- References: `TEST_PLAN.md`, `DEV_FLOW.md`

### Iteration 2026-10-19 15:30 UTC

- Context: Owner asked for one development flow and the P1/P2 reliability fixes before another live soak. Version stays **2.0.47** until the owner releases.
- Target: `DEV_FLOW.md`; fail-closed pull; honest notice; parent push on a child comment line; debounced open-file push; API comments in `vaultLineBehindTask`; comment-map cleanup; `synchronizationInner` integration test; docs aligned to the code.
- Actions log: Branch `cursor/dev-flow-reliability-816a`. No tag. No merge.
- Validation: `npx vitest run` → 73 files, 569 passed; `npm run build` → ok. Live vault and pilot Obsidian were **not** run.
- Problems: GAP-COMMENT-EDIT, untagged Abyss Inbox, `tp_…` revoke, NOTE-L3b / AF gate still open. Stamp test in `abyssCommentSync.test.ts` now expects the local wall-clock of `createdTime` so UTC CI matches a +07 machine.
- To Be Done: Owner merges. Human or local agent runs the one live gate on `<pilot-vault>`.
- References: `DEV_FLOW.md`, `PO_STATUS.md`, `ABYSS_FIRST_CASES.md`, `src/test/synchronizationInner.integration.test.ts`

### Iteration 2026-10-19 14:10 UTC

- Context: Release **2.0.47** shipped; three read-only analysts reviewed Abyss tasks, plugin architecture, sync stability.
- Target: Tag/push 2.0.47; consolidate findings into `PO_STATUS.md`.
- Actions log: Committed 47505f5; tagged `2.0.47`; pushed `abyss-mapping` + tag to `tt-sync`; rewrote `PO_STATUS.md`; refreshed `PROJECT_STATE.md`.
- Validation: `npx vitest run` → 67 files, 550 passed; `npm run build` → ok; `git ls-remote tt-sync` shows branch and tag at 47505f5.
- Problems: First branch push got `remote: fatal error in commit_refs`; retry succeeded (resolved). Analyst P0 claim (checkpoint skip) downgraded to P1 BUG-SYNC-SILENT-FAIL after code check.
- To Be Done: Fail-closed pull + honest notice; child comment-line push; integration test for `synchronizationInner`.
- References: `PO_STATUS.md`, `PROJECT_STATE.md`, `CHANGELOG.md`

### Iteration 2026-10-19 13:40 UTC

- Context: Pilot — comments not in TT Comments UI; duplicate `note/`/`proj/` tags (BUG-COMMENT-1, BUG-TAG-1).
- Target: **2.0.47** fixes + smoke IDs NOTE-L3b, NOTE-C1, CTX-D1/D2 in `SMOKE_TESTS.md`.
- Actions log: Comment sync on hash-unchanged path; tag mirror strip/dedupe; automated NOTE-C1 / CTX-D1.
- Validation: `npx vitest run` → 550 passed; `npm run build` → ok.
- Problems: Live CTX-D2 on polluted tasks needs one re-sync after upgrade.
- To Be Done: BRAT **2.0.47**; run NOTE-L3b on «юбка» task.
- References: `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 13:10 UTC

- Context: PO needs Abyss comments in TickTick **Comments** UI, not embedded in task body.
- Target: **2.0.46** — Phase 1 `syncAbyssCommentsViaApi` (default on with Abyss format).
- Actions log: Tick API `get/add/delete` comment; `abyssCommentSync.ts`; Dexie `taskCommentMaps`; push in `TaskModificationDetector`; pull in `fileOperation` + `convertTaskToLine`; setting in `NotesSettings.svelte`.
- Validation: `npx vitest run` → 545 passed; `npm run build` → ok.
- Problems: Comment edit = delete+recreate; live NOTE-L3 on pilot vault still manual.
- To Be Done: BRAT **2.0.46**; re-sync tasks with old `Comments:` in `content` to migrate.
- References: `TT_ABYSS_ROADMAP.md` Phase 1, `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 12:52 UTC

- Context: PO reported comment sync “not working”; need smokes for 2.0.40–2.0.45 behaviour.
- Target: Document **content**-field comments vs TT Comments API; automate NOTE-A*; extend live matrix.
- Actions log: `src/test/notesSmoke.test.ts`; `SMOKE_TESTS.md` (UX, COMMENT expectations, NOTE-L*); `GTD_SYNC_CASES.md` §10 CASE-AN*.
- Validation: `npx vitest run src/test/notesSmoke.test.ts` → 5 passed; full suite 541 passed.
- Problems: Native TT comment UI still **open** (Phase 1); live NOTE-L3 not executed in vault this iteration.
- To Be Done: PO run NOTE-L3 on disk + MCP `content`; implement Phase 1 if Comments UI required.
- References: `TT_ABYSS_ROADMAP.md`, `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 12:50 UTC

- Context: PO wants one palette sync command; full pull duplicated startup behavior.
- Target: **2.0.45** — remove **Synchronize (full pull from TickTick)**; keep **Synchronize** + ribbon.
- Actions log: Dropped `tts-sync-full` from `registerSyncUi()`; updated `SMOKE_TESTS.md`, `PROJECT_STATE.md`.
- Validation: `npm run build` ok.
- Problems: Manual full pull only via reload Obsidian (startup still uses `synchronization(true)`).
- To Be Done: Optional setting for manual full pull if needed later.
- References: `src/main.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 12:42 UTC

- Context: User saw renamed palette entries; ribbon sync icon missing while startup sync blocked `pluginLoad`.
- Target: **2.0.44** — restore **Synchronize** naming; register ribbon in `onload` with commands.
- Actions log: `registerSyncUi()` adds ribbon + both commands; removed duplicate ribbon from `pluginLoad`.
- Validation: `npx vitest run` → 536 passed; `npm run build` → ok.
- Problems: No changes.
- To Be Done: BRAT **2.0.44** + reload.
- References: `src/main.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 12:28 UTC

- Context: Palette had no sync commands while startup sync blocked deferred `pluginLoad`.
- Target: **2.0.43** — register sync commands synchronously in `onload`.
- Actions log: `registerSyncPaletteCommands()`; names **TickTickSync: Synchronize** / **Full synchronize from TickTick**.
- Validation: `npx vitest run` → pass; `npm run build` → ok.
- Problems: Startup sync still blocks other features until it finishes; commands now visible immediately.
- To Be Done: BRAT **2.0.43**; search palette `TickTick` or `sync`.
- References: `src/main.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 12:15 UTC

- Context: Docs and smokes for notes/context tags; palette lost one-shot full TickTick pull.
- Target: **2.0.42** — restore command; document NOTE-* / CTX-*; automated SYNC-12.
- Actions log: `tts-sync-full` in `src/main.ts`; `SMOKE_TESTS.md` sections; `syncSmoke.test.ts` SYNC-12; version bump.
- Validation: `npx vitest run` → 536 passed; `npm run build` → ok; MCP `test 3` still `obsidian` only until vault re-sync with **2.0.41+**.
- Problems: Live CTX-1/2 need Obsidian push after **2.0.41+**; `40 KB/` out of default scope.
- To Be Done: BRAT **2.0.42**; user re-sync Active Zone child for `proj/` tag; Phase 1 comments.
- References: `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 12:02 UTC

- Context: PO asked for TickTick filter tags mirroring Abyss grouping by source note (and project MOC), not only `parentId`.
- Target: **2.0.41** — push `note/<slug>` / `proj/<slug>` on sync; strip on pull.
- Actions log: `src/contextTags.ts`; hook in `convertLineToTask` / `convertTaskToLine`; setting `syncNoteContextTags` (Abyss format); UI in `NotesSettings.svelte`; preset `TTS-data-preset.json`.
- Validation: `npx vitest run` → 535 passed; `npm run build` → ok.
- Problems: `40 KB/` still outside default `syncScopeFolders` — add folder to push log tasks.
- To Be Done: Phase 1 TT Comments API; re-sync lines to attach tags in TickTick.
- References: `TT_ABYSS_ROADMAP.md`, `CHANGELOG.md`

### Iteration 2026-10-19 11:45 UTC

- Context: PO confirmed L1+L3; TT tasks lack project/note context vs Abyss grouping.
- Target: Document Abyss UI grouping vs TT `parentId`/lists; propose C1–C6 in roadmap.
- Actions log: Expanded `TT_ABYSS_ROADMAP.md` Phase 2b; verified `test 3` has `parentId` on TTS-Projects.
- Validation: MCP `get_task_by_id` for Active Zone child shows parent link; inbox tasks do not.
- Problems: Empty `project:` on task notes breaks `resolveForFile` (`open` in vault).
- To Be Done: Implement C2 `projectContextTag`; Phase 1 comments API.
- References: `TT_ABYSS_ROADMAP.md`, `CHANGELOG.md`

### Iteration 2026-10-19 11:30 UTC

- Context: Pilot confirmed Abyss comments need Enter to persist; descriptions sync in 2.0.40; user wants TT Comments UI, task↔note model, subtask smokes.
- Target: Three-phase roadmap (API comments, Abyss note topology, subtask matrix).
- Actions log: Added `TT_ABYSS_ROADMAP.md`; verified TickTick `add_comment`/`get_comment`/`delete_comment` via MCP; updated `PROJECT_STATE.md` backlog.
- Validation: MCP probe comment on `6ad5c3c3…` created and deleted; `get_task_by_id` still has description-only `content`.
- Problems: No `update_comment` in MCP — edit sync may be delete+recreate (`open`).
- To Be Done: Implement Phase 1 (`syncAbyssCommentsViaApi`); PO sign-off Phase 2 (L1+L3 recommended).
- References: `TT_ABYSS_ROADMAP.md`, `ABYSS_NOTES_ALIGNMENT.md`, `CHANGELOG.md`

### Iteration 2026-10-19 09:28 UTC

- Context: Pilot smokes — Abyss description on **тест-синк** did not reach TickTick; TT body on **task-13-43-vault-r3** did not refresh Obsidian when `modifiedTime` was stale.
- Target: **2.0.40** — Obs→TT push and TT→Obs pull for single-line Abyss notes (`- >`).
- Actions log: Line-hash includes note text when `syncNotes` and `taskLines.length > 0` (was `> 1`); `vaultLineBehindTask` parses full Abyss block and compares `content`/`desc` to live TT.
- Validation: `npx vitest run` → 530 passed; root cause matched journal pushes with `"content":""` while vault had `- >` children.
- Problems: Comments (`- stamp:`) still need soak; Abyss UI must flush child lines to `.md` before sync.
- To Be Done: Reload **2.0.40** on pilot vault; re-sync **тест-синк** and a TT-only body edit.
- References: `src/services/TaskModificationDetector.ts`, `src/services/VaultSyncCoordinator.ts`, `ABYSS_NOTES_ALIGNMENT.md`, `CHANGELOG.md`

### Iteration 2026-10-19 07:25 UTC

- Context: Save Abyss↔TT notes analysis; refocus pilot on project scheme and subtask sync.
- Target: Durable docs for notes alignment and for projects / Active Zone / subtask order.
- Actions log: Added `ABYSS_NOTES_ALIGNMENT.md`, `SYNC_PROJECTS_AND_SUBTASKS.md`; linked from `GTD_SYNC_CASES.md` and `PROJECT_STATE.md`.
- Validation: No code change.
- Problems: CASE-P3/P4/P6 and subtask-order live smokes still open.
- To Be Done: Execute §5 in `SYNC_PROJECTS_AND_SUBTASKS.md` on `Thinkpad-tts-test`.
- References: `ABYSS_NOTES_ALIGNMENT.md`, `SYNC_PROJECTS_AND_SUBTASKS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 07:18 UTC

- Context: Full-sync progress modal blocked the vault; user wanted the same top-right toast style as other plugin Notices.
- Target: **2.0.39** — replace modal with persistent `Notice` for full and inline sync progress.
- Actions log: `SyncProgressNotice`; removed `SyncProgressModal`; inline activity uses the same notice stack (not status bar).
- Validation: `npm run build` → ok.
- Problems: open until release.
- To Be Done: Release **2.0.39**.
- References: `src/modals/SyncProgressNotice.ts`, `src/services/SyncActivityIndicator.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 07:08 UTC

- Context: Progress UI should cover inline TickTick updates; scheduled full sync should be optional noise.
- Target: **2.0.38** — `SyncActivityIndicator` (modal + status bar); setting `showSyncProgressOnScheduledSync` (default off).
- Actions log: Wired inline indicator on line push, checkbox, subtask, check database; full sync respects trigger `manual` / `scheduled` / `startup`.
- Validation: `npx vitest run src/test/syncActivityIndicator.test.ts` → 3 passed; `npm run build` → ok.
- Problems: open until release.
- To Be Done: Release **2.0.38**; reload plugin on pilot vault.
- References: `src/services/SyncActivityIndicator.ts`, `AutoSyncIntervalSection.svelte`, `CHANGELOG.md`

### Iteration 2026-10-19 06:58 UTC

- Context: Phase B live smokes with vault open; operator wanted visible sync activity during long runs.
- Target: Ship **2.0.37** progress modal; log Phase B results; skip Phase C.
- Actions log: `SyncProgressModal` + steps in `synchronizationInner`; Phase B agent pass (pull, TT→Obs rename, R7); R3 not automated (disk edit ≠ editor push).
- Validation: `npx vitest run` → pass; live `agent-phase-b-*` + `test-3-phase-b-tt` on pilot vault.
- Problems: Shipped in **2.0.37** (reload plugin to see modal). R3/R8 still need in-editor edits by user.
- To Be Done: Release **2.0.37**; user R3 in Obsidian editor; optional R5/R6.
- References: `src/modals/SyncProgressModal.ts`, `src/services/index.ts`, `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 06:52 UTC

- Context: Close rename investigation; document what agents can automate vs deletion modals in Obsidian.
- Target: `SMOKE_TESTS.md` rename matrix R1–R8, phased plan A–D, result log; align `PROJECT_STATE` / `PO_STATUS` with **2.0.36** pilot status.
- Actions log: User **R1/R2 pass** on 2.0.36; agent `npx vitest run` → 527 pass, smoke bundle 51 pass; MCP live pull skipped when vault inactive.
- Validation: `npx vitest run` → 527 passed (2026-10-19).
- Problems: CASE-DEL-* still need human **Confirm** on `TaskDeletionModal` (agent cannot click UI).
- To Be Done: Phase B R3/R7/R8; Phase C deletion suite; Phase D AF-* soak.
- References: `SMOKE_TESTS.md`, `TaskDeletionModal.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 05:36 UTC

- Context: Delta pull skipped title-only TT renames when `modifiedTime` stayed unchanged; `pushLocalEditsFirst` then overwrote TT from stale `abyss-active` lines (see sync journal `obs->tt` on `6ad5ab55…`).
- Target: **2.0.36** — never push a stale vault title when live TickTick is ahead; still rewrite vault when the checkbox lags.
- Actions log: `skipPushWhenTickTickRenamedVaultLine` in `TaskModificationDetector`; `vaultLineBehindTask` + fresh `getTaskById` in `VaultSyncCoordinator`; cleaned pilot probes in TT and vault (`AF-dup-*`, regression task, LOGIC-A32, FOOL-TT).
- Validation: `npx vitest run` → 527 passed; `npm run build` → ok; `main.js` copied to Thinkpad-tts-test plugin folder.
- Problems: Shipped in **2.0.36**.
- To Be Done: No changes (R1/R2 verified by user on 2.0.36).
- References: `src/services/TaskModificationDetector.ts`, `src/services/VaultSyncCoordinator.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 05:32 UTC

- Context: TT rename on TTS-Inbox did not update `abyss-active.md`; inflated `updatedAt` after vault push made pull keep stale Dexie rows.
- Target: Prefer TickTick `modifiedTime` in conflict resolution; refresh vault lines when checkbox text lags the DB task.
- Actions log: `effectiveTaskRevision` in `conflicts.ts`; `vaultLineBehindTask` in `VaultSyncCoordinator`; `upsertTask` uses TT `modifiedTime`; removed bogus `modifiedTime` stamp in `forceUpdates`. Pilot vault/TT smoke probes removed.
- Validation: `npx vitest run src/test/conflicts.test.ts` → pass.
- Problems: mitigated in **2.0.36** (see iteration above).
- To Be Done: No changes.
- References: `src/sync/conflicts.ts`, `src/services/VaultSyncCoordinator.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 04:56 UTC

- Context: Pull wrote `#obsidian` on TickTick-born lines when `stopInjectingTickTickTag` was on; that tag should mean vault birth only.
- Target: On pull, `#obsidian` only when TickTick still carries the `obsidian` tag; otherwise `#ticktick`.
- Actions log: Fixed `convertTaskToLine` source-tag branch; extended `taskParser.sourceTag.test.ts`; noted SYNC-L6 in `SMOKE_TESTS.md`.
- Validation: `npx vitest run src/test/taskParser.sourceTag.test.ts src/test/syncSmoke.test.ts` → pass; `npm run build` → ok.
- Problems: Shipped in **2.0.35**.
- To Be Done: BRAT → 2.0.35; reload plugin; re-sync TT-born lines to rewrite `#obsidian` → `#ticktick` where appropriate.
- References: `src/taskParser.ts`, `src/test/taskParser.sourceTag.test.ts`, `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 03:45 UTC

- Context: A pause while typing pushed half-finished lines such as `%%`.
- Target: Push a line when the cursor leaves it. Keep checkbox clicks and manual Synchronize.
- Actions log: Removed the editor-change timer. `lineNumberCheck` calls `lineSettledCheck`, which creates or updates the line that was left.
- Validation: Typecheck not gated; `lineSettledCheck` is wired from the existing cursor-move path.
- Problems: Shipped in **2.0.34**. A line is pushed when the cursor leaves it, or on Synchronize.
- To Be Done: Install 2.0.34. Type a checkbox, pause, then press Enter. The task appears only after Enter.
- References: `src/services/EventHandlerService.ts`, `src/main.ts`, `src/services/index.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 03:40 UTC

- Context: A new TTS-Inbox task was going to `30 Tasks/TickTick/TTS-Inbox.md`. That broke Abyss capture.
- Target: Inbox tasks born in TickTick land in the Abyss capture note with `#inbox`.
- Actions log: `fileForNewTickTickTask` uses `abyss-tasks` `taskFilePath` (`00 Inbox/abyss-active.md`). The line gets `#inbox`.
- Validation: `npx vitest run src/test/syncScope.test.ts src/test/projectParentKeep.test.ts` → 20 passed.
- Problems: Shipped in **2.0.33**.
- To Be Done: Install 2.0.33, create a task in TTS-Inbox, confirm the line in `abyss-active.md`.
- References: `src/services/VaultSyncCoordinator.ts`, `src/taskParser.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 03:35 UTC

- Context: Smoke list did not cover the inbox-tag drop, the unfinished `%%` line, or the 5s editor wait.
- Target: Those rows run with the existing unit suite.
- Actions log: Added LOGIC-10–12 and live LOGIC-E/F to `SMOKE_TESTS.md`. A project list keeps a stage tag that is not `inbox`.
- Validation: `npx vitest run src/test/logicSmoke.test.ts src/test/listMapping.test.ts src/test/projectParentKeep.test.ts src/test/foolCases.test.ts` → 18 passed.
- Problems: LOGIC-E and LOGIC-F need a reload and a task created in the TickTick app (`open`).
- To Be Done: Reload, create a task in TTS-Inbox, move it to TTS-nextAction, confirm the line and the missing `inbox` tag.
- References: `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-19 03:30 UTC

- Context: `#inbox` stayed on a task after it left TTS-Inbox. A task created in TTS-Inbox had no file to land in. Editor sync fired after 1s and saved lines like `%%`.
- Target: Drop `inbox` off a task that is not on the inbox list. Write a new allow-listed task into `30 Tasks/TickTick/<list>.md`. Wait 5s and skip an unfinished `%` line.
- Actions log: `tagsForCurrentList` on pull and push; `dropStaleStageTags` updates TickTick; `determineTargetFile` registers a list file; editor debounce 5s; `isUnfinishedCapture`.
- Validation: `npx vitest run src/test/foolCases.test.ts src/test/listMapping.test.ts src/test/services/VaultSyncCoordinator.test.ts` → 33 passed.
- Problems: The task already titled `%%` stays until deleted (`open`). Needs a plugin reload.
- To Be Done: Reload Obsidian. Create a task in TTS-Inbox and confirm a line in `30 Tasks/TickTick/TTS-Inbox.md`. Move a task off the inbox and confirm the `inbox` tag is gone.
- References: `src/services/EventHandlerService.ts`, `src/services/VaultSyncCoordinator.ts`, `src/listMapping.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 02:30 UTC

- Context: LOGIC-B2 title updated on TTS-Inbox while the local record already said TTS-nextAction, so no project move was sent.
- Target: Move from the project TickTick actually reports, and do not keep a destination list locally when that move fails.
- Actions log: `listMoveSource` in the modification path; `moveTaskProject` returns false when `projectMove` fails; empty project-move responses count as failure.
- Validation: `npx vitest run src/test/syncScope.test.ts src/test/listMapping.test.ts` → 20 passed.
- Problems: Live move confirmed after reload (`resolved`). LOGIC-B2 `6ad4df192f54922b67e55fa4` is on TTS-nextAction.
- To Be Done: Add `inbox = TTS-Inbox` only if `#inbox` should be a mapped stage.
- References: `src/syncScope.ts`, `src/services/TaskModificationDetector.ts`, `src/services/TicktickRestAPI.ts`, `CHANGELOG.md`

### Iteration 2026-10-19 00:50 UTC

- Context: Re-run the logic smokes on 2.0.32 in the open test vault.
- Target: `#inbox` stays on TTS-Inbox. Adding `#type/next` moves the task to TTS-nextAction.
- Actions log: Updated `SMOKE_TESTS.md` rows A–D. Ran the unit files. Created LOGIC-A32 and edited LOGIC-B2, then synchronized.
- Validation: `npx vitest run` on logicSmoke, listMapping, projectParentKeep → 13 passed. LOGIC-A32 on TTS-Inbox. LOGIC-B2 title updated on TTS-Inbox; list did not change (`open`).
- Problems: List move is still not applied on the live task (`open`).
- To Be Done: Trace `moveTaskProject` for LOGIC-B2 `6ad4df192f54922b67e55fa4`.
- References: `SMOKE_TESTS.md`, `CHANGELOG.md`

### Iteration 2026-10-18 15:10 UTC

- Context: `#inbox` created tasks on the real Inbox list. Adding `#type/next` later did not move a task, because the stage tag is stripped before the tag-diff.
- Target: Unmapped tags stay on the file's default list. A mapped stage still moves the TickTick list.
- Actions log: Skip list-name matching when `tagListMappings` is set. Move the task when `projectId` changes even if the remaining tags match.
- Validation: `npx vitest run src/test/listMapping.test.ts` → 4 passed.
- Problems: Shipped in **2.0.32**.
- To Be Done: Install 2.0.32 and re-sync a line whose tag changes from none to `#type/next`. Add `inbox = TTS-Inbox` if that tag should select the pilot inbox.
- References: `src/taskParser.ts`, `src/services/TaskModificationDetector.ts`, `CHANGELOG.md`

### Iteration 2026-10-18 14:55 UTC

- Context: The settled task, folder, mapping, and pull rules were scattered across chat notes.
- Target: One logic section, a smoke list, and a run of the rows that do not need the Obsidian UI.
- Actions log: Updated `ABYSS_FIRST_PLAN.md` §6 and `SMOKE_TESTS.md`; added `src/test/logicSmoke.test.ts`.
- Validation: `npx vitest run src/test/logicSmoke.test.ts src/test/listMapping.test.ts src/test/projectParentKeep.test.ts` → 12 passed. TickTick: test 3 `6ad4902e…` and test 4 `6ad4b062…` are children of Phase C on TTS-Projects.
- Problems: LOGIC-A, LOGIC-B, and LOGIC-C need a click-through in Obsidian (`open`).
- To Be Done: Run LOGIC-A–C in `Thinkpad-tts-test` after 2.0.31 is installed.
- References: `SMOKE_TESTS.md`, `ABYSS_FIRST_PLAN.md`, `src/test/logicSmoke.test.ts`, `CHANGELOG.md`

### Iteration 2026-10-18 14:45 UTC

- Context: Template bullets `- [[]]` under related-articles sections were read as checkboxes.
- Target: A wiki-link placeholder is not a task. Real checkboxes `[ ]`, `[x]`, `[/]` still are.
- Actions log: Tightened `checkboxRegex` in `src/taskParser.ts` so the status character cannot be `[` or `]`.
- Validation: `npx vitest run src/test/foolCases.test.ts` → 3 passed.
- Problems: Abyss Tasks uses the same loose pattern and still lists these lines (`open`, not our plugin). Shipped in **2.0.31**.
- To Be Done: Install 2.0.31. Abyss will keep showing these lines until its own matcher changes.
- References: `src/taskParser.ts`, `CHANGELOG.md`

### Iteration 2026-10-18 14:15 UTC

- Context: GTD stages can be TickTick lists or TickTick tags used by filter views. Moves must work both ways.
- Target: Setting `gtdStageVia` = `list` (default) or `tag`, same mapping table.
- Actions log: Helpers in `listMapping.ts`; push and pull in `taskParser.ts`; select in GTD settings.
- Validation: `npx vitest run src/test/listMapping.test.ts src/test/projectParentKeep.test.ts` → 6 passed.
- Problems: Filter views are created in the TickTick app, not by the plugin (`open` as a manual step). Shipped in **2.0.30**.
- To Be Done: Install 2.0.30; choose Tag → list or Tag → tag and sync one `#type/next` line.
- References: `src/listMapping.ts`, `src/taskParser.ts`, `ABYSS_FIRST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-18 12:20 UTC

- Context: Pull of new TickTick tasks should be list OR `tts-test`, not both. Birth tags stay. Date views share the due date.
- Target: `tickTickTaskEntersVault` uses OR; plan §6 matches that, and C/D/E are checked.
- Actions log: OR gate in `src/syncScope.ts` and the Obsidian update check; rewrote `ABYSS_FIRST_PLAN.md` §6.A–E.
- Validation: `npx vitest run` on syncScope, listMapping, projectParentKeep, projectSchemePushContext → 22 passed. TickTick: test 3 and test 4 are subtasks on TTS-Projects; no TTS task due 2026-10-18 through 2026-10-25.
- Problems: Installed plugin is still 2.0.29, so the OR gate is not live (`open`).
- To Be Done: Release when asked; add `📅` on a pilot line and confirm TickTick Today.
- References: `src/syncScope.ts`, `ABYSS_FIRST_PLAN.md`, `CHANGELOG.md`

### Iteration 2026-10-18 12:10 UTC

- Context: Abyss 2.1.2 inbox is untagged top-level lines; `#obsidian` ejects them while they remain on TTS-Inbox.
- Target: A written order for the next alignment, after the tag and view rules were checked in the plugin.
- Actions log: Added `ABYSS_FIRST_PLAN.md` §6; pointed `PROJECT_STATE.md` Target at that order.
- Validation: Read Abyss `main.js` inbox rule (`depth===0 && tags.length===0`) and test-vault `data.json`.
- Problems: No code change in this iteration (`open` work remains §6.A–B).
- To Be Done: Release the linked-line pull; drop the `tts-test` gate on later edits of linked lines; stop writing `#obsidian` on the checkbox.
- References: `ABYSS_FIRST_PLAN.md`, `PROJECT_STATE.md`, `CHANGELOG.md`

### Iteration 2026-10-18 11:50 UTC

- Context: Completing test 2 on TTS-Inbox left the Active Zone line unchecked. The task only has the tag `obsidian`.
- Target: A line that already has `ticktick_id` follows TickTick completion on sync. New unlinked tasks still require SyncTag.
- Actions log: `allowVaultUpdate` used by `VaultSyncCoordinator` so linked tasks on an allow-listed list are written back.
- Validation: `npx vitest run src/test/syncScope.test.ts src/test/services/VaultSyncCoordinator.test.ts` → 39 passed.
- Problems: Installed 2.0.29 still skips these updates (`open` until the next release).
- To Be Done: Release and sync again; the test 2 line should become checked.
- References: `src/syncScope.ts`, `src/services/VaultSyncCoordinator.ts`, `CHANGELOG.md`

### Iteration 2026-10-18 09:40 UTC

- Context: Active Zone lines on a project note sometimes landed on TTS-Inbox; a later line became a subtask on TTS-Projects.
- Target: File-save push uses the same project parent and list as a full sync; a later parent attach also moves the list.
- Actions log: `ProjectSchemeService.ensurePushContext` before new-task and modification scans; `moveTaskProject` before `parentMove` when the list id changes; skip non-string tags in `addTagsToLine`.
- Validation: `npx vitest run` → 500 passed (2 new cases in `projectSchemePushContext.test.ts`).
- Problems: Shipped in **2.0.29** (`resolved` once BRAT installs that release).
- To Be Done: Install 2.0.29 on `Thinkpad-tts-test`; re-add an Active Zone line and confirm it appears under the project on TTS-Projects.
- References: `src/services/ProjectSchemeService.ts`, `src/services/TaskModificationDetector.ts`, `src/taskParser.ts`, `CHANGELOG.md`

### Iteration 2026-10-17 12:05 UTC

- Context: Need repeatable pilot proof that Obsidian line removal deletes on TickTick after 2.0.28.
- Target: Smoke checklist and formal `CASE-DEL-*` scenarios.
- Actions log: Added `SMOKE_TESTS.md`; `GTD_SYNC_CASES.md` §8 deletion cases; updated `PROJECT_STATE.md` validation pointers.
- Validation: Doc-only; execute on `Thinkpad-tts-test` with plugin 2.0.28.
- Problems: DEL-* status **open** until tester fills result log (`open`).
- To Be Done: Run DEL-1 through DEL-5; mark pass/fail in `SMOKE_TESTS.md`.
- References: `SMOKE_TESTS.md`, `GTD_SYNC_CASES.md`, `CHANGELOG.md`

### Iteration 2026-10-17 11:45 UTC

- Context: Obs→TT delete UX failed bulk cleanup; Step/1/2/3 still on TTS-Projects while lines remain in pilot notes.
- Target: One confirm per sync for all removed/orphan tasks; longer modal timeout; orphan scan; clearer notices (2.0.28).
- Actions log: `processSyncRemovedTasks`, `collectTaskIdsAbsentFromVault`, scaled `deletionPromptTimeoutMs`; phase 2 calls vault-wide pass once.
- Validation: `npm test -- --run` → 498 passed; `npm run build` ok.
- Problems: Tasks still in vault (e.g. pilot Active Zone `- [ ] 1/2/3`) stay on TT until lines removed (`open`).
- To Be Done: Install 2.0.28 in test vault; remove template lines from project notes if unwanted on TT.
- References: `CHANGELOG.md`, `src/services/TaskDeletionHandler.ts`, `src/modals/TaskDeletionModal.ts`

### Iteration 2026-10-17 11:01 UTC

- Context: Pilot vault Step 1/2/3 cleanup; owner saw repeated “Tasks will not be deleted… rectify” with no delete dialog on later syncs.
- Target: Clear UX for Obs→TT delete prompts; each manual sync should re-offer deletion after timeout/cancel.
- Actions log: `TaskDeletionModal` returns `DeletionPromptResult`; `clearPendingDeletions()` at sync Phase 2; clearer notices in `TaskDeletionHandler`.
- Validation: `npm test -- --run src/test/modalTimeout.test.ts src/test/services/deletionGuard.test.ts` → 3 passed.
- Problems: Leftover TT orphans still need Confirm on dialog or manual TT delete until build deployed (`open`).
- To Be Done: Build 2.0.28; reload plugin in test vault; sync with Confirm Deletion on each prompt.
- References: `CHANGELOG.md`, `src/modals/TaskDeletionModal.ts`, `src/services/TaskDeletionHandler.ts`

### Iteration 2026-10-16 15:55 UTC

- Context: Owner asked to execute Abyss-first Step 4 (lines stay put; scope push without mandatory `#ticktick`).
- Target: `abyssTasksFormat` + configured `syncScopeFolders` track/push in-place; pull prefers vault `presentAt`; no file move on TT list change.
- Actions log:
  - `syncScope.ts` — `scopePushWithoutMarker()`, `hasConfiguredPushScope()`.
  - `taskParser.ts` — `isLineTrackedForSync`, `#obsidian` on push when `stopInjectingTickTickTag`; no `#ticktick` injection in convert.
  - Wired tracking into `TaskModificationDetector`, `syncModule.forceUpdates`, `index` checkDB, `TaskOperationsService`, `NewFileMap`.
  - `VaultSyncCoordinator` — pull target: vault location wins over list-file/DB.
  - `fileOperation.ts` — skip markdown relocate on list tag change when `abyssTasksFormat`.
  - Tests: `src/test/step4ScopeSync.test.ts`, extended `taskParser.sourceTag.test.ts`.
- Validation: `npm test -- --run` → 498 passed; `npm run build` ok.
- Problems: Phase D pilot spot-check in Obsidian still owner verify (`open`).
- To Be Done: Deploy build to test vault; normal Sync on `TTS-PILOT-tag-routing`; Step 5 settings copy + P6 regression doc.
- References: `CHANGELOG.md`, `ABYSS_FIRST_PLAN.md` Step 4, `src/taskParser.ts`, `src/syncScope.ts`

### Iteration 2026-10-16 15:51 UTC

- Context: Reset tasks hollowed project parent lines and pushed live Projects; owner asked to fix reset/repair.
- Target: Safe reset path, vault repair, pilot-only push for out-of-list tasks.
- Actions log:
  - `repairProjectNoteTasks` hoists synced children into Active Zone; drops parent-id lines.
  - `forceUpdates` skips/removes scheme parents, duplicate parent lines, out-of-`syncedLists` tasks.
  - Reset runs `repairAllProjectNotes` first; modification push respects same limits.
  - Repaired test vault `10 Projects/*.md` via repair helper.
- Validation: `npm test -- --run` → 494 passed; sample note `оборудовать рабочее место.md` Active Zone only.
- Problems: TickTick live **Projects** may still need manual check after prior reset (`open`).
- To Be Done: Reload Obsidian 2.0.26; normal sync (not reset) on test vault.
- References: `CHANGELOG.md`, `src/projectScheme.ts`, `src/services/syncModule.ts`

### Iteration 2026-10-16 15:36 UTC

- Context: Owner reported P6 on pilot project note (duplicate parent checkbox; subtasks under Metadata); continue Step 4–5 hardening.
- Target: Scheme parents never sync as lines; children insert into Active Zone, not under duplicate parent / callout.
- Actions log:
  - `projectScheme.ts` — `isProjectParentDuplicateLine`, `stripProjectParentDuplicateLines`.
  - `ProjectSchemeService` — strip duplicate parent line on scheme run; `lineDuplicatesProjectParent`.
  - `NewFileMap` — do not nest under scheme parent id; Active Zone insert on parent move.
  - `taskParser`, `TaskModificationDetector`, `fileOperation` — ignore/push-skip duplicate parent lines.
  - Tests in `projectScheme.test.ts`.
- Validation: `npm test -- --run` → 493 passed; `npm run build` ok.
- Problems: Existing mis-placed lines need one sync after plugin deploy to relocate (`open` on test vault).
- To Be Done: Copy `dist/` to test vault; sync; Step 4 scope-based push without line tag.
- References: `CHANGELOG.md`, `GTD_SYNC_CASES.md` CASE-P6, `src/projectScheme.ts`

### Iteration 2026-10-16 15:30 UTC

- Context: Owner chose Step 3 Option B (untagged inbox + ignore sync marker in Abyss); asked to record presets and explain `taskIgnoreQuery`.
- Target: Close §3.1 in plan; apply B on test vault; document in pilot runbook.
- Actions log:
  - `ABYSS_FIRST_PLAN.md` §3.1 — **Option B** + one-liner.
  - Test vault: `TTS-abyss-preset.json`; `abyss-tasks/data.json` `taskIgnoreQuery` → `#ticktick`.
  - `TTS-PILOT-RUN.md` Phase A — Abyss preset step; `TODO.md`, `PROJECT_STATE.md` updated.
- Validation: `abyss-tasks/data.json` contains `"taskIgnoreQuery": "#ticktick"`; preset file present under `00 Inbox/`.
- Problems: Inbox UI behavior after reload still needs owner verify (`open`).
- To Be Done: Reload Obsidian; Inbox (`I`) spot-check; Step 4 no-tag sync in plugin.
- References: `CHANGELOG.md`, `ABYSS_FIRST_PLAN.md`, test vault `00 Inbox/TTS-abyss-preset.json`, `TTS-PILOT-RUN.md`

### Iteration 2026-10-16 14:12 UTC

- Context: Owner asked to execute Abyss-first Step 2 and expand Step 3 inbox options.
- Target: Align test vault Abyss config with sync; document Step 3 A/B/C in depth.
- Actions log:
  - Test vault: `abyss-tasks/data.json` — `membershipQuery` `10 Projects/`, project insert `## Active Zone`, `taskFilePath` `00 Inbox/abyss-active.md`; created `00 Inbox/abyss-active.md`.
  - Expanded `ABYSS_FIRST_PLAN.md` Step 3 (variants, comparison table, preset note).
- Validation: Settings match MOC template Active Zone heading; capture path inside `syncScopeFolders`.
- Problems: Step 3 decision still open; Option B needs UI verify for `taskIgnoreQuery`.
- To Be Done: Reload Obsidian; verify Abyss Projects + add task in MOC; pick Step 3 A/B/C.
- References: `CHANGELOG.md`, `ABYSS_FIRST_PLAN.md`, test vault `abyss-tasks/data.json`

### Iteration 2026-10-16 14:05 UTC

- Context: Owner confirmed Abyss-first principles P1–P6 for the sync plan.
- Target: Close Step 1 in `ABYSS_FIRST_PLAN.md`; record PO sign-off.
- Actions log: Marked Step 1 done in plan, `PO_STATUS.md`, `PROJECT_STATE.md`, `TODO.md`.
- Validation: Owner message "confirmed" in chat.
- Problems: Step 3 inbox/marker choice still open.
- To Be Done: Step 2 (Abyss vault config on test vault); Step 3 decision.
- References: `CHANGELOG.md`, `ABYSS_FIRST_PLAN.md`, `PO_STATUS.md`

### Iteration 2026-10-16 13:55 UTC

- Context: Owner overwhelmed by topology R complexity; wants sync aligned with Abyss Tasks logic, planned in steps.
- Target: Single phased plan; park CASE-T4 / canonical list-file requirement for v1.
- Actions log:
  - Added `ABYSS_FIRST_PLAN.md` — principles P1–P6, Steps 1–8, inbox options A/B/C, scope cut, AF-* case outline.
  - Updated `PROJECT_STATE.md`, `PO_STATUS.md` (step 4 / T4), `TODO.md` checklist.
- Validation: No code changes; plan cross-check with `GTD_SYNC_RESEARCH.md` §2.
- Problems: Step 3 inbox choice and Step 3.1 still pending owner input (`open`).
- To Be Done: Owner Step 1 + 3; vault Step 2 on test vault.
- References: `CHANGELOG.md`, `ABYSS_FIRST_PLAN.md`, `PROJECT_STATE.md`

### Iteration 2026-10-16 12:20 UTC

- Context: Owner asked for detailed real-world GTD sync cases, not a short summary.
- Target: Single catalog testers and implementers can execute and sign off against.
- Actions log:
  - Added `GTD_SYNC_CASES.md` — vocabulary, pilot preset, 22 CASE-* scenarios (safety, project scheme, topology R tasks, pull, negatives, migration), pilot matrix, engineering sequence.
  - Linked from `PO_STATUS.md`, `PROJECT_STATE.md`, `GTD_SYNC_RESEARCH.md`; test vault `TTS-PILOT-RUN.md` phase → case map.
- Validation: Cross-check against pilot journal ids and `TTS-PILOT-RUN.md` outcomes (2026-10-16).
- Problems: **CASE-T4** (list-file mirror) and **CASE-P6** (parent as duplicate checkbox) remain open.
- To Be Done: Implement CASE-T4 for **2.0.25**; exercise untested cases in §9 matrix.
- References: `CHANGELOG.md`, `GTD_SYNC_CASES.md`, `PO_STATUS.md`, `GTD_SYNC_RESEARCH.md`

### Iteration 2026-10-16 08:15 UTC

- Context: Owner asked for hands-on pilot testing (Phases C–E) on `Thinkpad-tts-test` after **2.0.24**.
- Target: Verify sync end-to-end against `TTS-PILOT-RUN.md` success criteria.
- Actions log:
  - Created `10 Projects/TTS-PILOT- Phase C test.md` and `30 Tasks/TTS-PILOT-tag-routing.md`; triggered sync via `obsidian://adv-uri` + `tickticksync-abyss:tts-sync`.
  - Phase C pass: parent `6ad1dc711befa8582aceadd7` in **TTS-Projects**, `ticktick_id` on note, no link in TT title.
  - Phase D partial: task `6ad1dc721befa8582aceadd8` in **TTS-nextAction**; vault line in source file only (list stub still empty).
  - Phase E spot: `syncedLists=[]` sync did not append journal pulls; preset restored.
  - Updated test vault `TTS-PILOT-RUN.md` checkboxes; `PO_STATUS.md` pilot table.
- Validation: TickTick MCP task/list lookup; redo journal `sync-mvaowegq-l-tv6y` at 08:12 UTC.
- Problems: Per-list file mirror for obs-created tasks (`open`); legacy vault root stubs from first unlimited sync (`open`).
- To Be Done: Product decision on list-file vs source-file; optional soak; live `Thinkpad` still blocked.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `00 Inbox/TTS-PILOT-RUN.md` (test vault)

### Iteration 2026-10-16 07:58 UTC

- Context: Settings UI duplicated GTD/project controls under Notes and legacy Limit sync conflicted with synced lists.
- Target: Phase A — single canonical GTD surface, clearer tab names, advanced filters only when needed.
- Actions log:
  - Removed `projectSchemeEnabled` and `tagListMappings` from Notes; hid legacy project mapping when scheme on; renamed tab to **Task & note format** with cross-link to GTD.
  - Added **Sync tag** to `GtdSection`; Limit section renamed **Extra filters (advanced)** when lists are ticked; disabled legacy single-list dropdown.
  - Sync Control opens **GTD and projects** by default; intro blurb at top.
- Validation: `npm test` — 492 passed; `npm run build` OK.
- Problems: No changes.
- To Be Done: BRAT **2.0.24**; reload plugin; confirm Notes tab no longer shows scheme/tag→list.
- Version **2.0.24**.
- References: `CHANGELOG.md`, `GtdSection.svelte`, `NotesSettings.svelte`, `LimitSyncSection.svelte`, `SettingsTabs.svelte`

### Iteration 2026-10-16 07:38 UTC

- Context: After every BRAT upgrade, GTD settings (lists, mappings) disappeared in UI and often in `data.json`.
- Target: Upgrades must not rewrite GTD from in-memory defaults; checkpoint/login saves must not trigger stray full-file writes.
- Actions log:
  - `buildPersistedSettings`: merge disk + GTD-safe memory on every `saveSettings`.
  - Version bump on load patches only `data.json` `version`, no full `saveSettings`.
  - Removed `settingsStore.set` auto-save; `updateSettings` defaults to store-only (`persist: true` opt-in).
  - Startup/sync paths use `updateSettings(..., { persist: false })` + explicit `saveSettings`.
  - Version **2.0.23**.
- Validation: `npm test` — 492 passed.
- Problems: Vaults already wiped need one-time preset merge (`TTS-data-preset.json`) (`open`).
- To Be Done: Release **2.0.23**; BRAT update; disable/enable + upgrade smoke test.
- References: `CHANGELOG.md`, `src/settingsMerge.ts`, `src/main.ts`, `src/ui/settings/settingsstore.ts`

### Iteration 2026-10-16 07:25 UTC

- Context: Disabling and re-enabling the plugin cleared GTD keys in `data.json` (`syncedLists`, mappings) even when disk had a full preset.
- Target: No `data.json` rewrite on enable unless version migration actually changed; sync/init must not run before settings load completes.
- Actions log:
  - `ensureSettingsLoaded()` single-flight promise; `onLayoutReady` awaits it before `pluginLoad()` / `initDB`.
  - `loadSettings`: save only when `merged.version !== versionBefore` (not every enable).
  - `settingsStore.set`: auto-save only when `plugin.settingsReady`.
  - `trackDeviceInSettings`: `updateSettings(..., { persist: false })`.
  - Version **2.0.22**.
- Validation: `npm test` — 491 passed; `npm run build` OK.
- Problems: Prior wipes on disk need preset merge once (`open` for affected vaults).
- To Be Done: BRAT to **2.0.22**; disable/enable plugin twice; confirm GTD section and `data.json` unchanged.
- References: `CHANGELOG.md`, `src/main.ts`, `src/ui/settings/settingsstore.ts`, `src/db/dexie.ts`

### Iteration 2026-10-16 07:12 UTC

- Context: On **2.0.20**, Thinkpad test vault `data.json` had six `syncedLists` and four `tagListMappings` on disk but GTD UI showed empty checkboxes and tag textarea (API list fetch empty + Svelte store still on defaults).
- Target: Show disk-backed GTD config in UI before any save; block writes that would wipe on-disk GTD; release **2.0.21**.
- Actions log:
  - `GtdSection`: `loadFields()` from `getSettings()` on mount; `checkboxLists` merges API projects with saved `syncedLists`; status line for loaded count vs preset hint; `wouldWipeGtdFromDisk` guard on UI save; `refreshSettingsStore` when store lags module settings.
  - `wouldWipeGtdFromDisk` in `settingsMerge.ts`; `saveSettings` blocks persist and re-hydrates when wipe detected.
  - Vitest extended; merged `TTS-data-preset.json` into test-vault `data.json` (session fields kept); `dist/` → `tickticksync-abyss`.
  - Version **2.0.21**.
- Validation: `npm test --run` — 491 passed; `npm run build` OK; vault merge → six lists, four mappings.
- Problems: Empty checkbox UI when TickTick login fails is mitigated by showing saved list names (`mitigated`).
- To Be Done: Owner reload plugin in Obsidian; open GTD section and confirm status + mappings.
- References: `CHANGELOG.md`, `src/ui/settings/svelte/sections/GtdSection.svelte`, `src/settingsMerge.ts`, `src/main.ts`

### Iteration 2026-10-16 07:00 UTC

- Context: After BRAT upgrade to **2.0.19** + TickTick login on `Thinkpad-tts-test`, GTD tab showed empty lists/mappings; vault `data.json` on disk was also empty (not UI-only).
- Target: Durable fix so login/early `saveSettings(true)` cannot overwrite GTD keys; restore test-vault preset; release **2.0.20**.
- Actions log:
  - Root cause: race — `saveSettings(true)` on login (or `settingsStore.set` before `loadSettings` completes) wrote in-memory `DEFAULT_SETTINGS` over `data.json`; `loadSettings` then persisted the already-wiped file.
  - `preserveGtdFromDisk` / `hydrateSettingsFromDisk` in `settingsMerge.ts`; `saveSettings` hydrates from disk on forced pre-load saves and merges GTD arrays from disk/snapshot before every write.
  - `GtdSection`: `gtdHydrated` gate — no persist until `plugin.settingsReady`; import GTD JSON from clipboard; token/projectsVersion only reload list checkboxes.
  - Login paths use `updateSettings(loginPatch, { persist: false })` so `settingsStore.set` cannot auto-save before GTD hydrate; `NotesSettings` same hydration gate.
  - Vitest: `settingsPreserveGtd.test.ts`; merged `00 Inbox/TTS-data-preset.json` into test vault `data.json` (session fields kept); `dist/` → test vault.
  - Version **2.0.20**.
- Validation: `npm test --run` — 490 passed; `npm run build` OK; vault merge script → six `syncedLists`, `SyncTag=tts-test`, scheme on.
- Problems: Prior wipe already committed to disk until preset merge (`resolved` for test vault).
- To Be Done: Owner reload plugin **2.0.20** in Obsidian; confirm GTD tab; re-run pilot step 2 if needed.
- References: `CHANGELOG.md`, `src/settingsMerge.ts`, `src/main.ts`, `src/ui/settings/svelte/sections/GtdSection.svelte`, test vault `TTS-data-preset.json`

### Iteration 2026-10-16 06:52 UTC

- Context: Phase B pilot **FAIL** on scoped pull — `SyncTag=tts-test` did not bound project scheme; 16 legacy `10 Projects/` notes touched via live **Projects** list id.
- Target: Scheme parents only from allow-listed `projectsListName` + `syncedLists` + SyncTag; no re-bind of out-of-scope notes; MOC placeholder cleanup; `TTS-Projects.md` stub; release **2.0.18**.
- Actions log: Added `taskMatchesSyncLimit`, `resolveProjectsList`, `isSchemeParentTask`; tightened `ProjectSchemeService.run`; shared filter in `VaultSyncCoordinator`; scheme Projects list gets list stub; `stripActiveZonePlaceholders` in template render; Vitest; version bump.
- Validation: `npm test --run` — 486 passed.
- Problems: Prior pilot note touch-ups in vault not auto-reverted (`open`, manual if needed).
- To Be Done: Re-run Phase B on **2.0.18**; Phases C–E per `TTS-PILOT-RUN.md`.
- References: `CHANGELOG.md`, `src/syncScope.ts`, `src/projectScheme.ts`, `src/services/ProjectSchemeService.ts`

### Iteration 2026-10-16 06:55 UTC

- Context: Owner ran Phase B pilot sync (`sync-mvalv6fr-1-ezhs`) on `Thinkpad-tts-test`; agent verified vault + TickTick MCP.
- Target: Confirm checklist step 2 (TT parent → project note + per-list stubs) without widening scope to live lists.
- Actions log: Read pilot note, `data.json` (secrets redacted), journal `2026-10-16.jsonl`; TickTick MCP `get_task_by_id`, `get_project_with_undone_tasks`, `filter_tasks` tag `tts-test`.
- Validation:
  - Plugin preset: six `syncedLists`, `SyncTag=tts-test`, scheme + `tagListMappings` match `TTS-data-preset.json` — pass.
  - TT task `6ad1c7878f0841315e89a10c`: title `TTS-PILOT: Dishwasher project`, tags `tts-test`/`project`/`obsidian`, no `obsidian://` in title — pass.
  - `TTS-Projects` undone: only pilot parent — pass.
  - Obsidian: `10 Projects/TTS-PILOT- Dishwasher project.md` created with `ticktick_id`, `system/project`, `## Active Zone`, MOC body — pass.
  - List stubs: five files under `30 Tasks/TickTick/` (no `TTS-Projects.md`); pilot sync created no new vault-root list files (root `Inbox.md` mtime predates sync) — partial.
  - Same sync updated 16 existing `10 Projects/*.md` notes tied to live list `69569c948f087c3908f43b93` (added `#ticktick` / metadata) — fail scoped pull.
  - Phases C–E (Obs→TT project, `#type/next` inline, empty `syncedLists`) — not run (no file evidence).
- Problems:
  - `SyncTag` did not limit project-scheme refresh of vault notes already mapped to live **Projects** (`open`).
  - MOC template left placeholder Active Zone checkboxes `1`/`2`/`3` in pilot note; TT `childIds` null (`open`, risk on next Obs→TT).
  - Missing per-list stub for `TTS-Projects` (`open`).
- To Be Done: Fix scope (project scheme + tag filter); strip template placeholders or skip empty template tasks; run Phases C–D; optional cleanup of 16 note touch-ups.
- References: `CHANGELOG.md`, `PO_STATUS.md`, test vault `00 Inbox/TTS-PILOT-RUN.md`, `.tickticksync/journal/2026-10-16.jsonl`

### Iteration 2026-10-16 06:50 UTC

- Context: Owner confirmed settings UI on plugin 2.0.17; pilot soak on `Thinkpad-tts-test` next.
- Target: Harden vault `data.json`, one TT pilot parent, operator runbook, PO checklist status.
- Actions log:
  - Merged `00 Inbox/TTS-data-preset.json` into test-vault `tickticksync-abyss/data.json` (kept session fields); fixed drift (`syncedLists` empty, scheme off, wrong `projectsListId`).
  - Verified vault `manifest.json` **2.0.17** and `main.js` matches repo `dist/`.
  - TickTick MCP: created parent **TTS-PILOT: Dishwasher project** in `TTS-Projects` (`6ad1c7878f0841315e89a10c`, tags `tts-test`, `project`, `obsidian`).
  - Added `00 Inbox/TTS-PILOT-RUN.md`; updated `PO_STATUS.md` pilot checklist table.
- Validation: `node` merge script printed expected GTD keys; `cmp` dist vs vault `main.js` identical.
- Problems: `data.json` had regressed to pre-pilot defaults before merge (`open`, mitigated).
- To Be Done: User runs Phases B–E in `TTS-PILOT-RUN.md`; optional commit/push docs on `tt-sync`.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `00 Inbox/TTS-PILOT-RUN.md` (test vault), `TTS-data-preset.json` (test vault)

### Iteration 2026-10-16 06:45 UTC

- Context: Thinkpad-tts-test Obsidian 1.13.7 — plugin 2.0.16 enabled but no gear on Installed row; vault `main.js` matched release build.
- Target: Settings tab registers on enable; fallback command; release 2.0.17.
- Actions log:
  - Root cause: 2.0.16 still `await loadSettings()` before `addSettingTab` — slow or stuck `loadData`/`saveSettings` blocked tab registration for the gear and sidebar entry.
  - `addSettingTab` runs synchronously at start of `onload`; `loadSettings` moved to `completeSettingsLoad()`; `refreshSettingsStore()` after async load.
  - Command `tickticksync-abyss:open-settings`; ribbon + notice when tab registration throws; docs for 1.13 left-sidebar entry.
  - Version 2.0.17.
- Validation: `npm test -- --run`; `npm run build`; copied `dist/` to test vault.
- Problems: No changes.
- To Be Done: Push `abyss-mapping`, tag `2.0.17`, reload plugin in Obsidian and confirm gear + sidebar entry.
- References: `CHANGELOG.md`, `src/main.ts`, `docs/BRAT_INSTALL.md`

### Iteration 2026-10-16 06:30 UTC

- Context: BRAT install 2.0.15 on Thinkpad-tts-test — no settings gear on **Settings → Community plugins → Installed** row.
- Target: Settings tab registers on enable; release 2.0.16 with same install layout as 2.0.15.
- Actions log:
  - Vault check: folder `tickticksync-abyss`, `community-plugins.json` id match, `data.json` present, `main.js` 649 KiB, `node --check` OK.
  - Release 2.0.15 assets: flat `manifest.json` + `main.js` + `styles.css`; zip `tickticksync-abyss/{main.js,manifest.json,styles.css}` (not a wrong folder name).
  - Root cause: `addSettingTab` ran only inside `onLayoutReady` after `waitForObsidianSync` → gear absent until layout + sync idle (sync can wait indefinitely).
  - `registerSettingsTab()` in `onload` before deferred work; `pluginLoad` no longer loads settings or adds tab; try/catch on deferred load.
  - Version 2.0.16; `docs/BRAT_INSTALL.md` notes Installed-list gear vs catalog page.
- Validation: `npm test -- --run` 481 passed; `npm run build` OK; copied `dist/` to test vault.
- Problems: Users on 2.0.15 need BRAT **Check for updates** or tag `2.0.16` release (`open`).
- To Be Done: Push `abyss-mapping`, publish GitHub release `2.0.16`, reload plugin in Obsidian and confirm gear on Installed row.
- References: `CHANGELOG.md`, `src/main.ts`, `docs/BRAT_INSTALL.md`

### Iteration 2026-10-16 06:22 UTC

- Context: BRAT v1.1+ installs from GitHub release assets; `tt-sync` had no releases and no CI on `abyss-mapping`.
- Target: GitHub Actions CI + release workflow; BRAT install docs aligned with release-based installs.
- Actions log:
  - Added `.github/workflows/ci.yml` (push/PR to `abyss-mapping`: `npm ci`, test, build).
  - Reworked `.github/workflows/release.yml` for `tickticksync-abyss`, tag `v*` / semver, `workflow_dispatch`, release assets.
  - Updated `docs/BRAT_INSTALL.md` (releases vs branch, first-release steps).
- Validation: `npm test` 57 files / 481 passed; `npm run build` OK locally.
- Problems: No GitHub release until workflow runs on `tt-sync` (`open`).
- To Be Done: Run release workflow or push version tag; BRAT add beta plugin after first release.
- References: `CHANGELOG.md`, `docs/BRAT_INSTALL.md`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`

### Iteration 2026-10-16 06:05 UTC

- Context: Community plugin id `tickticksync` would be overwritten by catalog updates; Abyss fork needs a distinct id for BRAT installs.
- Target: Plugin id `tickticksync-abyss`, BRAT install docs, test vault on new folder path with preserved `data.json`.
- Actions log:
  - Updated `manifest.json` (id, name, version 2.0.15), `package.json`, `versions.json`, dev `vite.config.mts` out path.
  - Added `docs/BRAT_INSTALL.md`; README install pointer.
  - Codebase: no runtime plugin-id strings; vault redo log stays `.tickticksync/journal` (not plugin folder).
  - Thinkpad-tts-test: `community-plugins.json` → `tickticksync-abyss`; moved plugin dir; copied `dist/` to new path.
- Validation: `npm test -- --run` 57 files / 481 passed; `npm run build` OK; `dist/manifest.json` id `tickticksync-abyss`.
- Problems: Branch `abyss-mapping` must be pushed to GitHub before BRAT can pull (`open` until push).
- To Be Done: Push branch; BRAT add repo + branch; disable/remove community `tickticksync` on other vaults.
- References: `CHANGELOG.md`, `docs/BRAT_INSTALL.md`, `manifest.json`, `PO_STATUS.md`

### Iteration 2026-10-16 05:45 UTC

- Context: Thinkpad-tts-test vault showed no TickTickSync settings tab (only Disable/Uninstall on community card).
- Target: Settings tab must register even when `loadSettings` or login fails; load errors must not abort `pluginLoad`.
- Actions log:
  - Root cause: `pluginLoad` returned before `addSettingTab` when `loadSettings` returned false (migration or `loadData` failure).
  - Always call `addSettingTab` after `loadSettings`; continue initialization with a notice on partial load.
  - `loadSettings`: migration errors keep in-memory merge without auto-save; total failure falls back to defaults and sets `settingsReady`.
  - Copied `dist/` to `<pilot-vault>/.obsidian/plugins/tickticksync/`.
- Validation: `npm test -- --run` 57 files / 481 passed; `npm run build` OK.
- Problems: Test vault `manifest.json` still lists `author: thesamim` (fork); community browser may show upstream X-isfor-Adam if BRAT points elsewhere (`open`).
- To Be Done: Reload plugin in Obsidian; open settings via gear on plugin row in Settings → Community plugins.
- References: `CHANGELOG.md`, `src/main.ts`

### Iteration 2026-10-16 05:36 UTC

- Context: Re-enabling TickTickSync in Obsidian wiped GTD preset fields (`syncedLists`, `tagListMappings`, etc.) in test vault `data.json`.
- Target: Enable/disable must only merge missing keys from defaults; never persist in-memory defaults over an existing `data.json`.
- Actions log:
  - Root cause: `updateSettings` always called `settingsStore.set`, which auto-saved; settings tab was registered before `loadSettings`, so `DeviceIdentitySection` could `updateSettings({ devices })` while module settings were still `DEFAULT_SETTINGS` and overwrite disk.
  - `loadSettings` before `addSettingTab`; `settingsReady` gate on `saveSettings`; load uses `mergeSettingsWithDefaults` + `updateSettings(..., { persist: false })` then one save after merge.
  - `settingsLoad` always refreshes `currentPlugin` and re-hydrates the Svelte store without save on re-enable.
  - Added `src/settingsMerge.ts` and `src/test/settingsMerge.test.ts`; `DeviceIdentitySection` uses non-persisting device merge then explicit save.
  - Re-merged `00 Inbox/TTS-data-preset.json` into test-vault `data.json` (kept token, checkPoint, inbox, devices); copied `dist/` to Thinkpad-tts-test.
- Validation: `npm test -- --run` 57 files / 481 passed; `npm run build` OK.
- Problems: Real Obsidian re-enable with settings tab open not re-tested in UI yet (`open`).
- To Be Done: Disable and re-enable plugin with GTD tab open; confirm `data.json` keeps six `syncedLists` and tag mappings.
- References: `CHANGELOG.md`, `src/main.ts`, `src/settings.ts`, `src/settingsMerge.ts`, `src/ui/settings/settingsstore.ts`

### Iteration 2026-10-16 05:30 UTC

- Context: Test vault owner wants login at plugin start (stored username/password), lists in GTD section without a click on Login.
- Target: On load auto-authenticate, then refill list cache and refresh GtdSection; preset applied to test vault `data.json`.
- Actions log:
  - Found: no auto-login existed (`initializePlugin` only said "Please login from settings"); creds were never stored.
  - Added `src/autoLogin.ts` (`ensureSession`): no token + creds -> login; token rejected (`getUserStatus` null) + creds -> re-login; no creds -> old behavior.
  - `main.ts`: `ensureLoggedIn()` at the start of `initializePlugin()`; applies `loginPatch` (GTD settings kept); `bumpProjectsVersion()` after `saveProjectsToCache`.
  - New `src/projectsVersion.ts` store; `GtdSection.svelte` reloads lists on it (+ re-run if a reload was in flight).
  - New optional settings keys `username`, `password` (plaintext in `data.json`); `AccessControlLogin.svelte` prefills and saves them on change; banner text updated.
  - Merged `00 Inbox/TTS-data-preset.json` into test-vault `data.json` (token, checkPoint, inboxID, inboxName, devices kept); backup `/tmp/tts-data.json.bak`.
  - Built and copied `dist/main.js`, `styles.css`, `manifest.json` to Thinkpad-tts-test.
- Validation: `npm test -- --run` 56 files / 478 passed (new `autoLogin.test.ts`); `npm run build` OK; `tsc --noEmit` clean; `cmp dist/main.js` = vault copy.
- Problems: test-vault `data.json` has no `username`/`password` yet, so auto-login only re-logs in once they are added (`open`); Obsidian was running during edit, a running plugin can overwrite `data.json` (`open`, reload plugin).
- To Be Done: Add `username`/`password` (settings or data.json), reload plugin, check lists appear in GTD section; then pilot checklist in `PO_STATUS.md`.
- References: `CHANGELOG.md`, `src/autoLogin.ts`, `src/main.ts`, `src/projectsVersion.ts`, `src/ui/settings/svelte/AccessControlLogin.svelte`, `<pilot-vault>/.obsidian/plugins/tickticksync/data.json`

### Iteration 2026-10-16 05:25 UTC

- Context: GTD table (synced lists, tag→list mapping) empty after every login; preset in `data.json` was gone (`syncedLists`/`tagListMappings` = `[]`).
- Target: Login and settings UI never clear GTD settings; failed list fetch shows an error.
- Actions log:
  - `GtdSection.svelte`: fill inputs from store before the async list fetch; save one field per edit (was: all inputs, empty ones overwrote `tagListMappings`/`syncScopeFolders`/`projectTemplatePath`); no save before mount; reload lists on token change + button; error text on fetch failure.
  - `main.ts` `migrateData`: dropped `saveSettings()` that wrote in-memory DEFAULT_SETTINGS over `data.json` on load.
  - `loginSettings.ts` + `AccessControlLogin.svelte`: login patches only token/inbox/checkpoint.
  - Added `src/test/loginSettings.test.ts`; deployed `dist/main.js`, `styles.css` to Thinkpad-tts-test.
- Validation: `npm test` 471 passed; `npm run build` OK. `data.json` not touched (re-apply preset).
- Problems: root cause of the file wipe was two paths (GtdSection full-field save after failed `onMount`; default-settings save in `migrateData`); real-UI re-check pending (`open`).
- To Be Done: Re-apply GTD preset in `data.json`, restart plugin, login again, confirm table stays filled.
- References: `CHANGELOG.md`, `src/ui/settings/svelte/sections/GtdSection.svelte`, `src/main.ts`, `src/loginSettings.ts`

### Iteration 2026-10-16 06:10 UTC

- Context: GTD MVP code landed; test vault needed deploy and `TTS-*` preset before pilot.
- Target: Build plugin and align test-vault `data.json` with list-file mode (not hub).
- Actions log: `npm run build`; copied `dist/` to test vault; set `syncedLists`, `syncScopeFolders`, `projectTemplatePath`, `TTS-*` tag mappings, `projectsListName`/`projectsListId`; cleared `newTasksFile`; updated `TTS-PILOT.md`, `PO_STATUS.md` checklist.
- Validation: `npm run build` OK.
- Problems: Hub mode and per-list files remain mutually exclusive (`open`).
- To Be Done: Owner runs pilot steps in `PO_STATUS.md` §6.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `1e62ac3c-b7eb-4c25-ac0c-60e7e5cbacb9`

### Iteration 2026-10-16 05:00 UTC

- Context: Owner said "go" on GTD MVP (`GTD_SYNC_RESEARCH.md` §6.3–6.4); branch `abyss-mapping`, not committed.
- Target: No stub files for non-synced lists; `syncedLists` / `syncScopeFolders` / `projectTemplatePath`; source-tag fix; GTD settings UI; safe fork defaults.
- Actions log:
  - Added `src/syncScope.ts` (allow-list match by name/id, rename heal, `SyncProject` migration, folder prefix scope).
  - G1: `ProjectSyncService` and `VaultSyncCoordinator.ensureProjectFilesExist` create entries/stubs only for allow-listed lists (never the scheme Projects list).
  - Pull gate: `VaultSyncCoordinator.matchesFilter` + `syncModule` filter + `ProjectSchemeService` (skips when Projects list not allowed); empty list = nothing + notice.
  - Push scope: `TaskModificationDetector` (new, modify, file scan), `TaskDeletionHandler`, checkbox handler in `main.ts`; tasks folder/projects folder/hub file always in scope.
  - R1/AC-9: `TaskParser.hasTickTickTag` accepts `#obsidian` when `ticktick_id` is present.
  - `projectScheme.renderProjectTemplate` (skips `<%*` blocks, fills title/id/date, forces tags/ticktick_id/Active Zone); used when `projectTemplatePath` is set.
  - New UI section "GTD and projects" (`GtdSection.svelte`); defaults: `fileLinksInTickTick=noLink`, `stopInjectingTickTickTag=true`, interval 0, `syncedLists=[]`.
  - Tests: new `syncScope.test.ts`, `taskParser.sourceTag.test.ts`; extended `ProjectSyncService`, `VaultSyncCoordinator`, `projectScheme` tests.
- Validation: `npm test` → 54 files, 468 tests passed; `npx tsc --noEmit` clean; `npm run build` OK. Not run in Obsidian.
- Problems:
  - Existing installs with `SyncTag` but no `SyncProject` now get `syncedLists=[]` (pull nothing) until lists are ticked (`open`, by design).
  - Hub mode (`newTasksFile`) writes every allowed list into one file; pilot vault has it set (`open`, owner choice).
  - Reverse `projectMappings` still unwired (`open`).
- To Be Done: Install build in test vault, tick `TTS-*` lists, run plan A/B; then decide hub vs per-list files.
- References: `CHANGELOG.md`, `TODO.md`, `src/syncScope.ts`, `src/services/ProjectSyncService.ts`, `src/services/VaultSyncCoordinator.ts`, `src/ui/settings/svelte/sections/GtdSection.svelte`

### Iteration 2026-10-16 05:15 UTC

- Context: GTD research subagent finished; test vault `data.json` had drifted to unlimited sync.
- Target: Re-harden test vault before any manual sync; align Abyss project folder with `10 Projects/`.
- Actions log: Set `SyncTag=tts-test`, scheme on, tasks path `30 Tasks/TickTick`, `tagListMappings` for `type/*`; Abyss `membershipQuery` and Active Zone insertion; updated `PO_STATUS.md` §6.
- Validation: Read back test-vault `data.json` keys; no `npm test` (no code changes).
- Problems: Stub files for all lists still land under `30 Tasks/TickTick/` on sync until G1 fix (`open`).
- To Be Done: Owner confirms `GTD_SYNC_RESEARCH.md` §9; implement MVP items in `TODO.md` GTD section.
- References: `CHANGELOG.md`, `GTD_SYNC_RESEARCH.md`, `PO_STATUS.md`, `<pilot-vault>/.obsidian/plugins/tickticksync/data.json`

### Iteration 2026-10-16 05:35 UTC

- Context: Owner answered GTD research §9; pilot can use isolated TickTick lists.
- Target: Record decisions; create `TTS-*` lists; align test vault hub path.
- Actions log: Updated `PO_STATUS.md` §6 confirmations; MCP `create_project` for seven `TTS-*` lists; `newTasksFile` → `00 Inbox/TickTick-capture.md`; wrote `00 Inbox/TTS-PILOT.md` in test vault.
- Validation: TickTick MCP returned ids for all seven lists.
- Problems: `tagListMappings` still target production list names until soak remapped (`open`).
- To Be Done: Implement G1 + `syncedLists`; remap pilot to `TTS-*`; `projectTemplatePath` for MOC template.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `GTD_SYNC_RESEARCH.md`, `<pilot-vault>/00 Inbox/TTS-PILOT.md`

### Iteration 2026-10-16 04:45 UTC

- Context: Owner wants GTD objects (tasks, projects), no root-level list files, clear settings, configurable folder/tag ↔ list/tag mapping.
- Target: One research report: how the plugin works, how Abyss defines a project, PO acceptance criteria, hypotheses A/B, recommended model.
- Actions log:
  - Read `PO_STATUS.md`, `ABYSS_MAPPING.md`, `PROJECT_STATE.md`, `src/settings.ts`, sync/routing/scheme code, settings UI, test vault templates and Abyss `data.json`.
  - Wrote `GTD_SYNC_RESEARCH.md` (analyst sections, gaps G1–G13, hypotheses A/B, recommendation R, test plans, open questions).
  - Added PO decision section to `PO_STATUS.md`; added next steps to `TODO.md`; refreshed `PROJECT_STATE.md` pointers.
- Validation: `npm test` → 52 files, 437 tests passed. No plugin code or vault files changed.
- Problems:
  - Root stubs come from `ProjectSyncService.checkProjectRename` for every list, regardless of Sync Tag/Project (`open`).
  - `projectMappings` reverse path (`pathForProjectId`) is not wired in pull routing (`open`).
  - Test vault `data.json` has empty `SyncTag`/`SyncProject` and scheme off, unlike `PO_STATUS.md` §2 (`open`, do not Sync now).
  - Obsidian-born project lines with `#obsidian` may lack the `#ticktick` marker needed for detection (unverified, `open`).
- To Be Done: Owner answers §9 questions in `GTD_SYNC_RESEARCH.md`; then stubs fix, `syncedLists`, `syncScopeFolders`, GTD settings UI; soak per §4.3.
- References: `CHANGELOG.md`, `GTD_SYNC_RESEARCH.md`, `PO_STATUS.md`, `TODO.md`, `PROJECT_STATE.md`

### Iteration 2026-10-16 04:10 UTC

- Context: Owner does not want a sync when the plugin is enabled; settings come first.
- Target: Interval stays 0; remove the one-shot sync from plugin load.
- Actions log: Dropped the enable-time `scheduledSynchronization` call; rebuilt and copied into the test vault.
- Validation: `npm run build` OK; test-vault interval is 0.
- Problems: - No changes
- To Be Done: Enable the plugin, set options, then use Sync now.
- References: `CHANGELOG.md`, `src/main.ts`

### Iteration 2026-10-16 04:08 UTC

- Context: Owner wants no repeating sync, and one sync when the plugin is enabled.
- Target: Default interval 0; `pluginLoad` runs one sync if a token is saved.
- Actions log: Default `automaticSynchronizationInterval` set to 0; one-shot sync after `reloadInterval`; test-vault `data.json` interval set to 0; rebuilt and copied into the test vault.
- Validation: `npm run build` OK.
- Problems: - No changes
- To Be Done: Disable and enable TickTickSync in the test vault to run that one sync.
- References: `CHANGELOG.md`, `src/main.ts`, `src/settings.ts`

### Iteration 2026-10-16 03:59 UTC

- Context: Owner asked for missing Projects parents, missing subtasks, and a source tag.
- Target: Every root task in list Projects becomes a project note; children land in Active Zone; source tag `ticktick` or `obsidian`.
- Actions log: `isListRoot` replaces the `project`-tag gate; VaultSyncCoordinator prefers the parent note over a stale list file; notes stamped with source tag; child lines show `#obsidian` or `#ticktick`. Rebuilt and copied `main.js` into the test vault.
- Validation: `vitest run` projectScheme + projectParentKeep → 9 passed; `npm run build` OK.
- Problems: Checklist items inside a TickTick task are still not child tasks (`open`).
- To Be Done: Reload the test vault plugin and Sync Now; confirm Годовые задачи / PKM notes and Active Zone children.
- References: `CHANGELOG.md`, `src/projectScheme.ts`, `src/services/ProjectSchemeService.ts`, `src/services/VaultSyncCoordinator.ts`

### Iteration 2026-10-16 03:02 UTC

- Context: Owner confirmed PO §1 target scheme for projects.
- Target: Record approval; keep next step as Projects-only limited soak.
- Actions log: Updated `PO_STATUS.md` §5 and `PROJECT_STATE.md` Target.
- Validation: Owner message — “1 - yes, target scheme for projects is like that.”
- Problems: - No changes
- To Be Done: Configure test vault for Projects-only sync; try one parent task ↔ one note.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `PROJECT_STATE.md`

### Iteration 2026-10-16 01:55 UTC

- Context: Restore TickTick after sync pollution; deliver PO brief for project-scheme direction.
- Target: Clean TT titles/tags; delete TTS samples; document desired TT↔Obsidian Projects flow for PO.
- Actions log:
  - Cleaned ~120 tasks via TickTick MCP `batch_update_tasks` (strip Obsidian title links, drop `ticktick` tag).
  - Deleted TTS samples A/B via MCP `delete_task`.
  - Hardened test-vault plugin settings (SyncTag `tts-test`, noLink, stopInject tag, 24h interval).
  - Wrote `PO_STATUS.md` for product-owner analysis.
- Validation: MCP `filter_tasks` tag=`ticktick` → empty; probe task title clean; samples deleted.
- Problems: Web-session `batch/task` POST returned 403 earlier (`resolved` via MCP Open API).
- To Be Done: PO review of `PO_STATUS.md`; then limited Projects-only soak.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `PROJECT_STATE.md`

### Iteration 2026-10-16 01:30 UTC

- Context: Parse live test-vault settings and compare Obsidian copy vs TickTick account after first sync.
- Target: Clear inventory of settings effect and cross-side mutation.
- Actions log: Read `data.json`; counted vault `ticktick_id`s; queried TickTick projects/tasks via plugin session.
- Validation: Obsidian ~123 synced ids in 8 files; TickTick ~224 open tasks across lists; 123 TT tasks now have `ticktick` tag + Obsidian title links; samples A/B in Inbox with empty note body.
- Problems:
  - Sync limits still empty → full mirror behavior remains (`open`).
  - TickTick titles/tags polluted by bidirectional link injection (`open` for cleanup).
  - Abyss note lines on A not present in TT `content`/`desc` (`open`).
- To Be Done: Set SyncTag / raise interval; decide cleanup of TT title links + `ticktick` tags; optional re-sync notes.
- References: `CHANGELOG.md`, `<pilot-vault>/.obsidian/plugins/tickticksync/data.json`

### Iteration 2026-10-15 11:12 UTC

- Context: User ran first sync on Thinkpad-tts-test after login.
- Target: Assess limited-sync soak result and real-vault safety.
- Actions log: Inspected `data.json`, `TTS-Test.md`, new root project notes, backup CSV; compared real Thinkpad vault.
- Validation: Local samples A/B got `ticktick_id` + Inbox links; ~123 `ticktick_id` lines across 8 files; real vault has no TTS plugin / no `Inbox.md`.
- Problems:
  - Sync limits wiped: `SyncTag`/`SyncProject` empty, Abyss off, interval 300s → full list pull into test vault (`open` for settings UX).
  - Root notes `Inbox.md`, `Projects.md`, etc. + empty numbered stubs created in test vault only (`mitigated` by copy isolation).
- To Be Done: Re-apply SyncTag `tts-test` + raise interval in UI before next sync; disable plugin or pause sync; decide cleanup of pulled list files in copy.
- References: `CHANGELOG.md`, `<pilot-vault>/00 Inbox/TTS-Test.md`

### Iteration 2026-10-15 11:03 UTC

- Context: Resume Abyss fork soak-test after TickTick web backup; user created Open API token.
- Target: Safe test vault with rebuilt plugin and limited-sync defaults (no full account pull).
- Actions log:
  - Rebuilt `abyss-mapping` (`npm ci` + `npm run build`).
  - Copied vault `<live-vault>` → `<pilot-vault>`.
  - Installed plugin into copy; enabled in community-plugins; registered vault in Obsidian.
  - Wrote limited-sync `data.json` (SyncTag `tts-test`, Abyss on, 24h interval) + `00 Inbox/TTS-Test.md` / `TTS-SETUP.md`.
- Validation: `npm run build` → dist `main.js`/`styles.css` OK; plugin files present under test vault plugins dir.
- Problems:
  - Open API `tp_…` token does not auth this plugin (session login only); token was pasted in chat — revoke recommended (`open`).
- To Be Done:
  - User: revoke/rotate exposed API token.
  - User: open Thinkpad-tts-test → plugin login → tag 2–3 TT tasks `tts-test` → Sync Now.
  - Observe first sync; only then widen Sync Project/Tag.
- References: `CHANGELOG.md`, `TODO.md`, `ABYSS_MAPPING.md`, `<pilot-vault>/00 Inbox/TTS-SETUP.md`
