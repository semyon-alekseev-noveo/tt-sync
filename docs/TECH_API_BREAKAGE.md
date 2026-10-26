# TECH-API-1 — unofficial Tick client breakage playbook

**Status:** open risk (P1 in `PO_STATUS.md`). Tracked under [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66).  
**Not in scope:** switching the plugin to TickTick Open API OAuth / `tp_…` tokens ([#32](https://github.com/semyon-alekseev-noveo/tt-sync/issues/32)).

## What can break

The plugin talks to TickTick’s **web session** API (`/api/v2/…`) via `src/api/index.ts` (`Tick`), not the official Open API. TickTick can change:

| Surface | Code | Typical symptom |
|---------|------|-----------------|
| Auth / cookie | `signInEndPoint`, login flow | Sync refuses to start; “please login” |
| Delta pull | `batch/check/{checkpoint}` (`getUpdatedTasks`) | Silent empty delta, stuck checkpoint, `TickTickPullError` |
| Task write | `batch/task`, `task` | Creates/updates 4xx/5xx; vault ahead of TT |
| Comments | `…/task/{id}/comment(s)` | `BUG-COMMENT-API-POST-500`-class; reconcile vault-ahead |
| Projects / tags | `projects`, `batch/tag`, … | Folders/lists drift |

Open API / MCP may still work while the session client fails — that is expected and is **not** a switch signal for this plugin.

## Detect

1. Pilot vault Synchronize → notice / console for `TickTickPullError`, HTTP status, or empty unexpected delta.
2. `npx vitest run src/test/api/` — contract tests for endpoint paths and known payload shapes (cheap; no live network).
3. Compare with MCP Open API on the same account only as a **control** (write path may differ).

## Mitigate (ordered)

1. **Confirm session still valid** — re-login from settings; do not paste Open API tokens into plugin settings.
2. **Capture one failing request** — URL path under `/api/v2/`, status, response body snippet (no cookies/tokens in git).
3. **Diff against known fixtures** — `src/api/utils/get-api-endpoints.ts`, `buildAddTaskCommentBody`, existing `src/test/api/*`.
4. **Narrow fix** — payload/header/path only; add a regression test named with the bug ID before changing production code (`DEV_FLOW.md`).
5. **If TickTick changed the contract broadly** — document in this file + `CHANGELOG.md`; open/extend a bug under #66 / product risk #63; do **not** silently fall back to Open API.

## Cheap coverage (CI)

- `TECH-API-1` contract tests: stable path strings and comment POST body keys (`src/test/api/techApi1.contract.test.ts`).
- Existing fail-closed / delta tests under `src/test/api/`.

Live/pilot smokes stay in `TEST_PLAN.md` / gate evidence — unit green does not close TECH-API-1.

## References

- `docs/TICKTICK_DELTA_API.md` — delta vs Open API comparison
- `src/api/index.ts`, `src/api/tickHttp.ts`, `src/api/taskComments.ts`, `src/api/utils/get-api-endpoints.ts`
- `PO_STATUS.md` → TECH-API-1
- Issue [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66)
