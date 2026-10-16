# Project state

## CHANGELOG vs this file

| File | Role |
|------|------|
| `CHANGELOG.md` | Append-only iteration history |
| `PROJECT_STATE.md` | Current snapshot (not a second changelog) |

## Context

- Obsidian plugin fork of [thesamim/TickTickSync](https://github.com/thesamim/TickTickSync); development repo [semyon-alekseev-noveo/tt-sync](https://github.com/semyon-alekseev-noveo/tt-sync) branch `abyss-mapping` (BRAT install; plugin id `tickticksync-abyss`).
- Auth: unofficial web session (cookie / password), **not** TickTick Open API `tp_…` tokens; Cursor MCP uses separate OAuth at `mcp.ticktick.com`.
- Live vault: `/home/sam/obsidian/Thinkpad`. Test copy: `/home/sam/obsidian/Thinkpad-tts-test`.

## Target

- **Direction (2026-10-16):** **Abyss-first** — tasks stay where Abyss puts them; TickTick mirrors tags/lists and project parents. See `ABYSS_FIRST_PLAN.md` (topology R / CASE-T4 parked).
- **Still valid:** TT **Projects** ↔ project notes under `10 Projects/`; safety: `syncedLists`, `syncScopeFolders`, manual sync.
- **Next execution order:** Steps 1–3 **B chosen** (PO 2026-10-16; `TTS-abyss-preset.json` on test vault) → verify Inbox UI → Steps 4–5 (code) → AF-* pilot (`ABYSS_FIRST_PLAN.md` §6–7).

## Validation

- Build: `npm run build` in repo root; CI on `abyss-mapping` via `.github/workflows/ci.yml`.
- BRAT installs: GitHub Release assets from `.github/workflows/release.yml` (see `docs/BRAT_INSTALL.md`).
- TT cleanup verified 2026-10-16 via MCP (no `ticktick` tag left on polluted set).
- Next soak: Projects-only / limited Sync Tag — see `PO_STATUS.md` §4.

## Problems

- BRAT missing settings gear when `addSettingTab` ran after async `loadSettings` or layout/sync (`resolved` in 2.0.17 — sync `addSettingTab` in `onload`, command `open-settings` fallback).
- Stub `.md` files for every TickTick list and no multi-list/folder scope (`mitigated` in code 2026-10-16; verify in Obsidian soak).
- Test vault `data.json` drifted from `PO_STATUS.md` §2 (empty Sync Tag/Project) — do not Sync now (`open`).
- First sync used unlimited defaults and polluted live TT titles/tags (`resolved` via MCP cleanup).
- Plugin session auth ≠ MCP/Open API (`mitigated` — use MCP for account ops; plugin for vault sync).
- Exposed `tp_…` token in chat — revoke if not already (`open`).

## To Be Done

1. Vault: Step 3.2 — confirm Abyss Inbox with `taskIgnoreQuery` (reload Obsidian on test vault).
2. Vault: Step 2 **done** on `Thinkpad-tts-test` (see `ABYSS_FIRST_PLAN.md` Step 2 table).
3. Engineering: Steps 4–5 — no line relocate; P6 fix; optional AF-* doc.
4. Pilot: Step 7 — AF-* on `Thinkpad-tts-test` before live vault.

## References

- `ABYSS_FIRST_PLAN.md`
- `GTD_SYNC_CASES.md`
- `GTD_SYNC_RESEARCH.md`
- `CHANGELOG.md`
- `PO_STATUS.md`
- `TODO.md`
- `ABYSS_MAPPING.md`
- `/home/sam/obsidian/Thinkpad-tts-test/00 Inbox/TTS-SETUP.md`
