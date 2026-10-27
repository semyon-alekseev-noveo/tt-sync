# 16 — Status→list map prove ×2 (post-#182)

## Meta

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Cases | UX-STATUS-MAP-1, UX-STATUS-MAP-2 |
| Plugin | tickticksync-abyss **2.0.94** (manifest; **no version bump**) |
| Tip | `41d734ce73b9451ba83dcca0ab991473e88d3aad` (merge [#182](https://github.com/semyon-alekseev-noveo/tt-sync/pull/182)) |
| Vault | Thinkpad-tts-test (paths vault-relative) |
| Runner | agent (Obsidian CLI `tickticksync-abyss:tts-sync` + TickTick MCP) |
| Status | **pass** ×2 |
| Recorded | 2026-10-27 ~15:20 UTC |

## Version / tip note (vs release notes #181)

GitHub Release / tag **2.0.94** still describes **tag→list** routing (`tagListMappings`) — see [`15-release-notes-mapping.md`](15-release-notes-mapping.md).

**Tip after #182** (this install) adds `statusListMappings`. When that setting is non-empty and `abyssTasksFormat` is on, **checkbox symbol is SoT** for list placement; `#gtd/*` does not move the list. Manifest / `package.json` may still say **2.0.94** until an owner bump + release. Do not treat the published 2.0.94 zip as status-map behavior.

## Inputs

- Spec: [`14-task-status-to-list-map.md`](14-task-status-to-list-map.md)
- Merged PR: [#182](https://github.com/semyon-alekseev-noveo/tt-sync/pull/182)
- Pilot settings after install: `abyssTasksFormat=true`, SyncTag `tts-test`, `syncedLists` includes **TTS-WIP** `6ae0bc8d8f08408071531645`, `statusListMappings`:

| Char | List | listId |
|------|------|--------|
| ` ` | TTS-Inbox | `6ad1abfe8f08abb10392fe45` |
| `/` | TTS-WIP | `6ae0bc8d8f08408071531645` |
| `!` | TTS-nextAction | `6ad1abfe8f08abb10392fe46` |
| `?` | TTS-waitingFor | `6ad1abff8f0841315e870da2` |
| `=` | TTS-Planned | `6ad1abff8f087daddf8646cd` |
| `~` | TTS-someDay | `6ad1abff8f0841315e870da1` |

## Evidence

### Install

1. Fetched `tt-sync/abyss-mapping`; tip = merge #182 `41d734c`.
2. `npm run build` → `dist/{main.js,manifest.json,styles.css}` version **2.0.94**.
3. Copied into `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/`; `cmp` matched.
4. Wrote `statusListMappings` (+ TTS-WIP already in `syncedLists`); `app:reload`.

### Prove A — UX-STATUS-MAP-1 `[!]` → TTS-nextAction

| Step | Result |
|------|--------|
| Fixture | `00 Inbox/abyss-active.md`: `- [!] UX-STATUS-MAP-1 proveA 151809 #obsidian #tts-test` |
| Synchronize | `tickticksync-abyss:tts-sync` **Executed** (~15:18Z) |
| Vault line | stays in `abyss-active.md` with `%%[ticktick_id:: 6ae0c0c9ee26c61f880757c8]%%` |
| Journal | `obs->tt` create `projectId=6ad1abfe8f08abb10392fe46` (TTS-nextAction) |
| MCP `get_task_by_id` | `6ae0c0c9…` → `projectId=6ad1abfe8f08abb10392fe46` |

**Prove A: pass**

### Prove B — UX-STATUS-MAP-2 `[/]` → TTS-WIP

| Step | Result |
|------|--------|
| Fixture | different line: `- [/] UX-STATUS-MAP-2 proveB 151809 #obsidian #tts-test` |
| Synchronize | `tts-sync` **Executed** (~15:20Z) |
| Vault line | stays; id `6ae0c122ee26c61f880757c9` |
| Journal | `obs->tt` create `projectId=6ae0bc8d8f08408071531645` (TTS-WIP) |
| MCP `get_task_by_id` / `search_task` | `projectId=6ae0bc8d8f08408071531645` |

**Prove B: pass**

### Side note (not a fail for this prove)

Prove B also received `#status/in-progress` from `statusMappings` (`/` → tag). MCP showed a corrupted tag string `-tatu-in-progre-` on the TT task — separate from list routing; list placement itself matched TTS-WIP.

## Conclusion

Post-#182 tip install with non-empty `statusListMappings`: `[!]` → TTS-nextAction and `[/]` → TTS-WIP on two independent inbox fixtures. UX-STATUS-MAP-1 / -2 live **pass** ×2. Published release **2.0.94** remains tag-based until a bump ships this tip.

## Checklist

- [x] Tip #182 built and installed (version string still 2.0.94)
- [x] Pilot `statusListMappings` + TTS-WIP in `syncedLists`; SyncTag `tts-test`
- [x] Prove A `[!]` → nextAction (MCP projectId)
- [x] Prove B `[/]` → WIP (MCP projectId)
- [x] Tip-vs-release mapping note recorded (this file + INDEX)
