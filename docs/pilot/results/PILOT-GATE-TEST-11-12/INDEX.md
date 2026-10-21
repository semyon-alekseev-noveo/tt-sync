# PILOT-GATE-TEST-11-12 — results index

Plan: [`../../PILOT-GATE-TEST-11-12.md`](../../PILOT-GATE-TEST-11-12.md)  
Epic: [tt-sync #14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14)

| Phase | Issue | Result file | Status |
|-------|-------|-------------|--------|
| 0 Baseline | [#10](https://github.com/semyon-alekseev-noveo/tt-sync/issues/10) | [10-phase-0-baseline.md](10-phase-0-baseline.md) | **closed** — evidence recorded |
| 1 Hypothesis | [#11](https://github.com/semyon-alekseev-noveo/tt-sync/issues/11) | [11-phase-1-hypothesis.md](11-phase-1-hypothesis.md) | **closed** — path B / vault-ahead |
| 2 Fix + test | [#12](https://github.com/semyon-alekseev-noveo/tt-sync/issues/12) | [12-phase-2-fix.md](12-phase-2-fix.md) | **closed** — code done **2.0.73** (reconcile guard) |
| 3 Pilot verify | [#13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) | [13-phase-3-verify.md](13-phase-3-verify.md) | **fail** (2.0.73) — superseded by 3b |
| 1b No-post hypothesis | [#13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) | [14-phase-1b-no-post.md](14-phase-1b-no-post.md) | **closed** — root cause: minimal POST body → 500 |
| 2b POST fix | [#13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) / [#21](https://github.com/semyon-alekseev-noveo/tt-sync/issues/21) | [15-phase-2b-post-fix.md](15-phase-2b-post-fix.md) | **closed / pass** — **2.0.74** webapp body + empty-200 client id |
| 3b Re-verify Comments | [#13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) | [16-phase-3b-verify.md](16-phase-3b-verify.md) | **closed / pass** — Comments `comment 1` + `test-new-verision` |

**Gate:** **pass** on **2.0.74** (Comments criterion). Epic [#14](https://github.com/semyon-alekseev-noveo/tt-sync/issues/14) / phases [#10](https://github.com/semyon-alekseev-noveo/tt-sync/issues/10)–[#13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) / [#21](https://github.com/semyon-alekseev-noveo/tt-sync/issues/21) closed. Optional follow-up: write-trace stall after sync (non-blocking).
