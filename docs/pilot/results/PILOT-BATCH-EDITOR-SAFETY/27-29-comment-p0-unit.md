# #27–#29 comment P0 unit fixes (2.0.79)

## Meta

- Date: 2026-10-22 UTC
- Build: **2.0.79** (`manifest.json`)
- Issues: [#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27), [#28](https://github.com/semyon-alekseev-noveo/tt-sync/issues/28), [#29](https://github.com/semyon-alekseev-noveo/tt-sync/issues/29)
- Status: **unit pass**; pilot vault **not run**

## Inputs

- Parent epic: [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15) PILOT-BATCH-EDITOR-SAFETY
- Prior: [16-open-note-editor.md](16-open-note-editor.md) (found #27 on 2.0.76)
- Tip before: **2.0.78** on `abyss-mapping`

## Evidence

### Automated

- `npx vitest run` → **100** files, **697** passed
- `npm run build` → ok
- Named tests:
  - `BUG-COMMENT-VAULT-DUP-KEY` — `src/test/abyssStep3.test.ts`
  - `BUG-COMMENT-EMPTY-VAULT-WIPE` — `src/test/abyssCommentSync.test.ts`, `src/test/vaultCommentBehind.test.ts`
  - `BUG-COMMENT-GET-FAIL-OPEN` — `src/test/abyssCommentSync.test.ts`

### Pilot

- **not run** — waiting for merge + release **2.0.79** then Thinkpad-tts-test re-verify

## Conclusion

Code fixes are ready for PR into `abyss-mapping`. Do not mark live-vault rows pass until pilot Synchronize evidence exists for each bug.

## Checklist

- [x] Case rows in `ABYSS_FIRST_CASES.md`
- [x] Failing tests named by BUG-* IDs (then green after fix)
- [x] Minimal fixes in `abyssFormat` / `abyssCommentSync` / `api` / callers
- [x] `npx vitest run` + `npm run build`
- [x] `TEST_PLAN.md` + `CHANGELOG.md` in same PR
- [ ] Pilot verify on Thinkpad-tts-test after **2.0.79** release
