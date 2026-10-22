# PROC-RELEASE-GATE (#30)

Tracker: [`semyon-alekseev-noveo/tt-sync#30`](https://github.com/semyon-alekseev-noveo/tt-sync/issues/30).

## Owner decision (process — docs now)

Until Actions encode the gate in `release.yml`:

- Release **only** from `abyss-mapping` **after** the version-bump / fix PR is **merged**.
- Do **not** release from a feature-branch tip.
- Do **not** force-move or retag the same `2.0.x` onto a later merge commit.
- If the merge tip still needs a GitHub release and version files are unchanged: wait for merge, then tag that commit **once**, or bump the version for a new tag.

Canonical text: `DEV_FLOW.md` § Versioning and releases; agents: `.cursor/rules/dev-flow.mdc`.

## Still open (Actions)

- CI-gated `release.yml`, ancestor-of-`abyss-mapping` check, version consistency, required status check on merges.
