# #104 analyst re-pass — F1 merge hint missing on `behindComments`

## Meta

| Field | Value |
|-------|--------|
| Date (UTC) | 2026-10-24 |
| Issue | [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) |
| Cases | **TP-COMMENT-TT-DELETE**, **BUG-COMMENT-DELETE-REPOST** |
| Live | Owner re-prove **fail** on **2.0.87** (`тест-абис-таск` / `commetn 1`); prior agent “pass” void (`bug-prove-twice`) |

## Do we have enough sync process info?

**Yes for routing.** [ANALYST_REFERENCE_DIAGRAMS.md](../../../ANALYST_REFERENCE_DIAGRAMS.md) §2 / §2b / §3 cover Synchronize order and open-note flush. **Incomplete for TT-DELETE:** they did not show that vault merge needs `__ticktickComments`, and that only `preparePersistNetwork` built it.

## Live fail timeline (owner ~03:57Z)

```mermaid
sequenceDiagram
  participant U as User
  participant TT as TickTick
  participant VSC as VaultSyncCoordinator
  participant FO as fileOperation_NewFileMap
  participant Merge as mergeAbyssBlock
  participant Flush as flushActiveFilePush
  participant Create as syncAbyssCommentsToTickTick

  U->>TT: delete comment
  U->>VSC: Synchronize
  VSC->>VSC: GET comments empty
  VSC->>VSC: reason behindComments
  Note over VSC: sets _apiComments only
  VSC->>FO: updateTask convertToLine
  FO->>Merge: mergeAbyssBlock without __ticktickComments
  Note over Merge: deletedInTickTick null - cannot strip
  Merge-->>FO: keep vault bullet
  FO->>U: commitVaultText
  Flush->>Create: push-abyss-or-background
  Create->>TT: addTaskComment again
```

## Fail points

| ID | Where | What |
|----|--------|------|
| **F1 (root)** | `VaultSyncCoordinator.vaultLineBehindTask` on `behindComments` | Sets `_apiComments` but never `__ticktickComments` (`knownBodies` / `apiBodies` / `remoteCommentCount`). `NewFileMap.updateTask` → `mergeAbyssBlock` without hint → no strip. |
| **F1b** | `dropStaleStageTags` | `{ ...task, tags }` drops non-enumerable `__ticktickComments` / `_apiComments` when stage tags rewrite — hint never reaches merge even after F1 attach. |
| **F2 (secondary)** | `flushActiveFilePush` → `syncAbyssCommentsToTickTick` | After keep, flush re-POSTs. Should be moot once strip lands. |

## Hypotheses for developer

| ID | Expected | Test |
|----|----------|------|
| **H5** | `behindComments` attaches the same merge hint `preparePersistNetwork` builds before vault write | `vaultCommentBehind.test.ts` — empty GET + single mapped miss → `__ticktickComments` present (needs count mismatch to probe; matched count idle-skips GET) |
| **H6** | Hint strips vault bullet so flush has nothing to re-POST | `mergeAbyssBlock` with that hint; live prove twice |

## Prior H1–H4

Still valid for create gate + merge strip **when hint is present**. See [104-analyst-hypothesis.md](104-analyst-hypothesis.md). Live **2.0.87** agent pass voided by owner second proof.

## Next

Implement H5 (reconcile → merge hint only). Prove live **twice** (two tasks) before close #104.
