# BUG-COMMENT-ABYSS-VIEW — results index

Case: [`ABYSS_FIRST_CASES.md`](../../../../ABYSS_FIRST_CASES.md) **BUG-COMMENT-ABYSS-VIEW**  
Related: NOTE-L3b, BUG-COMMENT-ACTIVE-NOTE, BUG-COMMENT-NO-PUSH (trigger gap, not POST body)

| Phase | Result file | Status |
|-------|-------------|--------|
| 0 Baseline / hypothesis | [00-baseline-hypothesis.md](00-baseline-hypothesis.md) | **fail** observed on **2.0.74** release build |
| 1 Fix + unit | [01-fix.md](01-fix.md) | **code done** → shipped **2.0.75** |
| 2 Pilot verify | [02-verify.md](02-verify.md) | **pass** — `push-abyss-or-background` + TT Comments |

**Task under test:** `task-11-16` / `6ad83d003e30f4429d749e0a` / `00 Inbox/2026-10-19.md`
