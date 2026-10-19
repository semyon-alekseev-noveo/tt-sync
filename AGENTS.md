# Agents

Read [`DEV_FLOW.md`](DEV_FLOW.md) before changing sync code, tests, or docs.

Short version: the analyst writes a case ID and expected behavior in [`ABYSS_FIRST_CASES.md`](ABYSS_FIRST_CASES.md) first; the developer adds a failing test named by that ID, then the fix; the tester runs `npx vitest run` and `npm run build` plus the affected smoke cases and records what actually ran.

Every PR that changes behavior updates [`TEST_PLAN.md`](TEST_PLAN.md) in that same PR (steps, expected result, pilot status). Reviewers and tester agents reject a PR that does not.

Do not push `abyss-mapping` or `master`, do not merge, and do not create tags or releases. Open a pull request into `abyss-mapping`. The owner merges.

Pilot vault only. No secrets and no personal filesystem paths in the repo. Do not mark a live-vault case as passed unless it was run.
