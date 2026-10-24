# TP-COMMENT-TT-DELETE — pilot results

Gate for GitHub [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) (from [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102) fail on **2.0.85**).

| Phase | File | Status |
|-------|------|--------|
| Unit fix + policy | [104-unit-fix.md](104-unit-fix.md) | **pass (unit)** H1–H3 |
| Live on **2.0.86** | [104-live-2.0.86.md](104-live-2.0.86.md) | **fail** — flush re-POST |
| Analyst residual H1–H4 | [104-analyst-hypothesis.md](104-analyst-hypothesis.md) | unit green; live incomplete |
| Analyst F1 re-pass | [104-analyst-f1-merge-hint.md](104-analyst-f1-merge-hint.md) | F1 + F1b named |
| Live prove ×2 (tip F1+F1b) | [104-live-f1-prove-twice.md](104-live-f1-prove-twice.md) | **pass** ×2 (gate + тест-абис-таск) |

Close [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) after this PR merges and a release ships the tip build (PROC-RELEASE-GATE).
