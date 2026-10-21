# Phase 1 — Which sync path runs

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-GATE-TEST-11-12` |
| GitHub | [tt-sync #11](https://github.com/semyon-alekseev-noveo/tt-sync/issues/11) |
| Recorded | 2026-10-21 UTC (agent) |
| Build | **2.0.72** |
| Status | **open** (hypothesis written; Phase 2 not started) |

## Inputs

- [10-phase-0-baseline.md](10-phase-0-baseline.md)

## Path decision

| Path | Name | Verdict |
|------|------|---------|
| A | Pre-pull `sweepAbyssCommentsInFile` | Unlikely primary failure in captured window (no comment journal for this task) |
| **B** | Reconcile `vaultLineBehindTask` | **Active** — trace shows `vault-comments-ahead` → `behindComments` → `in-sync` |
| C | Pull `preparePersistNetwork` | Tag/metadata pulls only; not the missing Comments API push |

## Hypothesis

1. `vaultHasUnpushedCommentThreads` is **true** (vault bullets, empty GET, stale maps / `commentCount` drift).
2. Reconcile calls `syncAbyssCommentsToTickTick`, but `planCommentSync` may treat threads as **linked** via stale Dexie maps → **`vaultOnly` empty** → no `addTaskComment` → `changed === false`.
3. In `VaultSyncCoordinator.vaultLineBehindTask`, when `vaultWantsPush && !pushedVaultComments`, only `log.warn` — then returns **`in-sync`** (no `behindComments`, no retry).

## Primary case for Phase 2

**`BUG-COMMENT-RECONCILE-UPDATE`** — extend: vault still ahead of TT after a no-op push must **not** report `in-sync`.

## Suggested fix direction (minimal)

- If `vaultWantsPush && !pushedVaultComments` after push → `vault-comments-ahead` or equivalent (force re-probe / unstick maps so `vaultOnly` is non-empty).
- Regression test: stale maps + empty API → must POST or not return `in-sync`.

## Checklist

- [x] `2026-10-21.md` in scope / reconcile traces for that path
- [x] Path **B** marked as active
- [x] `addTaskComment` global vs empty TT for this task documented
- [x] Primary `BUG-*` linked
- [x] Hypothesis paragraph (above)

## Conclusion

Proceed to **Phase 2** ([#12](https://github.com/semyon-alekseev-noveo/tt-sync/issues/12)): failing test + coordinator / `planCommentSync` fix per hypothesis. Optional: close #10 after manual sync + console.
