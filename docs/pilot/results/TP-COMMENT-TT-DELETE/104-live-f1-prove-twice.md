# #104 — live prove ×2 after F1/F1b (tip build)

## Meta

| Field | Value |
|-------|--------|
| Issue | [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) |
| Build | tip `fix/104-behindComments-merge-hint` deployed to Thinkpad-tts-test (manifest still **2.0.87** label; code has F1+F1b) |
| Date (UTC) | 2026-10-24 ~04:13–04:14 |
| Vault | Thinkpad-tts-test |
| Rule | `bug-prove-twice` — two tasks |

## Inputs

- Analyst: [104-analyst-f1-merge-hint.md](104-analyst-f1-merge-hint.md) (F1 attach hint; F1b preserve across `dropStaleStageTags`)
- Unit: H5 / H5b / H6 in `vaultCommentBehind.test.ts`

## Evidence

### Prove 1 — `gate-comment-249` (`6ad6f43a…`)

1. Vault bullet `prove104b-1-mvlvw4fd` → sync → TT comment `6adc307525d10d1f8885e673`.
2. MCP `delete_comment`.
3. Sync (note open) ×2 + flush window.

| Check | Result |
|-------|--------|
| Vault bullet gone | **pass** |
| No TT re-create | **pass** (`get_comment` empty) |

### Prove 2 — `тест-абис-таск` (`6ad97afa…`)

1. Vault bullet `prove104b-2-mvlvw4ff` → sync → TT `6adc307625d10d1f8885e674`.
2. MCP delete → sync ×2.

| Check | Result |
|-------|--------|
| Vault bullet gone | **pass** |
| No TT re-create | **pass** (`get_comment` empty) |

### write-trace

- `04:13:57–58Z` both tasks `behindComments`.
- `04:14:00Z` `commitVaultText` span `oldCount:3 → newCount:1` (strip).
- `04:14:06Z` `flushActiveFilePush` then both `in-sync` — no re-POST.

## Conclusion

**Two independent live passes** on tip F1+F1b. Safe to mark TEST_PLAN live pass after release bump; close #104 after merge + release when owner tags.

## Checklist

- [x] Prove 1
- [x] Prove 2 (different task)
- [x] Release bump **2.0.88** after #118 merge (PROC-RELEASE-GATE)
