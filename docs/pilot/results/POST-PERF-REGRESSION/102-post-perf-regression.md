# Post-PERF regression — #102 on tip 2.0.85

## Meta

| Field | Value |
|-------|--------|
| Gate | `POST-PERF-REGRESSION` |
| GitHub | [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102) (after [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) close) |
| Recorded | 2026-10-23 ~12:36 UTC (agent) — **partial** |
| Build | **2.0.85** on `<pilot-vault>` (Thinkpad-tts-test); plugin id `tickticksync-abyss` |
| Status | **partial** — idle + vitest + NO-PUSH pass; TT-DELETE **fail**; editor/guard rows still not run |

## Inputs

- #62 closed: `docs/pilot/results/PERF-DELTA/62-epic-close.md` ([#103](https://github.com/semyon-alekseev-noveo/tt-sync/pull/103))
- Idle-zero pass: `docs/pilot/results/PERF-DELTA/85-idle-zero-2.0.85.md`
- Tip: `abyss-mapping` **2.0.85**

## Evidence

### Idle still holds

| Check | Status | Note |
|-------|--------|------|
| Quiet Synchronize ×2: comments 0, byId 0, vaultWrites 0 | **pass** | Quiet1 `totalMs` 13814.5 / Quiet2 6588.3; http: Projects/batch/check/Tags only |
| `[perf]` wall ~7 s band | **pass (drift note)** | Quiet1 ~14 s once; Quiet2 ~6.6 s — still no probes |

### Editor / buffer

| ID | Status | Note |
|----|--------|------|
| TP-EDITOR-TYPE-DURING-SYNC | not run | Needs live typing during sync |
| TP-EDITOR-TYPE-DURING-PUSH | not run | |
| TP-EDITOR-OTHER-LEAF | not run | |
| TP-PERF-ACTIVE | not run | |
| TP-JOURNAL-EDITOR-PATCH | not run | |

### Comments

| ID | Status | Note |
|----|--------|------|
| TP-BUG-COMMENT-NO-PUSH | **pass** | Added `post102-nopush-123356` under `gate-comment-249` (`6ad6f43a…`); after Synchronize, TT Comments had that title (id `6adb5439…`) |
| Comment-only edit → Comments API | **pass** | Same run as NO-PUSH (title unchanged) |
| TP-COMMENT-TT-DELETE | **fail** | Deleted TT comment `6adb5439…`; Synchronize **re-created** Comments entry (`6adb546f…`) and stamped vault line `2026-10-23 19:34: post102-nopush-…` instead of removing the bullet. Vault-ahead re-push, not TT-delete win. |

### Quiet / echo / index

| ID | Status | Note |
|----|--------|------|
| TP1-QUIET-TITLE | not run | |
| TP-PERF-R-PROBE / FENCE / DUP / MOVE / SYNC-OK | not run | |
| TP-PERF-SAME | not run | |

### Mass-delete guard

| ID | Status | Note |
|----|--------|------|
| TP-GUARD-R-ONE-DELETE | not run | |
| TP-EMPTY-SIDE-GUARD (optional) | not run | |

### Automated

| Check | Status | Note |
|-------|--------|------|
| `npx vitest run` | **pass** | 102 files / **715** tests |
| Named idle/comment/journal tests | **pass** (suite) | Included in full run |

## Conclusion

- Idle path still holds on tip after #62 close.
- Comment **create** path OK; **TT→vault delete** does **not** match `TP-COMMENT-TT-DELETE` — file follow-up bug (do not invent pass).
- Editor / quiet-title / guard rows remain **not run**.

## Checklist

- [ ] Every #102 row pass/fail/not run in `TEST_PLAN.md`
- [x] This file partial evidence
- [x] TT-DELETE fail filed as child bug — [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104)
- [ ] Comment on #102 with link
- [ ] Remaining not-run cases completed or explicitly deferred
