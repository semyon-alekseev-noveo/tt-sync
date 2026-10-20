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
- **Next execution order:** Steps 1–8 in `ABYSS_FIRST_PLAN.md`. Abyss Inbox in the plugin is the stage tag `#inbox` (§3.1). Untagged Abyss Inbox is still an open vault setting. Birth tag `#obsidian` stays.
- **Sync research (2026-10-20):** `docs/TICKTICK_DELTA_API.md` — delta has no comments; echo suppression in `pull.ts` uses `etag`; idle sync does not call `getTaskById` per quiet task.
- **Deletion guard (2026-10-20):** over-threshold or empty-side deletions are held and the checkpoint stays. Defaults: guard on, more than 10 tasks and more than 20%, startup delay 30s. Pilot cases in `TEST_PLAN.md` are not run.
- **Redo:** journal `<vault>/.tickticksync/journal/`; palette undo previews then applies `planUndo`. Not soaked on the live vault.

## Validation

- Build: `npm run build` in repo root; CI on `abyss-mapping` via `.github/workflows/ci.yml`.
- Unit tests: `npx vitest run` (586 on `abyss-mapping` + open PR branch; includes idle-sync `getTaskById` baseline of 3 and `BUG-COMMENT-NO-PUSH` integration test). Abyss comments → TickTick **Comments API** when `syncAbyssCommentsViaApi` (default on); descriptions stay in `content`.
- Manual pilot: **`SMOKE_TESTS.md`**. Palette: **Synchronize** only; full TT pull on plugin load. Context tags **2.0.41** (`syncNoteContextTags`).
- BRAT installs: GitHub Release assets from `.github/workflows/release.yml` (see `docs/BRAT_INSTALL.md`).
- TT cleanup verified 2026-10-16 via MCP (no `ticktick` tag left on polluted set).

## Problems

- BRAT missing settings gear when `addSettingTab` ran after async `loadSettings` or layout/sync (`resolved` in 2.0.17 — sync `addSettingTab` in `onload`, command `open-settings` fallback).
- Stub `.md` files for every TickTick list and no multi-list/folder scope (`mitigated` in code 2026-10-16; verify in Obsidian soak).
- Test vault `data.json` drifted from `PO_STATUS.md` §2 (empty Sync Tag/Project) — do not Sync now (`open`).
- First sync used unlimited defaults and polluted live TT titles/tags (`resolved` via MCP cleanup).
- Plugin session auth ≠ MCP/Open API (`mitigated` — use MCP for account ops; plugin for vault sync).
- Exposed `tp_…` token in chat — revoke if not already (`open`).

## To Be Done

1. Fast sync is `docs/TICKTICK_DELTA_API.md` §3: one `batch/check`, no per-task `getTaskById` / `getTaskComments`, echo via `etag`. PR #2 kept the probe. **2.0.52** startup still did 455 probes and 229 comment fetches. Pilot §3.5 first.
2. Revoke the exposed `tp_…` token if it is still valid.
3. Confirm Abyss Inbox is **With inbox tag** `#inbox` on the pilot. Untagged mode is still open.
4. Still open in code: GAP-COMMENT-EDIT, RISK-PULL-WINS-LOCAL, RISK-DUAL-STORE, RISK-LARGE-VAULT (id index and per-run file cache landed; the `getTaskById` probe and `ensureVaultFilesRegistered` full scan remain), TECH-START-1, `main` ↔ `services` cycle.
5. Delta pilot `TP-DELTA-*` then etag-based echo + comment pull policy per `docs/TICKTICK_DELTA_API.md` §3.2–3.3.

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
- `TODO.md`

Archive (not requirements): `GTD_SYNC_CASES.md`, `GTD_SYNC_RESEARCH.md`, `TT_ABYSS_ROADMAP.md`, `SYNC_PROJECTS_AND_SUBTASKS.md`.

Pilot notes live in the vault, not in this repo: `<pilot-vault>/00 Inbox/TTS-SETUP.md`.
