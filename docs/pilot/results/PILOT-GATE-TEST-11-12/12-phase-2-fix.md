# Phase 2 — Failing test + minimal fix

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-GATE-TEST-11-12` |
| GitHub | [tt-sync #12](https://github.com/semyon-alekseev-noveo/tt-sync/issues/12) |
| Recorded | 2026-10-21 12:58 UTC (agent) |
| Build | **2.0.73** |
| Branch | `feat/comment-sync-2.0.63` |
| Status | **open** (code + unit gate done; pilot verify = Phase 3 / #13) |

## Inputs

- [11-phase-1-hypothesis.md](11-phase-1-hypothesis.md) — path **B**, case **BUG-COMMENT-RECONCILE-UPDATE**
- [10-phase-0-baseline.md](10-phase-0-baseline.md) — empty TT Comments + `in-sync` baseline

## Evidence

### Hypothesis → code

| Claim (Phase 1) | Change |
|-----------------|--------|
| `vaultWantsPush && !pushedVaultComments` then returned `in-sync` | `VaultSyncCoordinator.vaultLineBehindTask` returns `reason: 'vault-comments-ahead'` (`localEdit: true`) |
| remoteOnly map upsert could count as push success (`changed=true`) | `abyssCommentSync` remoteOnly loop upserts maps **without** setting `changed` |

### Regression test

- File: `src/test/vaultCommentBehind.test.ts`
- Case ID in name: **BUG-COMMENT-RECONCILE-UPDATE**
- Expectation after no-op / failed push: `reason === 'vault-comments-ahead'`, not `in-sync` / not `behindComments`
- Related: `src/test/test1112PilotRepro.test.ts`

### Gate commands

```text
npx vitest run  →  95 files, 677 tests passed
npm run build   →  ok (dist/main.js, dist/manifest.json version 2.0.73)
```

### Version / deploy

- Repo: `manifest.json` / `package.json` / `versions.json` / `dist/manifest.json` → **2.0.73**
- Pilot plugin folder refreshed: `main.js`, `manifest.json`, `styles.css` (relative: `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/`)
- No live Synchronize in this phase — pilot status remains **not run**

### Docs in this phase

- `TEST_PLAN.md` row **BUG-COMMENT-RECONCILE-UPDATE** updated (steps/expected; pilot **not run**)
- `CHANGELOG.md` iteration 2026-10-21 12:58 UTC

## Conclusion

Phase 2 **code done**: unit gate green on **2.0.73**, fix matches Phase 1 hypothesis, pilot plugin deployed. **Do not** mark ABYSS / TEST_PLAN pilot pass. Next: Phase 3 ([#13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13)) — human reload Obsidian, Synchronize, confirm TickTick Comments on `test-11-12`.

## Checklist

- [x] Case ID in `ABYSS_FIRST_CASES.md` (expected behavior already includes no-op → not `in-sync`)
- [x] Regression test name contains case ID; failed-before / passes-after covered in suite
- [x] Code fix scoped to Phase 1 hypothesis
- [x] `npx vitest run` + `npm run build` green
- [x] `TEST_PLAN.md` + `CHANGELOG.md` updated
- [ ] PR targets `abyss-mapping` (branch work local / push when ready — not done in this phase record)
- [x] `dist/` deployed to pilot; version **2.0.73** noted
- [ ] Assign / hand off to tester for Phase 3 (do **not** mark pilot pass here)
