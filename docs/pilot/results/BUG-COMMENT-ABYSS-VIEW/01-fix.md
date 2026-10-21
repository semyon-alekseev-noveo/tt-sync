# Phase 1 — Fix (BUG-COMMENT-ABYSS-VIEW)

## Meta

| Field | Value |
|-------|--------|
| Case | `BUG-COMMENT-ABYSS-VIEW` |
| Recorded | 2026-10-21 14:22 UTC (agent) |
| Build | Fix on **2.0.74** deploy; release bump **2.0.75** |
| Status | **code done** / shipped **2.0.75** |

## Inputs

- [00-baseline-hypothesis.md](00-baseline-hypothesis.md)

## Code changes

1. `shouldNotifyPushOnVaultModify` — in-scope markdown `vault.modify` schedules the 5s push (Abyss has no `editor-change`).
2. `EventHandlerService.flushActiveFilePush` — no longer requires `getActiveFile() === filepath`; Abyss/background flush uses `identifiedOnly: false` (full comment sweep).
3. `pushSettledActiveFile(..., { identifiedOnly })` — optional flag for that path.
4. Tests in `activeFilePush.test.ts` (`BUG-COMMENT-ABYSS-VIEW`).

## Validation

- `npx vitest run` → **682 passed**
- `npm run build` → ok
- Deployed `dist/` → pilot `tickticksync-abyss/`; `plugin:reload` → still reports **2.0.74**

## Conclusion

Trigger gap fixed in tree; pilot verify next (Comments for `task-11-16` + Abyss-style `vault.modify` quiet-period push).

## Checklist

- [x] Failing/regression tests named by case ID
- [x] Minimal fix
- [x] vitest + build green
- [x] Deploy + reload on pilot
- [x] Release bump (**2.0.75**)
