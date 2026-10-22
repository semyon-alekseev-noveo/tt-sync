# #27 BUG-COMMENT-VAULT-DUP-KEY quiet-sync fix (2.0.80)

## Meta

- Date: 2026-10-22 UTC
- Build: **2.0.80** (`manifest.json`)
- Issue: [#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27)
- Status: **unit pass**; pilot vault **not run**

## Inputs

- Prior unit: [27-29-comment-p0-unit.md](27-29-comment-p0-unit.md) (**2.0.79** merge collapse only)
- Prior pilot: `58-release-2.0.79-smoke.md` on docs PR #59 — `task-11-16` still ~21 Abyss twins after Synchronize on **2.0.79**
- Tip before: **2.0.79** on `abyss-mapping`

## Root cause

`collapseAbyssCommentLinesByKey` runs only inside `mergeAbyssBlock`, which runs on pull/`updateTask`. Quiet Synchronize when TT keys already match (or twins-only hash ≠ `lineHash` → sticky `local-edit`) never rewrites the note, so vault twins stay.

## Evidence

### Automated

- `npx vitest run` + `npm run build` — see CHANGELOG iteration for this PR
- Named tests:
  - `BUG-COMMENT-VAULT-DUP-KEY` quiet sync → `vault-comment-dup-keys` — `src/test/vaultCommentBehind.test.ts`
  - twins-only hash mismatch not sticky `local-edit` — same file
  - merge/collapse — `src/test/abyssStep3.test.ts`, `src/test/commentSyncKeys.test.ts`

### Pilot

- **not run** — waiting for owner merge + release **2.0.80** from `abyss-mapping`, then Thinkpad-tts-test collapse of `task-11-16`

## Conclusion

Quiet sync now marks behind with reason `vault-comment-dup-keys` (attaches `_apiComments` when GET works) so `mergeAbyssBlock` collapses twins. Does not POST/DELETE TickTick comments for this path alone.

## Checklist

- [x] Failing test named `BUG-COMMENT-VAULT-DUP-KEY` (sync path)
- [x] Fix in `VaultSyncCoordinator.vaultLineBehindTask`
- [x] Bump **2.0.80**; `TEST_PLAN.md` + `CHANGELOG.md`
- [ ] Pilot Synchronize on `task-11-16` after release
