# GTD stage via Abyss checkbox statuses

**Status:** **active** (owner go 2026-10-27) — `statusListMappings` (symbol → TickTick list). Supersedes the parked “tags only” decision below for vaults that enable the map.

Symbol vocabulary is still typed in TickTickSync. Reading it from Abyss Tasks (`taskStatuses` / project statuses) is [#185](https://github.com/semyon-alekseev-noveo/tt-sync/issues/185) — spec `UX-ABYSS-STATUS-SRC.md`, **not DoR**, not this map.

## Active path (status SoT)

| Symbol | → TickTick |
|--------|------------|
| `[ ]` | TTS-Inbox |
| `[/]` | TTS-WIP |
| `[!]` | TTS-nextAction |
| `[?]` | TTS-waitingFor |
| `[=]` | TTS-Planned |
| `[~]` | TTS-someDay |
| `[x]` | complete (list unchanged) |
| `[-]` | cancel (list unchanged; optional `status/cancelled` via `statusMappings`) |

- Settings: **Status → list mapping** (`statusListMappings`). Distinct from **Status mapping** (`statusMappings` char → TT tag).
- When `statusListMappings` is non-empty and `abyssTasksFormat` is on: checkbox symbol drives list; `#gtd/*` / `tagListMappings` do **not** place the task; leftover stage tags are stripped on sync rewrite.
- SyncTag / `#tts-test` unchanged.
- Cases: `UX-STATUS-MAP-1`…`UX-STATUS-MAP-PULL` in `ABYSS_FIRST_CASES.md`. Evidence SoT: `docs/pilot/results/UX-OBS-TT-SOAK/14-task-status-to-list-map.md`.
- **AF-5** with `#gtd/next` remains for vaults with empty `statusListMappings`.

## Dual-tag behavior (document clearly)

| On the line | List placement | Vault rewrite |
|-------------|----------------|---------------|
| Symbol only (`[!]` …) | From `statusListMappings` | none for tags |
| Symbol + `#gtd/next` (etc.) | **Symbol wins**; `#gtd/*` ignored for list | Strip mapped `tagListMappings` stage tags |
| `#gtd/next` + `[ ]` | Inbox (`[ ]`), **not** nextAction | Strip `#gtd/next` |
| Empty `statusListMappings` | Legacy `tagListMappings` / AF-5 | Exclusive stage rewrite (Option A) |

## Historical note (parked 2026-10-25)

Previously: stay on **tags → lists**; revisit checkbox path only if PO abandoned tag-tree DnD. Owner chose checkbox SoT for stage lists; tag-tree stage DnD is no longer the list signal when `statusListMappings` is set.
