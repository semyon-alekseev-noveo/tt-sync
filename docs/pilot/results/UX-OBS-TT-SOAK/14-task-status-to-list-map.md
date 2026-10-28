# 14 — Abyss task status → TickTick list map (owner-clarified)

## Meta

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Topic | Owner-clarified checkbox status → TTS-* list map |
| Vault | Thinkpad-tts-test (pilot) |
| Plugin | tickticksync-abyss **2.0.94+** (statusListMappings PR) |
| Abyss | `abyss-tasks/data.json` → `taskStatuses` |
| Status | **done** (code #182; pilot smoke in `16-status-map-prove.md`) |
| When | 2026-10-27 |

## Inputs

- Owner clarification (full map): **`[!]` → TTS-nextAction** (next); **`[/]` → TTS-WIP**; **`[?]` → TTS-waitingFor**; **`[=]` → TTS-Planned**; **`[~]` → TTS-someDay**; **`[ ]` → TTS-Inbox**; **`[x]` / `[-]`** → complete / cancel. Project statuses out of scope. Follow-up (Abyss settings as the status source, including project statuses): [#185](https://github.com/semyon-alekseev-noveo/tt-sync/issues/185), spec `docs/pilot/UX-ABYSS-STATUS-SRC.md` (not a prove).
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
- [x] Pilot smoke `[!]` + `[/]` after install — **pass** ×2 (`16-status-map-prove.md`)

## Conclusion

Full owner map implemented in plugin via `statusListMappings`. Pilot smoke after #182 install: **pass** ×2 — see `16-status-map-prove.md`.
