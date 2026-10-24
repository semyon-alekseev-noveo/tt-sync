# #68 — AF-1 Empty syncedLists (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `STEP7-AF-PILOT-SOAK` |
| GitHub | [#68](https://github.com/semyon-alekseev-noveo/tt-sync/issues/68) (parent [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20)) |
| Recorded | 2026-10-24 ~13:55 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** (CLI: empty `syncedLists` → Synchronize) |

## Inputs

- `ABYSS_FIRST_CASES.md` **AF-1**
- Issue [#68](https://github.com/semyon-alekseev-noveo/tt-sync/issues/68)
- Precondition: TTS-* lists still have tasks on TickTick (TTS-Inbox undone tasks present via MCP)

## Evidence

1. Snapshot: **243** unique `ticktick_id::` markers across **49** md files; **730** vault `.md` files.
2. Set plugin `data.json` `syncedLists` → `[]`; kept `SyncTag` `tts-test`; `plugin:reload`.
3. Confirmed TTS-Inbox (`6ad1abfe8f08abb10392fe45`) still has undone tasks on TickTick.
4. Ran `tickticksync-abyss:tts-sync` (manual Synchronize). Journal sync id `sync-mvmgnuva-0-ezod` (~13:55–13:56 UTC).
5. Restored the six TTS-* `syncedLists` and reloaded.

| Check | Result |
|-------|--------|
| New `ticktick_id::` markers | **0** |
| New md files with markers | **0** |
| Vault `.md` count | **730** → **730** (no stub list files) |
| Journal `tt->obs` rows for this sync | **0** |
| Journal `tt->obs` / `op:create` for this sync | **0** |

Note: this sync still recorded some `obs->tt` task moves (vault → TickTick). AF-1 only requires that empty `syncedLists` does not write TickTick tasks **into** the vault.

## Conclusion

Empty `syncedLists` on **2.0.89** does not pull TickTick tasks into the vault (no new markers, no stub files, no `tt->obs` creates). Close #68. Continue AF-2…AF-8 under #20.

## Checklist

- [x] `syncedLists` empty + Synchronize
- [x] No new vault task lines / stub files / `tt->obs` creates
- [x] Lists restored after the run
- [x] Evidence under `STEP7-AF-PILOT-SOAK/`
