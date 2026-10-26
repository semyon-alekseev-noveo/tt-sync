# PROC-RELEASE-GATE (#30)

Tracker: [`semyon-alekseev-noveo/tt-sync#30`](https://github.com/semyon-alekseev-noveo/tt-sync/issues/30).

Canonical behavior: `DEV_FLOW.md` § Versioning and releases. Install tracks: `docs/BRAT_INSTALL.md`. Agents: `.cursor/rules/dev-flow.mdc`.

Parent epic [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20) is **closed**. Do not add a Step 7 feature freeze.

## What Actions enforce

`.github/workflows/release.yml` (tag push `v*` / `[0-9]+.[0-9]+.[0-9]*`, and **Run workflow**):

| Check | What fails the publish |
|--------|------------------------|
| Tests | Job `test` matches `.github/workflows/ci.yml`: `npm ci`, `npm run check:cycles`, `npm run check:sizes`, `npm test`, `npm run build`. Job `release` has `needs: test`. |
| Ancestor | `git fetch origin abyss-mapping` then `git merge-base --is-ancestor "$GITHUB_SHA" origin/abyss-mapping`. Tag push always runs it. **Run workflow** with **pre-release** checked may skip it (pilot PR build). |
| Version | Tag equals `manifest.json` `version`, `package.json` `version`, and a `versions.json` key (`scripts/check-release-version.sh`). Checked before the zip. `dist/manifest.json` is not rewritten from the tag. |
| No retag | A GitHub Release for that tag already exists, or the tag ref points at a different commit. Uploader `overwrite_files: false`. |

Incidents this stops: **2.0.59** (red tests), **2.0.75 / 2.0.76 / 2.0.77** (unmerged branch as a normal release), **2.0.78** (same tag published twice).

**Live cut:** merge the bump, tag the `abyss-mapping` tip once (`2.0.x`, no `v` prefix).

**Pilot cut:** Actions → Release Obsidian plugin → Run workflow on the PR branch, **pre-release** left checked. Tests and version match still run.

## Owner follow-up — required check on `abyss-mapping`

This PR does not change branch protection. The cloud agent token received HTTP 403 on `GET /branches/abyss-mapping/protection`. `GET /rulesets` returned an empty list. An active ruleset would change who can merge before this PR is reviewed, so it was left for the owner.

The check to require is **`CI / test`** (workflow name `CI`, job name `test` in `.github/workflows/ci.yml`). Do **not** require `Release Obsidian plugin / test`. That job runs on tag push and **Run workflow** only, so requiring it on pull requests would block every merge.

The check name shows up in the picker after `CI` has run at least once on the repository (it already has).

### Click-path

1. Open [Rules](https://github.com/semyon-alekseev-noveo/tt-sync/settings/rules) → **New ruleset** → **New branch ruleset**.
2. Ruleset name: `abyss-mapping required CI`. Enforcement: **Active**.
3. Target branches → Add target → Include by pattern → `abyss-mapping`.
4. Rules → **Require status checks to pass** → add **`CI / test`**.
5. Turn on **Require branches to be up to date before merging** if merges should wait for a green run of the latest tip.
6. Save. Do not add a feature-freeze rule.

Classic alternative: [Branches](https://github.com/semyon-alekseev-noveo/tt-sync/settings/branches) → Add branch protection rule → pattern `abyss-mapping` → Require status checks → `CI / test`. A `PUT` of classic protection replaces the whole protection document. Prefer a ruleset so other rules are not wiped.

### `gh` command (owner)

`integration_id` **15368** is GitHub Actions. Confirm the context string in the UI if GitHub shows a different name.

```bash
gh api --method POST repos/semyon-alekseev-noveo/tt-sync/rulesets --input - <<'EOF'
{
  "name": "abyss-mapping required CI",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/abyss-mapping"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "CI / test", "integration_id": 15368 }
        ]
      }
    }
  ]
}
EOF
```

### Optional — block tag force-push

`release.yml` fails when a Release for the tag already exists. It does not stop this sequence: delete the Release, force-move the tag, push again. A tag ruleset closes that hole: target **tag**, include the version tags, rules **Block force pushes** and **Restrict deletions**.

## Still open on the GitHub issue

Leave [#30](https://github.com/semyon-alekseev-noveo/tt-sync/issues/30) open until this PR is merged and the owner has either enabled `CI / test` or explicitly deferred it. The checklist line about a feature freeze until #20 is obsolete (#20 is closed) and should not be implemented.

## Residual risks

- BRAT **latest** includes pre-releases by semver. The live vault has to stay **frozen** on a non-prerelease tag (`docs/BRAT_INSTALL.md`).
- Deleting a Release and force-moving the same tag still publishes, until a tag ruleset exists.
- Two publishes that both pass the “no release yet” check before either creates the Release can race. The workflow uses a concurrency group so its own runs queue; a release created outside the workflow in that window is not covered. `overwrite_files: false` is the backstop for assets.
- `CI / test` on pull requests is still optional until the owner saves the ruleset. A merge can still land before CI finishes, which is how several 2026-10-21 PRs merged.
- Re-running a failed publish after the Release object was created (assets missing) fails the “already exists” check. Recovery: delete that Release, leave the tag on the **same** commit, re-run. Do not move the tag. Or bump and tag a new version.
