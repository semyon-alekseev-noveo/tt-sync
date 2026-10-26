# Agents

Read [`DEV_FLOW.md`](DEV_FLOW.md) before changing sync code, tests, or docs. Pilot gate issues: [`.cursor/rules/pilot-results.mdc`](.cursor/rules/pilot-results.mdc) — publish phase results under `docs/pilot/results/`, not only in GitHub comments.

Short version: the analyst writes a case ID and expected behavior in [`ABYSS_FIRST_CASES.md`](ABYSS_FIRST_CASES.md) first; the developer adds a failing test named by that ID, then the fix; the tester runs `npx vitest run` and `npm run build` plus the affected smoke cases and records what actually ran.

Every PR that changes behavior updates [`TEST_PLAN.md`](TEST_PLAN.md) in that same PR (steps, expected result, pilot status). Reviewers and tester agents reject a PR that does not.

Do not push `abyss-mapping` or `master`, do not merge, and do not create tags or releases. Open a pull request into `abyss-mapping`. The owner merges. Publishing is gated by `.github/workflows/release.yml` (tests, ancestor of `abyss-mapping`, version match, no retag) — see `DEV_FLOW.md` § Versioning and releases. A pilot build is a pre-release **Run workflow**, only when the owner asked.

Pilot vault only. No secrets and no personal filesystem paths in the repo. Do not mark a live-vault case as passed unless it was run.

Bug fixes: prove the fixed behavior **at least twice** (two independent live/pilot runs, preferably different fixtures) before closing the issue or writing live **pass** — see [`.cursor/rules/bug-prove-twice.mdc`](.cursor/rules/bug-prove-twice.mdc).
