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

## Target

- **Direction (2026-10-16):** **Abyss-first** — tasks stay where Abyss puts them; TickTick mirrors tags/lists and project parents. See `ABYSS_FIRST_PLAN.md` (topology R / CASE-T4 parked).
- **Still valid:** TT **Projects** ↔ project notes under `10 Projects/`; safety: `syncedLists`, `syncScopeFolders`, manual sync.
- **Next execution order:** Steps 1–8 in `ABYSS_FIRST_PLAN.md`. Comment gate **pass** through **2.0.76** (**BUG-COMMENT-DUP-STAMP** #25). Next P0 pilot batch: **PILOT-BATCH-EDITOR-SAFETY** (#15–#18). Abyss Inbox stage tag `#inbox` (§3.1); untagged Inbox still open. Birth tag `#obsidian` stays.
- **Sync research (2026-10-20):** `docs/TICKTICK_DELTA_API.md` — delta has no comments; echo suppression in `pull.ts` uses `etag`; idle sync does not call `getTaskById` per quiet task.
- **Deletion guard (2026-10-20):** over-threshold or empty-side deletions are held and the checkpoint stays. Defaults: guard on, more than 10 tasks and more than 20%, startup delay 30s. Pilot cases in `TEST_PLAN.md` are not run.
- **Redo:** journal `<vault>/.tickticksync/journal/`; palette undo previews then applies `planUndo`. Not soaked on the live vault.
- **Modularization (2026-10-22):** PR 1–7 landed on `abyss-mapping` (#34–#40); release **2.0.77** closes epic #31. Evidence: `docs/pilot/results/TECH-SYNC-MODULARIZATION/`. **2.0.78** re-cuts comment fixes (**2.0.75**/**2.0.76**) onto that tip. **2.0.79** released (merge #58): #28/#29 unit guards + merge collapse for #27 (twins still on disk). **2.0.80** released (merge #60): quiet-sync `vault-comment-dup-keys` rewrite; #27 closed; #28/#29 stay open unit-only. **2.0.81**–**2.0.85** PERF/DELTA slices 1–5: live **TP-IDLE-ZERO pass** on **2.0.85** (`PERF-DELTA/85-idle-zero-2.0.85.md`). Epic [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) **closed**. `TP-DELTA-*` §3.5 MCP done (#84). **2.0.86**/**2.0.87** live TT-DELETE **fail** (flush / F1); **2.0.88** ships [#118](https://github.com/semyon-alekseev-noveo/tt-sync/pull/118) F1/F1b. Box re-prove on **2.0.88** **fail** (API-seed re-POST, empty `syncedLists`; `104-live-2.0.88-box.md`). **2.0.89** ships [#120](https://github.com/semyon-alekseev-noveo/tt-sync/pull/120) API-seed comment map upsert — tip prove×2 (API-seed + vault-first) pass; #104 **closed**.

## Validation

- Build: `npm run build` in repo root; CI on `abyss-mapping` via `.github/workflows/ci.yml`.
- Unit tests: `npx vitest run` — see latest `CHANGELOG.md` iteration (includes `synchronizationInner.integration.test.ts`, store-ports guard). Abyss comments → TickTick **Comments API** when `syncAbyssCommentsViaApi` (default on); descriptions stay in `content`. v2 comment create uses webapp body (**2.0.74**, BUG-COMMENT-API-POST-500). Abyss view `vault.modify` schedules the open-note push (**2.0.75**, BUG-COMMENT-ABYSS-VIEW). Stamp/plain comment dedupe (**2.0.76**, BUG-COMMENT-DUP-STAMP); merge collapse + wipe/GET fail-closed (**2.0.79**); quiet-sync vault twin rewrite (**2.0.80**); idle matched-count reconcile skip (**2.0.81** / #79); slice 2 idle-fast + `commentCount` backfill (**2.0.82** / #82 / `TP-IDLE-ZERO-SWEEP`); slice 3 double-sweep cut (**2.0.83** / #83 / `TP-IDLE-MANUAL-SCOPE`); slice 4 empty-thread skip + `deferCommentSweep` (#94 / `TP-IDLE-EMPTY-SWEEP`); see `docs/ANALYST_REFERENCE_DIAGRAMS.md` §2b.
- Manual pilot: **`SMOKE_TESTS.md`**. Palette: **Synchronize** only; full TT pull on plugin load. Context tags **2.0.41** (`syncNoteContextTags`). PERF/DELTA evidence: `docs/pilot/results/PERF-DELTA/` (dual brief + 2.0.81/2.0.82 idle fails).
- BRAT installs: GitHub Release assets from `.github/workflows/release.yml` (see `docs/BRAT_INSTALL.md`).
- TT cleanup verified 2026-10-16 via MCP (no `ticktick` tag left on polluted set).

## Problems

- **BUG-COMMENT-DUP-STAMP** ([#25](https://github.com/semyon-alekseev-noveo/tt-sync/issues/25)): **resolved** on **2.0.76** (unit + pilot; 4 plain Comments on `task-11-16`).
- **BUG-COMMENT-VAULT-DUP-KEY** ([#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27)): **resolved** on **2.0.80** (unit + pilot; twins stay collapsed after release smoke).
- **BUG-COMMENT-EMPTY-VAULT-WIPE** ([#28](https://github.com/semyon-alekseev-noveo/tt-sync/issues/28)): **resolved** — unit **2.0.79** + case **pass** on **2.0.89** (`28-empty-vault-wipe-2.0.89.md`).
- **BUG-COMMENT-GET-FAIL-OPEN** ([#29](https://github.com/semyon-alekseev-noveo/tt-sync/issues/29)): **resolved** — unit **2.0.79** + case **pass** ×2 on **2.0.89** (`29-get-fail-open-2.0.89.md`).
- BRAT missing settings gear when `addSettingTab` ran after async `loadSettings` or layout/sync (`resolved` in 2.0.17 — sync `addSettingTab` in `onload`, command `open-settings` fallback).
- Stub `.md` files for every TickTick list and no multi-list/folder scope (`mitigated` in code 2026-10-16; verify in Obsidian soak).
- Test vault `data.json` drift vs §2 — **resolved** on Thinkpad-tts-test **2.0.89** ([#64](https://github.com/semyon-alekseev-noveo/tt-sync/issues/64); SyncTag `tts-test`, TTS-* `syncedLists`).
- First sync used unlimited defaults and polluted live TT titles/tags (`resolved` via MCP cleanup).
- Plugin session auth ≠ MCP/Open API (`mitigated` — use MCP for account ops; plugin for vault sync).
- Exposed `tp_…` token in chat — revoke if not already (`open`).

## To Be Done

1. **[P0/P1] Editor-safety / Step 7:** [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15) — [#17](https://github.com/semyon-alekseev-noveo/tt-sync/issues/17) empty-vault **pass** on **2.0.89**; next [#18](https://github.com/semyon-alekseev-noveo/tt-sync/issues/18) deferred-id; then [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20) AF soak; [#19](https://github.com/semyon-alekseev-noveo/tt-sync/issues/19) Active Zone shuffle.
2. **[done] Comment case pilots:** [#28](https://github.com/semyon-alekseev-noveo/tt-sync/issues/28) / [#29](https://github.com/semyon-alekseev-noveo/tt-sync/issues/29) **pass** on **2.0.89**.
3. Revoke the exposed `tp_…` token if still valid — [#32](https://github.com/semyon-alekseev-noveo/tt-sync/issues/32).
4. Product risks — [#63](https://github.com/semyon-alekseev-noveo/tt-sync/issues/63): GAP-COMMENT-EDIT, RISK-PULL-WINS-LOCAL, RISK-DUAL-STORE, BUG-TICKTICK-ID-LEAK.
5. TP-DELTA app-UI (optional) — [#84](https://github.com/semyon-alekseev-noveo/tt-sync/issues/84).
6. Post-#31 modularization — [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66); [#86](https://github.com/semyon-alekseev-noveo/tt-sync/issues/86).
7. [#64](https://github.com/semyon-alekseev-noveo/tt-sync/issues/64) / [#65](https://github.com/semyon-alekseev-noveo/tt-sync/issues/65) / #104 **closed**; tip **2.0.89**.

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
