# 14 — Abyss task status → TickTick list map (owner-clarified)

## Meta

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Topic | Owner-clarified checkbox status → TTS-* list map |
| Vault | Thinkpad-tts-test (pilot) |
| Plugin | tickticksync-abyss **2.0.94+** (statusListMappings PR) |
| Abyss | `abyss-tasks/data.json` → `taskStatuses` |
| Status | **implementing** (TTS-WIP created; cases + code) |
| When | 2026-10-27 |

## Inputs

- Owner clarification (full map): **`[!]` → TTS-nextAction** (next); **`[/]` → TTS-WIP**; **`[?]` → TTS-waitingFor**; **`[=]` → TTS-Planned**; **`[~]` → TTS-someDay**; **`[ ]` → TTS-Inbox**; **`[x]` / `[-]`** → complete / cancel. Project statuses out of scope.
- TickTick MCP: **TTS-WIP** created `6ae0bc8d8f08408071531645`; added to pilot `syncedLists`.
- Settings shape: `statusListMappings` (symbol → listId), distinct from `statusMappings` (char → TT tag).

## Owner-clarified mapping (full table)

| Abyss status | Symbol | → TickTick | Notes |
|--------------|--------|------------|--------|
| To-do | `[ ]` | **TTS-Inbox** | Default / capture |
| In progress | `[/]` | **TTS-WIP** | List created |
| next | `[!]` | **TTS-nextAction** | Rename pilot custom waiting→next; keep `!` |
| waiting | `[?]` | **TTS-waitingFor** | Add Abyss custom |
| planned | `[=]` | **TTS-Planned** | Add Abyss custom |
| someday | `[~]` | **TTS-someDay** | Add Abyss custom |
| Done | `[x]` | *(not a list)* | **Complete** TT task |
| Cancelled | `[-]` | *(not a list)* | **Cancel** (keep last list) |

Pull: TTS-Inbox → `[ ]`; TTS-WIP → `[/]`; TTS-nextAction → `[!]`; TTS-waitingFor → `[?]`; TTS-Planned → `[=]`; TTS-someDay → `[~]`; completed → `[x]`; cancelled → `[-]`.

## `#gtd/*` after cutover

Status wins for list; strip `#gtd/next|waiting|planned|someday` on sync rewrite. Dual tag+status routing rejected. SyncTag `#tts-test` unchanged. AF-5 `#gtd/next` remains only when `statusListMappings` is empty.

## Checklist

- [x] TTS-WIP created + synced (`6ae0bc8d8f08408071531645`)
- [x] AF cases + implementation (`UX-STATUS-MAP-*`, `statusListMappings`)
- [ ] Abyss: rename `!` waiting→next; add `[?]` `[=]` `[~]`
- [ ] Migrate vault lines that should stay waiting: `[!]` → `[?]`
- [ ] Pilot smoke `[!]` + `[/]` after install

## Conclusion

Full owner map implemented in plugin via `statusListMappings`. Pilot smoke after install **not run**.
