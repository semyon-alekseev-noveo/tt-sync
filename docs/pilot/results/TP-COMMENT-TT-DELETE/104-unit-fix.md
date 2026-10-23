# #104 — TP-COMMENT-TT-DELETE unit fix

## Meta

| Field | Value |
|-------|--------|
| Issue | [#104](https://github.com/semyon-alekseev-noveo/tt-sync/issues/104) |
| Parent | [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102) post-PERF fail on **2.0.85** |
| Date (UTC) | 2026-10-23 |
| Vault | n/a (unit only) |
| Build | tip (pre-release; still **2.0.85** manifest until owner bumps) |

## Inputs

- Live fail (#102): after TT Comment delete, Synchronize re-pushed the vault bullet (often vault-origin map + Dexie `commentCount` still 1 + empty Comments GET).
- Case: `TP-COMMENT-TT-DELETE` in `ABYSS_FIRST_CASES.md` / `TEST_PLAN.md`.
- Related: `BUG-COMMENT-STALE-MAPS` (multi mapped miss → still re-push), `BUG-COMMENT-RECONCILE-UPDATE`.

## Evidence

### Root cause

`vaultHasUnpushedCommentThreads` treated:

1. `remoteCommentCount > 0` + empty GET as vault-ahead (re-push), and/or
2. single **vault-origin** mapped id missing from GET as re-push.

After a real TT delete, Dexie count is often still stale and maps for vault-pushed comments are `origin: 'vault'`, so push ran instead of pull-strip.

### Fix

In `src/sync/comments/match.ts`:

- Unmapped / no `ticktickCommentId` → still **true** (create push).
- Empty or partial GET with **several** mapped ids gone → **true** (STALE-MAPS).
- **Single** mapped miss (any origin) → **false** (wait for pull). Ignore Dexie `commentCount` for this decision.

### Automated

```text
npx vitest run → 715 passed
npm run build → ok
```

Named coverage: `commentSyncMatch.test.ts` (`TP-COMMENT-TT-DELETE: single mapped miss + empty GET…`), existing `abyssStep3` / `synchronizationInner` TT-DELETE integration.

## Conclusion

Unit policy matches `TP-COMMENT-TT-DELETE` without dropping multi-map STALE-MAPS re-push. **Live re-pilot not run** — do not close #104 as pass until vault evidence.

## Checklist

- [x] Case text updated (`ABYSS_FIRST_CASES`)
- [x] Failing/updated unit test + fix
- [x] `npx vitest run` + `npm run build`
- [x] `TEST_PLAN.md` / `CHANGELOG.md` in same PR
- [ ] Live Synchronize on Thinkpad-tts-test after merge/release
