# Phase 2b — Fix v2 comment POST (BUG-COMMENT-API-POST-500)

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-GATE-TEST-11-12` |
| GitHub | [tt-sync #13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) (+ BUG issue if created) |
| Recorded | 2026-10-21 13:31 UTC (agent) |
| Build | **2.0.74** |
| Status | **code done** — unit + live cookie POST OK; Phase 3b (reload/sync Comments) separate |

## Inputs

- [14-phase-1b-no-post.md](14-phase-1b-no-post.md) — v2 POST 500; Dexie maps empty; MCP Open API OK
- dida-cli `docs/web-api.md` — webapp comment create shape

## Root cause

Plugin sent `{ title, content }` (earlier `{ title }` only). TickTick **v2** returns HTTP **500** `unknown_exception` for that payload.

The web client POSTs:

```json
{
  "id": "<24-hex client id>",
  "createdTime": "YYYY-MM-DDTHH:mm:ss.sss+0000",
  "taskId": "...",
  "projectId": "...",
  "title": "...",
  "userProfile": { "isMyself": true },
  "mentions": [],
  "isNew": true
}
```

Live cookie probe (same session as plugin `data.json` token, not Open API):

| Body | HTTP | GET comments |
|------|------|--------------|
| `{ title, content }` | **500** | — |
| `{ title }` | **500** | — |
| webapp fields (above) | **200** empty body | comment present with **client id** |
| `{ id, createdTime, taskId, projectId, title }` | **200** | comment present |

Probes deleted afterward so the gate task stayed at n=0 Comments before deploy.

Secondary bug: successful POST often returns **empty body**; `makeRequest` used to throw on `result.json` and look like failure. Empty 200 now returns `{}`; `addTaskComment` falls back to the client-generated id.

## Fix (2.0.74)

- `buildAddTaskCommentBody` + `addTaskComment` uses webapp body
- `makeRequest` tolerates empty 200 body
- Test: `src/test/bugCommentApiPost500.test.ts` (**BUG-COMMENT-API-POST-500**)

Not done: Open API fallback (plugin has no `tp_…` / Bearer path; not required once v2 body works).

## Validation

```text
npx vitest run  →  680 passed (96 files)
npm run build   →  ok (dist/manifest.json version 2.0.74)
```

## Checklist

- [x] Case ID **BUG-COMMENT-API-POST-500** named and tested
- [x] Live probe confirms root cause + fix direction
- [x] Version **2.0.74**
- [x] Canonical docs updated (CHANGELOG, TEST_PLAN, ABYSS_FIRST_CASES)
- [x] Phase 3b: pilot reload + Synchronize → Comments non-empty — [16-phase-3b-verify.md](16-phase-3b-verify.md)

## Conclusion

**Fixed:** missing client `id` / task-project fields on v2 comment create (not stale maps, not coordinator). Ship **2.0.74**; Phase 3b Comments **pass**.
