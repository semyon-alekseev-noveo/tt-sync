# GitHub issues — open epics (tt-sync)

Tracker issues live on [`semyon-alekseev-noveo/tt-sync`](https://github.com/semyon-alekseev-noveo/tt-sync/issues). Long evidence lives under [`docs/pilot/results/`](../pilot/results/) — not in issue comments.

**Release tip (2026-10-22):** [`abyss-mapping` @ `ad95e3e`](https://github.com/semyon-alekseev-noveo/tt-sync/commit/ad95e3e8a8cbea430c7255ddc8fcba2726e5ed4f) = merge [#55](https://github.com/semyon-alekseev-noveo/tt-sync/pull/55) → **[2.0.78](https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.78)** (modularization **2.0.77** + comment fixes **2.0.75**/**2.0.76**). Tag peel = tip.

## Status table (audit 2026-10-22)

| Epic / issue | GitHub | Priority | Status | Audit |
|--------------|--------|----------|--------|-------|
| PILOT-GATE-TEST-11-12 | [#14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14) | P0 | **closed / pass** (**2.0.74**) | keep closed |
| Phase 0–3 (comment gate) | [#10](https://github.com/semyon-alekseev-noveo/tt-sync/issues/10)–[#13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) | P0 | **closed** | keep closed |
| BUG-COMMENT-API-POST-500 | [#21](https://github.com/semyon-alekseev-noveo/tt-sync/issues/21) | P0 | **closed / pass** (**2.0.74**) | keep closed |
| BUG-COMMENT-ABYSS-VIEW | [#23](https://github.com/semyon-alekseev-noveo/tt-sync/issues/23) | P0 | **closed / pass** (**2.0.75**); on tip via **2.0.78** | keep closed |
| BUG-COMMENT-DUP-STAMP | [#25](https://github.com/semyon-alekseev-noveo/tt-sync/issues/25) | P0 | **closed / pass** (**2.0.76**); on tip via **2.0.78** | keep closed |
| BUG-COMMENT-VAULT-DUP-KEY | [#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27) | P0 | **open** (analyst; still in cases / code) | **keep** — next comment fix |
| BUG-COMMENT-EMPTY-VAULT-WIPE | [#28](https://github.com/semyon-alekseev-noveo/tt-sync/issues/28) | P0 | **open** — wipe branch still in `abyssCommentSync` | **keep** |
| BUG-COMMENT-GET-FAIL-OPEN | [#29](https://github.com/semyon-alekseev-noveo/tt-sync/issues/29) | P0 | **open** — `getTaskComments` still returns `[]` on error | **keep** |
| PILOT-BATCH-EDITOR-SAFETY | [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15) | P0 | **open** (#17/#18 left) | **keep** — retarget pilot build note to **2.0.78** |
| └ open-note / editor | [#16](https://github.com/semyon-alekseev-noveo/tt-sync/issues/16) | P0 | **closed / pass** (**2.0.76**) | keep closed |
| └ EMPTY-SIDE-GUARD | [#17](https://github.com/semyon-alekseev-noveo/tt-sync/issues/17) | P0 | **open** — pilot not run | **keep** |
| └ deferred-id | [#18](https://github.com/semyon-alekseev-noveo/tt-sync/issues/18) | P0 | **open** — pilot not run | **keep** |
| BUG-ACTIVEZONE-COMMENT-SHUFFLE | [#19](https://github.com/semyon-alekseev-noveo/tt-sync/issues/19) | P1 | **open** | **keep** |
| Step 7 AF-* pilot soak | [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20) | P1 | **open** | **keep** — still blocked by #15 |
| PROC-RELEASE-GATE | [#30](https://github.com/semyon-alekseev-noveo/tt-sync/issues/30) | P1 | **open** — Actions gate not encoded; **owner policy:** release only after merge to `abyss-mapping`, never retag same `2.0.x` | **keep** — see `30-proc-release-gate.md` |
| TECH-SYNC-MODULARIZATION | [#31](https://github.com/semyon-alekseev-noveo/tt-sync/issues/31) | P1 | **closed** — **2.0.77**; tip also has **2.0.78** | keep closed |
| └ PR1–PR7 | [#41](https://github.com/semyon-alekseev-noveo/tt-sync/issues/41)–[#48](https://github.com/semyon-alekseev-noveo/tt-sync/issues/48) | P1 | **closed** → PRs #34–#40 | keep closed |
| SEC-CREDS-1 | [#32](https://github.com/semyon-alekseev-noveo/tt-sync/issues/32) | P1 | **open** — owner revoke + autologin decision | **keep** (pre–Step 8) |
| Repo hygiene backlog | [#33](https://github.com/semyon-alekseev-noveo/tt-sync/issues/33) | P3 | **open** / backlog | **keep** — do not pick up before #15/#20 |

**Closed this audit:** none (nothing newly obsolete after #55).

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
