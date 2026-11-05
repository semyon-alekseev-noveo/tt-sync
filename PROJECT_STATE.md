# Project state

## CHANGELOG vs this file

| File | Role |
|------|------|
| `CHANGELOG.md` | Append-only iteration history |
| `PROJECT_STATE.md` | Current snapshot (not a second changelog) |

## Context

- Obsidian plugin fork of [thesamim/TickTickSync](https://github.com/thesamim/TickTickSync); development repo [semyon-alekseev-noveo/tt-sync](https://github.com/semyon-alekseev-noveo/tt-sync) branch `abyss-mapping` (BRAT install; plugin id `tickticksync-abyss`).
- Auth: unofficial web session (cookie / password), **not** TickTick Open API `tp_…` tokens; Cursor MCP uses separate OAuth at `mcp.ticktick.com`.
- Live vault: `<live-vault>`. Test copy: `<pilot-vault>`.
- **Published tag 2.0.94:** stage **tags** → TTS lists (`tagListMappings`) — `15-release-notes-mapping.md`. **Tip after #182** (same version string until bump): when `statusListMappings` is set, checkbox symbol is SoT — pilot prove ×2 in `16-status-map-prove.md`.

## Target

- **Priority (2026-11-03):** Settings UX [#189](https://github.com/semyon-alekseev-noveo/tt-sync/issues/189) — phases closed; open **#205** re-smoke + checklist 32. Notice honesty **UX-NOTICE-*** on tip after merge. Epic [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) parked for optional [#218](https://github.com/semyon-alekseev-noveo/tt-sync/issues/218) (#208 closed).
- **Direction (2026-10-16):** **Abyss-first** — tasks stay where Abyss puts them; TickTick mirrors tags/lists and project parents. See `ABYSS_FIRST_PLAN.md` (topology R / CASE-T4 parked).
- **Still valid:** TT **Projects** ↔ project notes under `10 Projects/`; safety: `syncedLists`, `syncScopeFolders`, manual sync.
- **Next execution order:** Steps 1–8 in `ABYSS_FIRST_PLAN.md`. Comment gate **pass** through **2.0.76**. Editor-safety [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15) and Step 7 AF soak [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20) **closed**. [#19](https://github.com/semyon-alekseev-noveo/tt-sync/issues/19) Active Zone shuffle: **pass** ×2 on tip after [#134](https://github.com/semyon-alekseev-noveo/tt-sync/pull/134). Step 8 live vault still closed. Abyss Inbox stage tag `#inbox` (§3.1); untagged Inbox still open. Birth tag `#obsidian` stays.
- **UX soak (2026-10-27):** `docs/pilot/results/UX-OBS-TT-SOAK/` — qualitative; Decision #1 brief in `06-decision-ticktick-vs-abyss.md`. Tag **2.0.94** notes in `15-…`; tip status→list prove in `16-status-map-prove.md` (MAP-1/2 **pass** ×2).
- **Settings UX redesign (2026-11-03):** Epic [#189](https://github.com/semyon-alekseev-noveo/tt-sync/issues/189) — phases 0–4 eng closed (#190–#194); #205 copy shipped (#206). Remaining: owner checklist 32 / #205 re-smoke. Modal/notice review: `36-modal-notice-copy-review.md` (UX-NOTICE-*).
- **Sync research (2026-10-20):** `docs/TICKTICK_DELTA_API.md` — delta has no comments; echo suppression in `pull.ts` uses `etag`; idle sync does not call `getTaskById` per quiet task.
- **Deletion guard (2026-10-20):** over-threshold or empty-side deletions are held and the checkpoint stays. Defaults: guard on, more than 10 tasks and more than 20%, startup delay 30s. Pilot cases in `TEST_PLAN.md` are not run.
- **Redo:** journal `<vault>/.tickticksync/journal/`; palette undo previews then applies `planUndo`. Not soaked on the live vault.
- **Modularization (2026-10-22):** PR 1–7 landed; **2.0.77** closed #31. Follow-on [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66) A–G **closed** (cycle + size CI DoD; 0 exceptions). TECH-API-1 live risk stays in `PO_STATUS.md`. Releases **2.0.78**–**2.0.91** — see `CHANGELOG.md`.

## Validation

- Build: `npm run build` in repo root; CI on `abyss-mapping` via `.github/workflows/ci.yml`.
- Unit tests: `npx vitest run` — see latest `CHANGELOG.md` iteration (includes `synchronizationInner.integration.test.ts`, store-ports guard). Abyss comments → TickTick **Comments API** when `syncAbyssCommentsViaApi` (default on); descriptions stay in `content`. v2 comment create uses webapp body (**2.0.74**, BUG-COMMENT-API-POST-500). Abyss view `vault.modify` schedules the open-note push (**2.0.75**, BUG-COMMENT-ABYSS-VIEW). Stamp/plain comment dedupe (**2.0.76**, BUG-COMMENT-DUP-STAMP); merge collapse + wipe/GET fail-closed (**2.0.79**); quiet-sync vault twin rewrite (**2.0.80**); idle matched-count reconcile skip (**2.0.81** / #79); slice 2 idle-fast + `commentCount` backfill (**2.0.82** / #82 / `TP-IDLE-ZERO-SWEEP`); slice 3 double-sweep cut (**2.0.83** / #83 / `TP-IDLE-MANUAL-SCOPE`); slice 4 empty-thread skip + `deferCommentSweep` (#94 / `TP-IDLE-EMPTY-SWEEP`); see `docs/ANALYST_REFERENCE_DIAGRAMS.md` §2b.
- Manual pilot: **`SMOKE_TESTS.md`**. Palette: **Synchronize** only; full TT pull on plugin load. Context tags **2.0.41** (`syncNoteContextTags`). PERF/DELTA evidence: `docs/pilot/results/PERF-DELTA/` (dual brief + 2.0.81/2.0.82 idle fails).
- BRAT installs: GitHub Release assets from `.github/workflows/release.yml` (see `docs/BRAT_INSTALL.md`). Publish runs the CI `test` job first, requires the commit on `abyss-mapping` (pilot **Run workflow** with pre-release checked may skip that), requires tag = `manifest.json` = `package.json` = `versions.json` key, and refuses an existing Release. Live vault freezes BRAT to a non-prerelease tag. Required merge check `CI / test` is still an owner click ([#30](https://github.com/semyon-alekseev-noveo/tt-sync/issues/30)).
- TT cleanup verified 2026-10-16 via MCP (no `ticktick` tag left on polluted set).

## Problems

- **ARCH-SYNC-INTENT-IDENTITY** — **resolved** epic [#255](https://github.com/semyon-alekseev-noveo/tt-sync/issues/255) closed 2026-11-03; #256–#261 done; prove ×2 in `UX-OBS-TT-SOAK/39-…` (tip after [#269](https://github.com/semyon-alekseev-noveo/tt-sync/pull/269)). No release unless owner asks.
- **UX-SYNC-CONFIRM-REBIND** — Confirm offers Rebind (#273); live prove **not run** (`40-confirm-rebind-gap.md`).
- **BUG-CONFIRM-REBIND-DUP** — post-#273 live fail: Confirm Rebind InsertLine dups beside live same-title siblings; fix `allowDisplaceLiveSameTitle` on Confirm path (unit); re-prove **not run** (`41-confirm-rebind-dup-fail.md`).
- **BUG-OPENNOTE-DELETE-CONFIRM** — Delete/Backspace mid-edit opened PushDeleteTT Confirm (not the 5s open-note push). Fix: drop keyup `deletedTaskCheck`; re-prove **not run** (`42-opennote-delete-confirm.md`).
- **BUG-TT-DUP-CREATE-ON-STRIP-SYNC** — primary create path for same-title TT dups: multi-orphan `findOrphanByTitle` → `createTask` (journal waves 11-02/03/04). Fail-closed reattach/skip + file-scoped parent fallback; tip@`8528baa` live **fail** then **pass** ×2 (`44-tt-dup-create-prevention.md`). Confirm InsertLine = vault twins only (`41-…`).
- **BUG-TT-CREATE-PATH-BYPASS** — post-#280 create-path audit: ProjectScheme `createParent` reattach/skip; SyncMan recreate loop inert; inventory unit. Manual PKM orphan cleanup done (MCP). Pilot path-guard **not run** (`45-create-path-audit.md`).
- **BUG-LISTROOT-NOTE-PROMOTE** — Projects list-roots with `note/<slug>` and no `project` tag were promoted to `#system/project` notes (`isListRoot` without tag gate). Prevention merged #285 (`358690e` / 2.0.96): `isSchemeParentTask` rejects note-context-without-project. Live **pass** ×2 on clean fixtures (`47-listroot-note-promote.md`). Dirty dishwasher/workplace hierarchy **recovered** on pilot (`48-…`; TT nested + AZ rebound) — status `resolved`.
- **UX-SET-SYNC-MASTER-OFF** — Interval 0 ≠ sync off. Kill switch `syncEnabled` + Sync Control toggle; automatic/reactive gated; Synchronize stays. [#287](https://github.com/semyon-alekseev-noveo/tt-sync/issues/287) / [#288](https://github.com/semyon-alekseev-noveo/tt-sync/pull/288); unit + **owner live pass** (`49-ux-set-sync-master-off.md`) (`resolved`).
- **BUG-GHOST-MARKER-AFTER-RESET** — After Reset, vault `ticktick_id`s absent from TT stayed fake-live (DON-253). Fix: vault-only + TT miss → detach. Issue [#290](https://github.com/semyon-alekseev-noveo/tt-sync/issues/290); unit this tip; live re-prove **not run** (`open`).
- **BUG-CREATE-MATCH-UNDEF** — Open-note create dual Notice (created + `.match` Failed). Fix: editor-path `fileMap.replaceLines` + abyssRegionEnd guard. Issue [#291](https://github.com/semyon-alekseev-noveo/tt-sync/issues/291); unit this tip; live re-prove **not run** (`open`).
- **UX-SYNC-TT-DEDUPE** — **won't-fix / cancelled** (owner closed [#276](https://github.com/semyon-alekseev-noveo/tt-sync/issues/276)): Deduplicate UI not shipping after prevention (#279+#280+#281) + orphan cleanup; DoR **1A/2A/3A** in `43-…` remains historical.
- **ID-CHAIN** — Epic [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214): eng children closed; #208 Rematch prove ×2 **pass**/closed; optional [#218](https://github.com/semyon-alekseev-noveo/tt-sync/issues/218) keeps epic open.
- **UX-NOTICE** — create vs reattach Notices + modal cache wording: unit this tip; pilot strip-marker prove **not run** (`open`).
- **BUG-RESET-CACHE-DELETE** — post-Reset Synchronize proposed vault-line deletes for pre-wipe ids (DON-253); owner **Cancel** only. Fix on tip/PR; pilot prove ×2 pending (`UX-OBS-TT-SOAK/24-post-reset-delete-modal.md`) (`open` until prove).
- Pilot Abyss `taskIgnoreQuery: #ticktick` leftover from superseded Option B — blocks Abyss edit on TT-origin project notes (`parked` until owner needs Abyss on TT-origin / before Step 8; tip still stamps note `#ticktick`; `UX-OBS-TT-SOAK/06-…`).
- List stub mirrors under `TickTickTasksFilePath` / Dexie recreate into `zz-parked-*` — **resolved** on tip #179: code skip + pilot cleanup + prove ×2 (`UX-OBS-TT-SOAK/08-stub-cleanup-prove.md`). Optional Dexie parked-row dump not probed.
- **BUG-COMMENT-DUP-STAMP** ([#25](https://github.com/semyon-alekseev-noveo/tt-sync/issues/25)): **resolved** on **2.0.76** (unit + pilot; 4 plain Comments on `task-11-16`).
- **BUG-COMMENT-VAULT-DUP-KEY** ([#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27)): **resolved** on **2.0.80** (unit + pilot; twins stay collapsed after release smoke).
- **BUG-COMMENT-EMPTY-VAULT-WIPE** ([#28](https://github.com/semyon-alekseev-noveo/tt-sync/issues/28)): **resolved** — unit **2.0.79** + case **pass** on **2.0.89** (`28-empty-vault-wipe-2.0.89.md`).
- **BUG-COMMENT-GET-FAIL-OPEN** ([#29](https://github.com/semyon-alekseev-noveo/tt-sync/issues/29)): **resolved** — unit **2.0.79** + case **pass** ×2 on **2.0.89** (`29-get-fail-open-2.0.89.md`).
- BRAT missing settings gear when `addSettingTab` ran after async `loadSettings` or layout/sync (`resolved` in 2.0.17 — sync `addSettingTab` in `onload`, command `open-settings` fallback).
- Stub `.md` files for every TickTick list and no multi-list/folder scope (`mitigated` G1 2026-10-16; Abyss/GTD skip UX-STUB-1).
- Test vault `data.json` drift vs §2 — **resolved** on Thinkpad-tts-test **2.0.89** ([#64](https://github.com/semyon-alekseev-noveo/tt-sync/issues/64); SyncTag `tts-test`, TTS-* `syncedLists`).
- First sync used unlimited defaults and polluted live TT titles/tags (`resolved` via MCP cleanup).
- Plugin session auth ≠ MCP/Open API (`mitigated` — use MCP for account ops; plugin for vault sync).
- Exposed `tp_…` token in chat — **revoked / closed** 2026-10-25 ([#32](https://github.com/semyon-alekseev-noveo/tt-sync/issues/32)).

## To Be Done

0. **Settings #205 / checklist 32:** Agent re-smoke 2026-11-04 on tip `5be067d` / 2.0.96 (`32-…` all A–C ☑; C2 banner+unit). Owner accept → close #189 ( #205 already closed).
0a. **BUG-CONFIRM-REBIND-DUP / UX-SYNC-CONFIRM-REBIND:** merge displace fix; owner tip + Confirm Rebind prove ×2 (different fixtures); optional manual dup cleanup on journaling note.
0a2. **BUG-OPENNOTE-DELETE-CONFIRM:** merge keyup fix; owner Don’t delete if modal open; tip + prove ×2 line-delete does not Confirm.
0a3. **BUG-TT-DUP-CREATE-ON-STRIP-SYNC:** merge parent-bypass fix PR; tip already proved ×2 pass on `44-…`; unique title create still unit-covered.
0a4. **UX-SYNC-TT-DEDUPE:** **done / won't-fix** — #276 closed not planned; catalog docs cancelled; local `feat/ux-sync-tt-dedupe` stash ignore.
0a5. **BUG-LISTROOT-NOTE-PROMOTE:** tip prove ×2 **done** (`47-…`); pilot hierarchy recovery **done** (`48-…`); #284 already closed. Optional delete `zz-parked-listroot-promote-20261105/`. No release unless asked.
0a6. **UX-SET-SYNC-MASTER-OFF:** **done** — #288 merged; owner live pass (`49-…`); close #287.
0a7. **BUG-GHOST-MARKER-AFTER-RESET / BUG-CREATE-MATCH-UNDEF:** merge this fix PR; tip; live prove ×2 (detach ghosts + clean create Notice); owner strip remaining DON-253 `6ad332…` if still present (keep `6aec9007…`); no Apply once.
0b. **UX-NOTICE-***: Owner strip-marker reattach toast + Orphan glance — checklist `50-…` / `36-…`.
0c. **#214:** Optional #218 only; else close epic when owner ready.
0d. **BUG-RESET-CACHE-DELETE:** Owner Reset→Synchronize ×2 — checklist `50-…` / `25-…` (ghost detach now expected honesty).
1. Decision #1 Abyss vs `#ticktick`: **parked** (still valid; tip unchanged) — clear `taskIgnoreQuery` when Abyss+TT-origin hurts / before Step 8 (`06-…`).
2. **[done]** UX-STUB-1 / BUG-LIST-STUB-RECREATE pilot cleanup + prove ×2 after #179 (`08-stub-cleanup-prove.md`).
2b. **[done]** UX-STATUS-MAP-1/2 prove ×2 after #182 (`16-status-map-prove.md`); MAP-3/4/PULL + Abyss customs still open; version bump when owner asks.
3. **[done] Step 7 AF soak** [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20) / [#76](https://github.com/semyon-alekseev-noveo/tt-sync/issues/76) **closed**. **[done] #19**. Step 8 live vault still closed. **AF-NEST-1** **pass**. **AF-GTD-TAG-ADD** residual on **2.0.90** (Abyss sort dropped mover; full sync only) — fix on `fix/af-gtd-stage-winner-dnd` (mover-wins + 1.2s Abyss push); re-prove×2 pending.
4. **[done] Comment case pilots:** [#28](https://github.com/semyon-alekseev-noveo/tt-sync/issues/28) / [#29](https://github.com/semyon-alekseev-noveo/tt-sync/issues/29) **pass** on **2.0.89**.
5. **[done]** SEC-CREDS-1 [#32](https://github.com/semyon-alekseev-noveo/tt-sync/issues/32) — token revoke + live auth decision recorded (2026-10-25).
6. Product risks — [#63](https://github.com/semyon-alekseev-noveo/tt-sync/issues/63): GAP-COMMENT-EDIT unit (live PUT not run, #173). RISK-PULL-WINS-LOCAL [#174](https://github.com/semyon-alekseev-noveo/tt-sync/issues/174) unit (pilot not run). RISK-DUAL-STORE [#175](https://github.com/semyon-alekseev-noveo/tt-sync/issues/175) unit (pilot not run, no auto-repair) in `PO_STATUS.md`. BUG-TICKTICK-ID-LEAK mitigated in code; pilot re-scan not run.
7. TP-DELTA app-UI (optional) — [#84](https://github.com/semyon-alekseev-noveo/tt-sync/issues/84).
8. Post-#31 modularization — [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66) (slice A in PR; vaultDeletion/god remain); [#86](https://github.com/semyon-alekseev-noveo/tt-sync/issues/86).
9. [#64](https://github.com/semyon-alekseev-noveo/tt-sync/issues/64) / [#65](https://github.com/semyon-alekseev-noveo/tt-sync/issues/65) / #104 / #137 / #152 / #160 **closed**; **2.0.93** tagged; bump **2.0.94** for BRAT.
10. FEAT-NOTEBOOK MVP live **pass** ×2 — bi-di still open (#159).
11. PROC-RELEASE-GATE [#30](https://github.com/semyon-alekseev-noveo/tt-sync/issues/30): `release.yml` gate is in the PR; owner still enables required status check `CI / test` on `abyss-mapping`.

## References

Canonical:

- `DEV_FLOW.md` — process for analyst, developer, and tester
- `PO_STATUS.md`
- `ABYSS_FIRST_PLAN.md` — Steps 1–8
- `ABYSS_FIRST_CASES.md`
- `TEST_PLAN.md` — manual cases for each behavior-changing PR
- `PROJECT_STATE.md`
- `CHANGELOG.md`
- `SMOKE_TESTS.md`
- `ABYSS_NOTES_ALIGNMENT.md`
- `ABYSS_MAPPING.md`
- `docs/TICKTICK_DELTA_API.md` — delta API, echo/`etag`, comment gaps, recommended sync shape
- `docs/SYNC_MODULARIZATION.md` — module boundaries, phase list, PR 1–7 sequence
- `docs/ANALYST_REFERENCE_DIAGRAMS.md` — analyst layer diagram (bug routing)
- `TODO.md`

Archive (not requirements): `GTD_SYNC_CASES.md`, `GTD_SYNC_RESEARCH.md`, `TT_ABYSS_ROADMAP.md`, `SYNC_PROJECTS_AND_SUBTASKS.md`.

Pilot notes live in the vault, not in this repo: `<pilot-vault>/00 Inbox/TTS-SETUP.md`.
