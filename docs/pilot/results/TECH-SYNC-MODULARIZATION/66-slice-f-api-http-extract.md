# #66 slice F — Tick HTTP + comment helpers extract

## Meta

- Gate: TECH-SYNC-MODULARIZATION / [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66)
- Date: 2026-10-26
- Scope: extract-only (no sync / HTTP contract change)

## Inputs

- Post-merge #154 tip; remaining size exceptions: `main.ts`, `api/index.ts`
- TECH-API-1 playbook + contract tests already landed

## Evidence

- `src/api/tickHttp.ts` — `tickMakeRequest` / request builders / device helpers
- `src/api/taskComments.ts` — `buildAddTaskCommentBody` / `parseTaskCommentFromApiResponse` (re-exported from `api/index`)
- `src/api/index.ts` ≤ 30 KB; dropped from `docs/file-size.exceptions.json`
- Remaining exception: `src/main.ts` only

## Conclusion

API client under size DoD via HTTP/comment seams. `main.ts` still excepted. TECH-API-1 live playbook not run this slice.

## Checklist

- [x] `npm run check:sizes` (1 exception)
- [x] `npm run check:cycles`
- [x] `npx vitest run` + `npm run build`
- [ ] Pilot / live TT HTTP — **not run**
