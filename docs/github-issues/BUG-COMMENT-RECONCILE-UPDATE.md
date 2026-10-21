# GitHub issues — BUG-COMMENT-RECONCILE-UPDATE (test-11-12)

`gh` was not available in the agent environment. Create these on **origin** (`thesamim/TickTickSync`) or **tt-sync** per your workflow.

## Issue 1 — Bug

**Title:** `BUG-COMMENT-RECONCILE-UPDATE: test-11-12 vault comments not on TickTick after 2.0.70`

**Body:**

### Repro (pilot Thinkpad-tts-test)

- File: `00 Inbox/2026-10-21.md`
- Task: `test-11-12` (`6ad83bc73e30f4429d749e09`)
- Vault: `- > new`, ISO bullets `comment 1`, `test-new-verision`
- **Synchronize** on plugin **2.0.70** → TickTick **Comments** panel empty (description `new` may sync)

### Evidence

- `write-trace.jsonl`: same `taskIds` flips `vault-comments-ahead` → `behindComments` (e.g. `2026-10-21T11:12:17Z`) while vault still has comment bullets
- MCP `add_comment` on same task succeeds (API not broken)

### Root cause

Vault-ahead without successful `syncAbyssCommentsToTickTick` incorrectly opened `behindComments` (TT→Obs pull) instead of finishing vault→TT push.

### Fix

**2.0.71** — `vaultWantsPush` gate in `VaultSyncCoordinator.vaultLineBehindTask` (see `CHANGELOG.md`).

### Labels

`bug`, `abyss`, `comments-api`

---

## Issue 2 — Work / verification

**Title:** `Verify BUG-COMMENT-RECONCILE-UPDATE on pilot (2.0.71+)`

**Body:**

- [ ] Deploy **2.0.71** to pilot plugin folder
- [ ] Reload Obsidian; confirm plugin version **2.0.71**
- [ ] **Synchronize** with `00 Inbox/2026-10-21.md`
- [ ] TickTick Comments on `6ad83bc…` include `comment 1`, `test-new-verision`
- [ ] Update `TEST_PLAN.md` row BUG-COMMENT-RECONCILE-UPDATE pilot status
- [ ] Close when verified

**Links:** `ABYSS_FIRST_CASES.md`, `TEST_PLAN.md`, case tests in `vaultCommentBehind.test.ts`, `test1112PilotRepro.test.ts`
