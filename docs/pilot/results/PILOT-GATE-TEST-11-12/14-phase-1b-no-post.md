# Phase 1b — Why vault-ahead does not POST

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-GATE-TEST-11-12` |
| GitHub | [tt-sync #13](https://github.com/semyon-alekseev-noveo/tt-sync/issues/13) (follow-up after Phase 3 fail) |
| Recorded | 2026-10-21 13:23 UTC (agent) |
| Build | **2.0.73** (no bump) |
| Status | **open** — root cause identified; **no plugin fix shipped** (TickTick v2 POST broken) |

## Inputs

- [13-phase-3-verify.md](13-phase-3-verify.md) — `vault-comments-ahead`, TT Comments empty
- [11-phase-1-hypothesis.md](11-phase-1-hypothesis.md) — stale-map / empty `vaultOnly` theory
- [12-phase-2-fix.md](12-phase-2-fix.md) — coordinator guard only

## Path decision (Phase 3 window)

| Claim from Phase 1 | Phase 1b verdict |
|--------------------|------------------|
| Stale Dexie maps → `plan.vaultOnly` empty → no `addTaskComment` | **Rejected** for current pilot DB |
| `pushedVaultComments=true` from map-only / wipe | **Rejected** |
| Reconcile reports `vault-comments-ahead` while Comments stay empty | **Confirmed** — path B runs; push is a no-op because POST fails |

## Evidence

### Dexie `taskCommentMaps` (pilot vault `Thinkpad-tts-test`)

- DB: `Thinkpad-tts-testTickTickSync`
- Maps for `6ad83bc73e30f4429d749e09`: **`[]`**
- Maps in entire table: **`total: 0`**
- Raw IndexedDB `put`/`get`/`delete` on that store works (table is writable)

Empty maps ⇒ `planCommentSync` with empty GET would put **both** vault threads in `vaultOnly`. Phase 1 “stale map links threads” does **not** explain this fail.

### Plugin Comments API (cookie / `api.ticktick.com/api/v2`)

Via Obsidian eval on loaded **2.0.73**:

| Call | Result |
|------|--------|
| `getTaskComments(project, 6ad83bc…)` | `[]` (OK) |
| `getTask` / task body | title `test-11-12`, content `new` (OK) |
| `addTaskComment(..., "phase1b-plugin-probe")` | **`null`** |
| `Tick._lastError` | **`statusCode: 500`**, `errorCode: "unknown_exception"` |
| Same POST, body variants (`title+content`, `title` only, `content` only, `text`) | all **500** |
| Same POST on three other inbox tasks | all **500** |
| Alternate paths (`task/{id}/comment`, etc.) | 500 or 404 |

Artifacts (vault-relative): `.tickticksync/phase1b-http.json`, `phase1b-bodies.json`, `phase1b-other-task.json`, `phase1b-sanity.json`.

### MCP Open API (control)

- `add_comment` on the same project/task with title `phase1b-mcp-probe` → **created** (`id` returned)
- Probe deleted afterward so gate disk/API baseline stays empty for comments

So TickTick **can** accept comments; the **plugin v2** POST endpoint does not.

### write-trace / journal (unchanged story)

- Phase 3: `vault-comments-ahead` (not false `in-sync`) — Phase 2 guard holds
- No successful comment map upserts anywhere in Dexie → consistent with every plugin POST failing

## Hypothesis (primary)

1. Path **B** (`vaultLineBehindTask`) runs: vault bullets + empty GET ⇒ `vaultAhead` / `vaultWantsPush` true.
2. `syncAbyssCommentsToTickTick` runs with **empty** maps ⇒ non-empty `vaultOnly` ⇒ calls `addTaskComment`.
3. `makeRequest` for `POST .../api/v2/project/{pid}/task/{tid}/comment` returns **HTTP 500** ⇒ `addTaskComment` → `null` ⇒ `changed === false` ⇒ no Dexie maps.
4. Coordinator (2.0.73): `vaultWantsPush && !pushedVaultComments` ⇒ reason **`vault-comments-ahead`** (correct); TickTick Comments stay empty.

## Primary case ID

**`BUG-COMMENT-API-POST-500`** — plugin v2 `addTaskComment` fails with HTTP 500 (`unknown_exception`) while Open API / MCP POST succeeds; reconcile must keep reporting vault-ahead (already covered by `BUG-COMMENT-RECONCILE-UPDATE`) but gate cannot pass until POST works.

Related (not primary for this fail): `BUG-COMMENT-RECONCILE-UPDATE` (guard only), `BUG-COMMENT-PUSH-NO-ID` (parse after 200).

## Suggested fix direction

- **Not** another coordinator / `planCommentSync` tweak — maps are empty; `vaultOnly` is not the blocker.
- Recover a working write path: TickTick v2 comment POST regression (payload/headers/host), or route comment writes through Open API (auth/scope change), or document external outage and re-run Phase 3 when POST returns 200 + id.
- Optional hardening (does not unblock gate alone): surface `_lastError` on vault-ahead no-op (`log.warn` with status/errorCode); treat repeated 5xx as distinct reason in write-trace.

## Checklist

- [x] Read Phase 3 + Phase 1/2 results
- [x] Dexie maps inspected (empty for task and globally)
- [x] Plugin `addTaskComment` probed with lastError
- [x] MCP control POST succeeded then deleted
- [x] Primary `BUG-*` named
- [ ] Plugin code fix + version bump — **blocked** on working TickTick write API
- [ ] Do not mark gate pass

## Conclusion

Phase 3 fail is **not** false `in-sync` and **not** empty `vaultOnly` from stale maps. Plugin **v2 comment create returns HTTP 500** for this account; MCP Open API still works. **Do not bump to 2.0.74** until a write path is fixed or TickTick restores v2 POST. Next: human/agent recovers POST (or Open API), then failing test against that path if code changes, then Phase 2b / re-verify #13.
