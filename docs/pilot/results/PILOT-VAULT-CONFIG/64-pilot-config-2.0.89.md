# #64 — Pilot vault config verify (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-VAULT-CONFIG` |
| GitHub | [#64](https://github.com/semyon-alekseev-noveo/tt-sync/issues/64) |
| Recorded | 2026-10-24 ~12:58 UTC |
| Build | **2.0.89** (`tickticksync-abyss`) on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** |

## Inputs

- `ABYSS_FIRST_PLAN.md` §3.1 — Abyss Inbox **With inbox tag** `#inbox`
- `PO_STATUS.md` hardened test-vault keys (`SyncTag` `tts-test`, non-empty `syncedLists`, `projectSchemeEnabled`)
- Vault preset note `00 Inbox/TTS-data-preset.json` (SyncTag + syncedLists align)

## Evidence

Read via Obsidian CLI `eval` (redacted; no tokens/paths in this file).

### 1. Abyss Inbox `#inbox`

Plugin `abyss-tasks` `data.json`:

- `inbox.mode` = `"tag"`
- `inbox.tag` = `"#inbox"`
- `inbox.removeTagOnAssign` = `true`

Matches §3.1 Option A (**With inbox tag** `#inbox`).

### 2. TickTickSync `data.json` (not drifted / Sync safe)

| Key | Observed |
|-----|----------|
| `version` | `2.0.89` |
| `SyncTag` | `tts-test` (not empty) |
| `syncedLists` | TTS-Inbox, TTS-nextAction, TTS-Planned, TTS-waitingFor, TTS-someDay, TTS-Projects |
| `projectSchemeEnabled` | `true` |
| `stopInjectingTickTickTag` | `true` |
| `fileLinksInTickTick` | `noLink` |
| `enableFullVaultSync` | `false` |
| `syncScopeFolders` | `00 Inbox/`, `10 Projects/`, `30 Tasks/` |
| `syncAbyssCommentsViaApi` | `true` |
| `gtdStageVia` | `list` |
| `tagListMappings` | type/next|planned|waiting|someday → TTS-* |

Preset `00 Inbox/TTS-data-preset.json` has the same `SyncTag` and `syncedLists` set. Empty Sync Tag / unlimited pollution path is **not** present.

## Conclusion

Both #64 checklist items hold on Thinkpad-tts-test under **2.0.89**. Safe to Synchronize on this pilot (lists scoped). Close #64 after docs PR merges.

## Checklist

- [x] Pilot Abyss: Inbox = With inbox tag `#inbox`
- [x] Test vault `data.json` matches hardened §2 / preset; Sync safe
- [x] `PO_STATUS.md` / `PROJECT_STATE.md` Problems rows updated (this PR)
