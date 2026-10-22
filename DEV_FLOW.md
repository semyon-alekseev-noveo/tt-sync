# Development flow

One process for analyst, developer, and tester work on this fork. The point is to stop a fix from shipping without a case, a failing test, and a regression run.

Release in the tree when this was written: **2.0.47**. The owner merges. Agents do not push `abyss-mapping` or `master`, do not merge, and do not create tags or releases.

## Roles

| Role | Does | Hands off |
|------|------|-----------|
| **Analyst** | Before code: add or update one case in the canonical catalog. The case has a stable ID, preconditions, and expected behavior on both sides (vault line and TickTick). | Case ID + expected behavior. No implementation. |
| **Developer** | Write a failing test named by that ID, then the fix. Update docs that the code changed, in the same branch. | Branch + PR into `abyss-mapping`. Tests green locally. |
| **Tester** | Run the regression gate and the smoke cases the change can affect. Record pass/fail with the command output or the vault observation. Do not mark a live-vault case passed without having run it. Reject a PR that changes behavior and does not update [`TEST_PLAN.md`](TEST_PLAN.md) in that same PR. | Results in the case log (or the PR). Open bugs go back to the analyst as new IDs. |

A person may play more than one role. The order does not change: case, failing test, fix, regression, recorded result.

## Definition of ready

A change is ready to code when all of these are true:

- There is a case ID in [`ABYSS_FIRST_CASES.md`](ABYSS_FIRST_CASES.md) (bug IDs such as `BUG-*` live in that catalog or in [`PO_STATUS.md`](PO_STATUS.md) and are copied into the test name).
- Expected behavior is written as something a test or a person can check.
- Scope says whether it touches sync, comments, deletion, or docs only.
- It does not require the live vault. Pilot work stays on the pilot vault.

## Definition of done

- The new test failed before the fix and passes after it.
- The regression gate below passed.
- Docs that describe the changed behavior were updated in the same PR.
- If behavior changed, [`TEST_PLAN.md`](TEST_PLAN.md) gained a section in this PR (steps, expected result, pilot status). A reviewer or a tester agent rejects the PR when that section is missing.
- The PR targets `abyss-mapping`. The owner merges.
- The report says what was run and what was not run. A case that was not executed is **not run**, never “pass”.

## Regression gate

Run from the repo root:

```bash
npx vitest run
npm run build
```

The gate includes unit tests and the full-sync integration test `src/test/synchronizationInner.integration.test.ts` (fake TickTick API + `fake-indexeddb`). Both must pass. CI (`.github/workflows/ci.yml`) runs `npm test` and `npm run build` on pull requests into `abyss-mapping`.

Rules:

- Do not delete or weaken a test to make the suite green. If a test is wrong, replace it in the same PR and say why in the PR body.
- Every bug fix adds a regression test whose name contains the bug ID (`BUG-SYNC-SILENT-FAIL`, `BUG-COMMENT-INLINE`, …).
- A failure in the integration test blocks the PR the same way a unit failure does.

## Canonical docs and archive

Update canonical docs in the same PR as the code. Do not leave a second, older description of the same rule in a canonical file.

Before changing sync, comments, or push/pull triggers, read [`docs/ANALYST_REFERENCE_DIAGRAMS.md`](docs/ANALYST_REFERENCE_DIAGRAMS.md) (mermaid boundaries from the 2026-10-19 analyst meet) and [`docs/TICKTICK_DELTA_API.md`](docs/TICKTICK_DELTA_API.md) (delta, echo/`etag`, comments without N+1).

| Canonical | What it is |
|-----------|------------|
| `DEV_FLOW.md` | This process |
| `PO_STATUS.md` | Product snapshot: target, open problems, what is next |
| `ABYSS_FIRST_PLAN.md` | Product plan. Phases are **Steps 1–8** in that file |
| `ABYSS_FIRST_CASES.md` | Acceptance cases and the results log |
| `TEST_PLAN.md` | Per-PR manual test plan. Every behavior change is recorded here |
| `PROJECT_STATE.md` | Short engineering snapshot (not a second changelog) |
| `CHANGELOG.md` | Append-only history of what landed |
| `SMOKE_TESTS.md` | How to run manual checks. The live-vault gate is the one in `ABYSS_FIRST_CASES.md` |
| `docs/TICKTICK_DELTA_API.md` | TickTick `batch/check` research, pilot §3.5, recommended etag/comment sync shape |

Archive (historical, not a source of requirements): `GTD_SYNC_CASES.md`, `GTD_SYNC_RESEARCH.md`, `TT_ABYSS_ROADMAP.md`, `SYNC_PROJECTS_AND_SUBTASKS.md`. A banner at the top of each archive file points here. If archive text disagrees with a canonical file, the canonical file wins.

Phase names: use **Step 1–8** from `ABYSS_FIRST_PLAN.md`. Do not start a new “Phase A–D” or “Phase 1–3” in new writing. Old names stay only inside archive files and changelog history.

## Versioning and releases

- `manifest.json` `version` is the plugin version. Do not bump it, tag it, or publish a GitHub release unless the owner asked for that release.
- Record the change in `CHANGELOG.md` in the same PR (context, what changed, how it was verified, what is still open).
- The owner tags and publishes. BRAT installs from that release (`docs/BRAT_INSTALL.md`).
- **Release source (owner decision for [#30](https://github.com/semyon-alekseev-noveo/tt-sync/issues/30) PROC-RELEASE-GATE):**
  - Release **only** from `abyss-mapping` **after** the version-bump / fix PR is **merged**.
  - Do **not** publish a GitHub release from a feature-branch tip (even if that tip is about to merge).
  - Do **not** force-move or retag the same version (`2.0.x`) onto a later merge commit.
  - If the merge tip still needs a GitHub release and version files are unchanged: either **wait for merge**, then tag that commit **once**, or **bump** the version for a new tag. Never retag the same `2.0.x` twice.
- Until Actions encode the gate in `release.yml`, the manual process is: bump/fix on a feature branch → PR into `abyss-mapping` → owner merges → tag/release the merged `abyss-mapping` tip once (when the owner asked for the release).
- **Epic close (multi-PR / long work):** do not close the epic issue until (1) regression gate green (`npx vitest run` + `npm run build`), (2) a GitHub release exists for the landed stack on `abyss-mapping`, and (3) for sync-related epics, pilot smoke is recorded under `docs/pilot/results/` (honest pass / fail / not run). Close the epic with a short comment linking the release URL and the evidence file.

## Branches and pull requests

- Work on a branch. Open a pull request into `abyss-mapping`.
- Do not push to `abyss-mapping` or `master`. Do not merge. Do not create tags or GitHub releases unless the owner explicitly asked for a release in the current task — and then only on the **merged** `abyss-mapping` tip (see Versioning and releases above).
- One PR may contain several commits (process, fix, docs). Stacked PRs are fine when a later change depends on an earlier one; each still targets the owner’s merge.

## Safety

- Sync runs against the **pilot vault** only (a copy). Never the live vault, until the owner says the live-vault gate passed.
- Use the manual **Synchronize** command while testing. Do not turn on a short automatic interval against a vault you care about.
- No secrets, tokens, passwords, or personal absolute paths in the repo. Write `<pilot-vault>` and `<live-vault>`.
- The plugin session is not a TickTick Open API `tp_…` token. If a `tp_…` token was pasted into chat or a doc, revoke it in TickTick. Do not commit it.
- Live-vault steps that need the owner’s Obsidian (deletion modals, real login) are run by a person or a local agent on that machine. A cloud agent must not invent those results.

## Test plan

Every PR that changes behavior updates [`TEST_PLAN.md`](TEST_PLAN.md) in that same PR. The section lists each behavior change as a manual case: steps, expected result, and pilot status (`not run` until someone runs it). Include the old behavior that must still work.

Reviewers and tester agents reject a PR that changes behavior and does not update the test plan, or whose test-plan section does not cover the diff. A docs-only or test-only PR with no behavior change does not need a new section.

## Reporting results

State the command and the outcome (`npx vitest run` → N passed). For a manual case, state who ran it, on which vault, and what was seen. If a step was skipped, say so. Do not copy a previous run forward as if it were new.
