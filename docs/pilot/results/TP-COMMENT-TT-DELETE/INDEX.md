# TP-COMMENT-TT-DELETE — pilot results

Gate for GitHub [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) (from [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102) fail on **2.0.85**).

| Phase | File | Status |
|-------|------|--------|
| Unit fix + policy | [104-unit-fix.md](104-unit-fix.md) | **pass (unit)** |
| Live on **2.0.86** | [104-live-2.0.86.md](104-live-2.0.86.md) | **fail** — `flushActiveFilePush` re-POST after `behindComments` |
| Analyst residual | [104-analyst-hypothesis.md](104-analyst-hypothesis.md) | H1–H3 **unit green** |
| Live on **2.0.87** | [104-live-2.0.87.md](104-live-2.0.87.md) | **pass** — strip + no re-POST (incl. flush) |

Live **pass** on Thinkpad-tts-test (**2.0.87**). Close [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) after docs PR merges.
