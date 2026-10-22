# #27 BUG-COMMENT-VAULT-DUP-KEY quiet-sync fix (2.0.80)

## Meta

- Date: 2026-10-22 UTC
- Build: **2.0.80** (`manifest.json` / local `dist/`)
- Issue: [#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27)
- PR: [#60](https://github.com/semyon-alekseev-noveo/tt-sync/pull/60)
- Status: **unit pass** + **pilot pass** (local deploy of PR tip; release still pending merge)

## Inputs

- Prior unit: [27-29-comment-p0-unit.md](27-29-comment-p0-unit.md) (**2.0.79** merge collapse only)
- Prior pilot: docs PR #59 `58-release-2.0.79-smoke.md` — `task-11-16` still ~21 Abyss twins after Synchronize on **2.0.79**
- Tip before: **2.0.79** on `abyss-mapping`

## Root cause

`collapseAbyssCommentLinesByKey` runs only inside `mergeAbyssBlock`, which runs on pull/`updateTask`. Quiet Synchronize when TT keys already match (or twins-only hash ≠ `lineHash` → sticky `local-edit`) never rewrote the note, so vault twins stayed.

## Evidence

### Automated

- `npx vitest run` → **100** files, **701** passed
- `npm run build` → ok (`dist/` **2.0.80**)
- Named tests:
  - quiet sync → `vault-comment-dup-keys` — `src/test/vaultCommentBehind.test.ts`
  - twins-only hash mismatch not sticky `local-edit` — same file
  - merge/collapse — `src/test/abyssStep3.test.ts`, `src/test/commentSyncKeys.test.ts`

### Pilot (Thinkpad-tts-test, local deploy of PR tip — not GitHub release)

| Step | Result |
|------|--------|
| Pre: Abyss comment bullets under `task-11-16` | **20** (wall-clock clusters + ISO twins for 4 keys) |
| Copy `dist/` → pilot `tickticksync-abyss/`; `plugin:reload` | loaded **2.0.80** |
| `tts-sync` (after clearing stuck `syncRunning`) | write-trace `reason: vault-comment-dup-keys` @ `2026-10-22T11:05:36.530Z` |
| Post: same task | **4** wall-clock bullets; **no** ISO twins; follow-up decision `in-sync` @ `11:05:49Z` |

Kept lines (one per `normalizedCommentKey`):

- `2026-10-21 21:22: comment 1`
- `2026-10-21 21:22: коммент 2`
- `2026-10-21 21:25: abyss-view-verify-18380`
- `2026-10-21 21:25: abyss-view-verify-b`

## Conclusion

Quiet sync rewrite works on pilot for #27. Do **not** close #27 until owner merges [#60](https://github.com/semyon-alekseev-noveo/tt-sync/pull/60) and releases **2.0.80** from `abyss-mapping` (PROC-RELEASE-GATE).

## Checklist

- [x] Failing test named `BUG-COMMENT-VAULT-DUP-KEY` (sync path)
- [x] Fix in `VaultSyncCoordinator.vaultLineBehindTask`
- [x] Bump **2.0.80**; `TEST_PLAN.md` + `CHANGELOG.md`
- [x] Pilot Synchronize collapse on `task-11-16` (local PR tip)
- [ ] GitHub release **2.0.80** after merge (owner)
