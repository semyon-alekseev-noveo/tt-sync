# Project state

## CHANGELOG vs this file

| File | Role |
|------|------|
| `CHANGELOG.md` | Append-only iteration history |
| `PROJECT_STATE.md` | Current snapshot (not a second changelog) |

## Context

- Obsidian plugin fork of [thesamim/TickTickSync](https://github.com/thesamim/TickTickSync); branch `abyss-mapping` for Abyss Tasks compatibility.
- Auth: unofficial web session (cookie / password), **not** TickTick Open API `tp_…` tokens; Cursor MCP uses separate OAuth at `mcp.ticktick.com`.
- Live vault: `/home/sam/obsidian/Thinkpad`. Test copy: `/home/sam/obsidian/Thinkpad-tts-test`.

## Target

- **Approved:** TT list **Projects** ↔ Obsidian project notes (project-scheme template under `10 Projects/`).
- Sync: interval 0. Enabling the plugin does not sync. Next: set options, then Sync now.
- GTD scope (implemented, not yet soaked): `syncedLists` allow-list (empty = pull nothing), `syncScopeFolders` push scope, `projectTemplatePath`; settings in Sync Control → "GTD and projects".

## Validation

- Build: `npm run build` in repo root.
- TT cleanup verified 2026-10-16 via MCP (no `ticktick` tag left on polluted set).
- Next soak: Projects-only / limited Sync Tag — see `PO_STATUS.md` §4.

## Problems

- Stub `.md` files for every TickTick list and no multi-list/folder scope (`mitigated` in code 2026-10-16; verify in Obsidian soak).
- Test vault `data.json` drifted from `PO_STATUS.md` §2 (empty Sync Tag/Project) — do not Sync now (`open`).
- First sync used unlimited defaults and polluted live TT titles/tags (`resolved` via MCP cleanup).
- Plugin session auth ≠ MCP/Open API (`mitigated` — use MCP for account ops; plugin for vault sync).
- Exposed `tp_…` token in chat — revoke if not already (`open`).

## To Be Done

1. Owner confirms `PO_STATUS.md` §6 and the open questions in `GTD_SYNC_RESEARCH.md` §9.
2. (done in code) GTD MVP: no stub files, `syncedLists`, `syncScopeFolders`, settings UI. Remaining: wire or drop reverse `projectMappings`.
3. Projects-only / GTD soak on Thinkpad-tts-test with `TTS-*` lists (install new build first).
4. Remaining items in `TODO.md` after that soak.

## References

- `GTD_SYNC_RESEARCH.md`

- `CHANGELOG.md`
- `PO_STATUS.md`
- `TODO.md`
- `ABYSS_MAPPING.md`
- `/home/sam/obsidian/Thinkpad-tts-test/00 Inbox/TTS-SETUP.md`
