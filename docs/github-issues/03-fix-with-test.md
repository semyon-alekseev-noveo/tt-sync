# GitHub issue — Phase 2

**Title:** `PILOT-GATE-TEST-11-12 Phase 2: Failing test + minimal fix`

**Parent:** Epic PILOT-GATE-TEST-11-12  
**Blocked by:** Phase 1 hypothesis written

**Body:**

Follow [`DEV_FLOW.md`](../../DEV_FLOW.md).

## Checklist

- [ ] Case ID in `ABYSS_FIRST_CASES.md` (existing or updated expected behavior)
- [ ] Regression test name contains case ID; **failed before fix**
- [ ] Code fix scoped to hypothesis from Phase 1
- [ ] `npx vitest run` + `npm run build` green
- [ ] `TEST_PLAN.md` + `CHANGELOG.md` updated in PR
- [ ] PR targets `abyss-mapping` (no push to protected branches)
- [ ] `dist/` deployed to pilot; version noted in issue

## Outcome

- [ ] Assign to tester for Phase 3 (do **not** mark pilot pass in this issue)
