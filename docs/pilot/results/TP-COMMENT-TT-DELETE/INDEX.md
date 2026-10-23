# TP-COMMENT-TT-DELETE — pilot results

Gate for GitHub [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) (from [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102) fail on **2.0.85**).

| Phase | File | Status |
|-------|------|--------|
| Unit fix + policy | [104-unit-fix.md](104-unit-fix.md) | **pass (unit)** |
| Live on **2.0.86** | [104-live-2.0.86.md](104-live-2.0.86.md) | **fail** — `flushActiveFilePush` re-POST after `behindComments` |

Do not mark `TEST_PLAN` / `ABYSS_FIRST_CASES` live **pass** until a Thinkpad-tts-test run is **pass**.
