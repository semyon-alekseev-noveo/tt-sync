# Changelog

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
  - Copied `dist/` to `/home/sam/obsidian/Thinkpad-tts-test/.obsidian/plugins/tickticksync/`.
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
- References: `CHANGELOG.md`, `src/autoLogin.ts`, `src/main.ts`, `src/projectsVersion.ts`, `src/ui/settings/svelte/AccessControlLogin.svelte`, `/home/sam/obsidian/Thinkpad-tts-test/.obsidian/plugins/tickticksync/data.json`

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
- References: `CHANGELOG.md`, `GTD_SYNC_RESEARCH.md`, `PO_STATUS.md`, `/home/sam/obsidian/Thinkpad-tts-test/.obsidian/plugins/tickticksync/data.json`

### Iteration 2026-10-16 05:35 UTC

- Context: Owner answered GTD research §9; pilot can use isolated TickTick lists.
- Target: Record decisions; create `TTS-*` lists; align test vault hub path.
- Actions log: Updated `PO_STATUS.md` §6 confirmations; MCP `create_project` for seven `TTS-*` lists; `newTasksFile` → `00 Inbox/TickTick-capture.md`; wrote `00 Inbox/TTS-PILOT.md` in test vault.
- Validation: TickTick MCP returned ids for all seven lists.
- Problems: `tagListMappings` still target production list names until soak remapped (`open`).
- To Be Done: Implement G1 + `syncedLists`; remap pilot to `TTS-*`; `projectTemplatePath` for MOC template.
- References: `CHANGELOG.md`, `PO_STATUS.md`, `GTD_SYNC_RESEARCH.md`, `/home/sam/obsidian/Thinkpad-tts-test/00 Inbox/TTS-PILOT.md`

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
- References: `CHANGELOG.md`, `/home/sam/obsidian/Thinkpad-tts-test/.obsidian/plugins/tickticksync/data.json`

### Iteration 2026-10-15 11:12 UTC

- Context: User ran first sync on Thinkpad-tts-test after login.
- Target: Assess limited-sync soak result and real-vault safety.
- Actions log: Inspected `data.json`, `TTS-Test.md`, new root project notes, backup CSV; compared real Thinkpad vault.
- Validation: Local samples A/B got `ticktick_id` + Inbox links; ~123 `ticktick_id` lines across 8 files; real vault has no TTS plugin / no `Inbox.md`.
- Problems:
  - Sync limits wiped: `SyncTag`/`SyncProject` empty, Abyss off, interval 300s → full list pull into test vault (`open` for settings UX).
  - Root notes `Inbox.md`, `Projects.md`, etc. + empty numbered stubs created in test vault only (`mitigated` by copy isolation).
- To Be Done: Re-apply SyncTag `tts-test` + raise interval in UI before next sync; disable plugin or pause sync; decide cleanup of pulled list files in copy.
- References: `CHANGELOG.md`, `/home/sam/obsidian/Thinkpad-tts-test/00 Inbox/TTS-Test.md`

### Iteration 2026-10-15 11:03 UTC

- Context: Resume Abyss fork soak-test after TickTick web backup; user created Open API token.
- Target: Safe test vault with rebuilt plugin and limited-sync defaults (no full account pull).
- Actions log:
  - Rebuilt `abyss-mapping` (`npm ci` + `npm run build`).
  - Copied vault `/home/sam/obsidian/Thinkpad` → `/home/sam/obsidian/Thinkpad-tts-test`.
  - Installed plugin into copy; enabled in community-plugins; registered vault in Obsidian.
  - Wrote limited-sync `data.json` (SyncTag `tts-test`, Abyss on, 24h interval) + `00 Inbox/TTS-Test.md` / `TTS-SETUP.md`.
- Validation: `npm run build` → dist `main.js`/`styles.css` OK; plugin files present under test vault plugins dir.
- Problems:
  - Open API `tp_…` token does not auth this plugin (session login only); token was pasted in chat — revoke recommended (`open`).
- To Be Done:
  - User: revoke/rotate exposed API token.
  - User: open Thinkpad-tts-test → plugin login → tag 2–3 TT tasks `tts-test` → Sync Now.
  - Observe first sync; only then widen Sync Project/Tag.
- References: `CHANGELOG.md`, `TODO.md`, `ABYSS_MAPPING.md`, `/home/sam/obsidian/Thinkpad-tts-test/00 Inbox/TTS-SETUP.md`
