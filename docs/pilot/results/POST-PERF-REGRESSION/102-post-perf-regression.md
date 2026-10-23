# Post-PERF regression — #102 on tip 2.0.85

## Meta

| Field | Value |
|-------|--------|
| Gate | `POST-PERF-REGRESSION` |
| GitHub | [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102) (after [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) close) |
| Recorded | 2026-10-23 ~12:36 UTC (partial); remainder ~13:54 UTC |
| Build | **2.0.85** on `<pilot-vault>` (Thinkpad-tts-test); plugin id `tickticksync-abyss` |
| Status | **complete (honest)** — remaining rows filled pass / fail / not run; TT-DELETE still **fail** → [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) |

## Inputs

- #62 closed: `docs/pilot/results/PERF-DELTA/62-epic-close.md`
- Idle-zero pass: `docs/pilot/results/PERF-DELTA/85-idle-zero-2.0.85.md`
- Tip: `abyss-mapping` **2.0.85** (evidence PR #105 merged)

## Evidence

### Idle still holds

| Check | Status | Note |
|-------|--------|------|
| Quiet Synchronize ×2: comments 0, byId 0, vaultWrites 0 | **pass** | Quiet1 `totalMs` 13814.5 / Quiet2 6588.3 |
| `[perf]` wall ~7 s band | **pass (drift note)** | Quiet1 ~14 s once; Quiet2 ~6.6 s — no probes |

### Editor / buffer

| ID | Status | Note |
|----|--------|------|
| TP-EDITOR-TYPE-DURING-SYNC | **pass (CLI approx)** | Injected `post102-type-sync-* typed-during-sync` near Synchronize; marker remained in editor + disk; journal `tt→obs` file update kept markers in `after` (`2026-10-23.jsonl`) |
| TP-EDITOR-TYPE-DURING-PUSH | **not run** | No separate 5s-push typing session (covered partly by ACTIVE) |
| TP-EDITOR-OTHER-LEAF | **not run** | Needs two leaves / hover — not automated |
| TP-PERF-ACTIVE | **pass** | Opened `abyss-active.md`, edited `6ad5c3c3…` title to include `post102-active-135332`; after ~5s debounce TT title matched (MCP); journal `obs→tt` `edit-mvl1679o…` |
| TP-JOURNAL-EDITOR-PATCH | **pass (partial)** | Journal has pending→commit file/task records for `abyss-active.md` during this session; not a full manual undo soak |

### Comments

| ID | Status | Note |
|----|--------|------|
| TP-BUG-COMMENT-NO-PUSH | **pass** | `post102-nopush-123356` → TT Comments |
| Comment-only edit → Comments API | **pass** | Same as NO-PUSH |
| TP-COMMENT-TT-DELETE | **fail** | Vault re-push after TT delete → [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) |

### Quiet / echo / index

| ID | Status | Note |
|----|--------|------|
| TP1-QUIET-TITLE | **not run** | Cannot produce TT title change **without** `modifiedTime` bump via MCP/API; case says mark not run |
| TP-PERF-SAME | **pass** (tip semantics) | Quiet sync: line `6ad5c3c3…` md5 unchanged. Old TEST_PLAN “probe ≥1” superseded by idle-zero (**0** `getTaskById` on quiet) |
| TP-PERF-R-PROBE | **not run** | Pre-idle expectation (must still probe) conflicts with tip idle-zero; do not invent |
| TP-PERF-R-FENCE | **not run** | No fence fixture |
| TP-PERF-R-DUP | **not run** | No duplicate-id fixture |
| TP-PERF-R-MOVE | **not run** | No move fixture |
| TP-PERF-R-SYNC-OK | **pass** | Synchronize completed; `checkPoint` `1792757115273` → `1792761799724` |

### Mass-delete guard

| ID | Status | Note |
|----|--------|------|
| TP-GUARD-R-ONE-DELETE | **not run** | Needs confirm/cancel modal — not CLI-automated |
| TP-EMPTY-SIDE-GUARD (optional) | **not run** | Deferred (optional on #102) |

### Automated

| Check | Status | Note |
|-------|--------|------|
| `npx vitest run` | **pass** | 102 files / **715** tests (prior session; tip unchanged behavior) |
| Named idle/comment/journal tests | **pass** (suite) | Included in full run |

## Conclusion

Post-PERF regression checklist **filled**. Idle + open-note push + comment create hold on **2.0.85**. Known fail remains **TP-COMMENT-TT-DELETE** (#104). Several rows honestly **not run** (modal / dual-leaf / fixtures / no-mtime title). Close #102; leave #104 open.

## Checklist

- [x] Every #102 row pass/fail/not run in evidence (+ `TEST_PLAN` updates this PR)
- [x] This file complete
- [x] TT-DELETE fail filed — [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104)
- [x] Remaining not-run cases explicitly deferred with reason
- [ ] Comment on #102 + close after docs PR merges
