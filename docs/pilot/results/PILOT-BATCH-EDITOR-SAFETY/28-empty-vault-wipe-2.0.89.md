# #28 — BUG-COMMENT-EMPTY-VAULT-WIPE case pilot (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-BATCH-EDITOR-SAFETY` |
| GitHub | [#28](https://github.com/semyon-alekseev-noveo/tt-sync/issues/28) |
| Recorded | 2026-10-24 ~13:10 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** |

## Inputs

- Unit fix since **2.0.79** (`abyssCommentSync.test.ts`, `vaultCommentBehind.test.ts`)
- `TEST_PLAN.md` **BUG-COMMENT-EMPTY-VAULT-WIPE**
- Dedicated fixture (not shared gate notes)

## Evidence

Fixture task `wipe-28-fixture` (`6adcade3b91e021f884b9b1a`, project `6ad1abfe8f08abb10392fe45`):

1. Vault bullet `wipe28-vault-130843` → TT comment `6adcade4…` (vault-origin).
2. MCP `add_comment` `wipe28-ttonly-130843` → TT `6adcadf9…` (TT-only).
3. Brief empty-vault window then TT pull stamped both into the note (expected TT-ahead).
4. Removed **all** Abyss comment bullets under the task; **Synchronize**.
5. TT Comments after wipe: **only** `wipe28-ttonly-130843` (`6adcadf9…`). Vault-origin `wipe28-vault-130843` **gone**.
6. Quiet **Synchronize** ×2: TT-only **still present** (no mass wipe without hash-remove intent).

Vault after wipe: task line only (no comment bullets) in `00 Inbox/abyss-active.md`.

## Conclusion

Live case matches unit: wipe deletes vault-origin only; TT-only survives; empty probe / quiet sync does not delete the survivor. Close #28.

## Checklist

- [x] Case steps from `TEST_PLAN.md`
- [x] Vault-origin deleted; TT-only remains
- [x] Quiet sync does not wipe TT-only
- [x] Evidence under `PILOT-BATCH-EDITOR-SAFETY/`
