# Changelog

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
