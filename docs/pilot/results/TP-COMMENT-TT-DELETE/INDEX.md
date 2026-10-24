# TP-COMMENT-TT-DELETE — pilot results

Gate for GitHub [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) (from [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102) fail on **2.0.85**).

| Phase | File | Status |
|-------|------|--------|
| Unit fix + policy | [104-unit-fix.md](104-unit-fix.md) | **pass (unit)** H1–H3 |
| Live on **2.0.86** | [104-live-2.0.86.md](104-live-2.0.86.md) | **fail** — flush re-POST |
| Analyst residual H1–H4 | [104-analyst-hypothesis.md](104-analyst-hypothesis.md) | unit green; live incomplete |
| Analyst F1 re-pass | [104-analyst-f1-merge-hint.md](104-analyst-f1-merge-hint.md) | F1 + F1b named |
| Live prove ×2 (tip F1+F1b) | [104-live-f1-prove-twice.md](104-live-f1-prove-twice.md) | **pass** ×2 vault-first only — does not cover API-seed |
| Live on **2.0.88** (box, API-seed) | [104-live-2.0.88-box.md](104-live-2.0.88-box.md) | **fail** — re-POST + bullet kept; `syncedLists` empty |
| API-seed map upsert | [104-api-seed-map.md](104-api-seed-map.md) | **pass (unit)** / live re-prove **not run** |

[#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) **reopened** after the **2.0.88** box fail. Do not close it from unit results. Re-prove vault-first and API-seed after merge, with the task's list in `syncedLists`.
