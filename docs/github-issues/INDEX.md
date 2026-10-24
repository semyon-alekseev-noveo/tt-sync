# GitHub issues — open epics (tt-sync)

Tracker issues live on [`semyon-alekseev-noveo/tt-sync`](https://github.com/semyon-alekseev-noveo/tt-sync/issues). Long evidence lives under [`docs/pilot/results/`](../pilot/results/) — not in issue comments.

**Release tip (2026-10-24):** track **2.0.89** after release PR merges (ships [#120](https://github.com/semyon-alekseev-noveo/tt-sync/pull/120) API-seed comment map upsert / #104). Prior: **[2.0.88](https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.88)**.

## Status table (audit 2026-10-22)

| Epic / issue | GitHub | Priority | Status | Audit |
|--------------|--------|----------|--------|-------|
| PILOT-GATE-TEST-11-12 | [#14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14) | P0 | **closed / pass** (**2.0.74**) | keep closed |
| Phase 0–3 (comment gate) | [#10](https://github.com/semyon-alekseev-noveo/tt-sync/issues/10)–[#13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) | P0 | **closed** | keep closed |
| BUG-COMMENT-API-POST-500 | [#21](https://github.com/semyon-alekseev-noveo/tt-sync/issues/21) | P0 | **closed / pass** (**2.0.74**) | keep closed |
| BUG-COMMENT-ABYSS-VIEW | [#23](https://github.com/semyon-alekseev-noveo/tt-sync/issues/23) | P0 | **closed / pass** (**2.0.75**); on tip via **2.0.78** | keep closed |
| BUG-COMMENT-DUP-STAMP | [#25](https://github.com/semyon-alekseev-noveo/tt-sync/issues/25) | P0 | **closed / pass** (**2.0.76**); on tip via **2.0.78** | keep closed |
| BUG-COMMENT-VAULT-DUP-KEY | [#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27) | P0 | **closed / pass** (**2.0.80**) | keep closed |
| BUG-COMMENT-EMPTY-VAULT-WIPE | [#28](https://github.com/semyon-alekseev-noveo/tt-sync/issues/28) | P0 | **pass** case on **2.0.89** (unit **2.0.79**) | **done** 2026-10-24 |
| BUG-COMMENT-GET-FAIL-OPEN | [#29](https://github.com/semyon-alekseev-noveo/tt-sync/issues/29) | P0 | **pass** ×2 case on **2.0.89** (unit **2.0.79**) | **done** 2026-10-24 |
| PILOT-BATCH-EDITOR-SAFETY | [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15) | P0 | **open** (#17/#18/#28/#29 left) | **keep** — install tip **2.0.80** |
| └ open-note / editor | [#16](https://github.com/semyon-alekseev-noveo/tt-sync/issues/16) | P0 | **closed / pass** (**2.0.76**) | keep closed |
| └ EMPTY-SIDE-GUARD | [#17](https://github.com/semyon-alekseev-noveo/tt-sync/issues/17) | P0 | **pass** empty-vault on **2.0.89**; empty-ticktick not run | **done** 2026-10-24 |
| └ deferred-id | [#18](https://github.com/semyon-alekseev-noveo/tt-sync/issues/18) | P0 | **pass** on **2.0.89** | **done** 2026-10-24 |
| BUG-ACTIVEZONE-COMMENT-SHUFFLE | [#19](https://github.com/semyon-alekseev-noveo/tt-sync/issues/19) | P1 | **open** | **keep** |
| Step 7 AF-* pilot soak | [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20) | P1 | **open** | **keep** — still blocked by #15 |
| PROC-RELEASE-GATE | [#30](https://github.com/semyon-alekseev-noveo/tt-sync/issues/30) | P1 | **open** — Actions gate not encoded; **owner policy:** release only after merge to `abyss-mapping`, never retag same `2.0.x` | **keep** — see `30-proc-release-gate.md` |
| TECH-SYNC-MODULARIZATION | [#31](https://github.com/semyon-alekseev-noveo/tt-sync/issues/31) | P1 | **closed** — **2.0.77**; tip also has **2.0.78** | keep closed |
| └ PR1–PR7 | [#41](https://github.com/semyon-alekseev-noveo/tt-sync/issues/41)–[#48](https://github.com/semyon-alekseev-noveo/tt-sync/issues/48) | P1 | **closed** → PRs #34–#40 | keep closed |
| SEC-CREDS-1 | [#32](https://github.com/semyon-alekseev-noveo/tt-sync/issues/32) | P1 | **open** — owner revoke + autologin decision | **keep** (pre–Step 8) |
| Repo hygiene backlog | [#33](https://github.com/semyon-alekseev-noveo/tt-sync/issues/33) | P3 | **open** / backlog | **keep** — do not pick up before #15/#20 |
| **PERF/DELTA** (wall-time + delta path) | [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) | **P0** | **closed** — idle/wall-time on **2.0.85**; `TP-DELTA-*` → #84; evidence `PERF-DELTA/62-epic-close.md` | **done** 2026-10-23 |
| Post-PERF regression | [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102) | P1 | **complete (honest)** — checklist filled; TT-DELETE fail → #104; close after docs PR | **done** 2026-10-23 |
| └ TP-COMMENT-TT-DELETE | [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) | P1 | **closed** — **2.0.89** ships [#120](https://github.com/semyon-alekseev-noveo/tt-sync/pull/120). Tip prove×2 (API-seed + vault-first) pass before merge. **2.0.88** box fail stays historical | **closed** 2026-10-24 |
| └ Slice 2 commentCount / idle-fast / preparePersist | [#82](https://github.com/semyon-alekseev-noveo/tt-sync/issues/82) | P0 | **closed** — **2.0.82** | keep closed |
| └ Slice 3 stop double-sweep | [#83](https://github.com/semyon-alekseev-noveo/tt-sync/issues/83) | P0 | **closed** — **2.0.83**; live partial (~½ GETs) | keep closed if GH closed |
| └ Slice 4 empty-thread skip | [#94](https://github.com/semyon-alekseev-noveo/tt-sync/issues/94) | P0 | **closed** — **2.0.84**; live comments **0** | keep closed |
| └ Slice 5 cut quiet `getTaskById` | [#98](https://github.com/semyon-alekseev-noveo/tt-sync/issues/98) | P0 | **closed** — **2.0.85** live byId **0** | keep closed |
| └ Pilot TP-DELTA-* | [#84](https://github.com/semyon-alekseev-noveo/tt-sync/issues/84) | P1 | **complete (honest)** — MCP pass; app UI not run; evidence `PERF-DELTA/84-tp-delta-pilot.md` | **done** 2026-10-23 |
| └ Re-pilot TP-IDLE-ZERO | [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) | P0 | **pass** on **2.0.85** — close | **done** 2026-10-23 |
| └ TECH-START-1 / register scan | [#86](https://github.com/semyon-alekseev-noveo/tt-sync/issues/86) | P2 | **open** | **new** 2026-10-23 |
| └ Per-phase `[perf]` comment counters | [#87](https://github.com/semyon-alekseev-noveo/tt-sync/issues/87) | P2 | **unit done** — `commentsByPhase` on tip | **fix** 2026-10-23 |
| Sync product risks cluster | [#63](https://github.com/semyon-alekseev-noveo/tt-sync/issues/63) | P1 | **open** — GAP-COMMENT-EDIT, RISK-PULL-WINS-LOCAL, RISK-DUAL-STORE, BUG-TICKTICK-ID-LEAK | **new** 2026-10-22 |
| Pilot vault config | [#64](https://github.com/semyon-alekseev-noveo/tt-sync/issues/64) | P1 | **pass** on **2.0.89** — Abyss Inbox tag `#inbox`; SyncTag/`syncedLists` hardened | **done** 2026-10-24 |
| NOTE-L3b / BUG-COMMENT-NO-PUSH recheck | [#65](https://github.com/semyon-alekseev-noveo/tt-sync/issues/65) | P1 | **pass** ×2 on **2.0.89** — `NOTE-L3B-RECHECK/65-note-l3b-2.0.89.md` | **done** 2026-10-24 |
| Post-#31 modularization follow-on | [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66) | P2 | **open** — timed `vaultDeletion` / TickTickService extract; TECH-API-1 note | **new** 2026-10-22 |
| DOC-SYNC tip alignment | [#77](https://github.com/semyon-alekseev-noveo/tt-sync/issues/77) | P1 | **docs PR** — version pointers + Steps 4–6 + editor-safety rows | **in progress** 2026-10-23 |

**Closed this audit:** none (nothing newly obsolete after #55).

**Filed 2026-10-22 (backlog gaps):** #62–#66. Intentionally **not** filed: DEL-3 / CTX-D2 (stay under Step 7 / #20); items already on #15/#17–#20/#28–#33.

## Templates

| File | Maps to |
|------|---------|
| `00–04-*.md` | Epic #14 / phases #10–#13 |
| `10-epic-editor-safety.md` | #15 |
| `11-verify-open-note-editor.md` | #16 |
| `12-verify-empty-side-guard.md` | #17 |
| `13-verify-deferred-id.md` | #18 |
| `15-bug-activezone-comment-shuffle.md` | #19 |
| `20-epic-step7-af-soak.md` | #20 |
| `30-proc-release-gate.md` | #30 |
| `BUG-COMMENT-DUP-STAMP.md` | #25 |
| `BUG-COMMENT-VAULT-DUP-KEY.md` | #27 |

## Naming

Product roadmap phases are **Steps 1–8** in `ABYSS_FIRST_PLAN.md` (not “modules”). Pilot-gate checklists may use Phase 0–3 **inside one gate** only.
