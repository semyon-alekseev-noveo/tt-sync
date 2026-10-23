# TP-DELTA-* §3.5 pilot — #84 on tip 2.0.85

## Meta

| Field | Value |
|-------|--------|
| Gate | `PERF-DELTA` |
| GitHub | [#84](https://github.com/semyon-alekseev-noveo/tt-sync/issues/84) (parent [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) closed) |
| Case | `TP-DELTA-MCP-RENAME`, `TP-DELTA-APP-RENAME`, `TP-DELTA-COMMENT`, `TP-DELTA-CLOSE-DELETE` |
| Recorded | 2026-10-23 ~14:02 UTC (agent) |
| Build | **2.0.85**; delta via plugin `tickTickRestAPI.getUpdatedTasks(since)` on Thinkpad-tts-test |
| Status | **complete (honest)** — MCP rows filled; **app** rename/comment **not run** |

## Inputs

- `docs/TICKTICK_DELTA_API.md` §3.5
- `TEST_PLAN.md` Delta API pilot
- Baseline `checkPoint` after absorb sync: `1792763627667`

## Method

1. Create disposable tasks `delta84-close-me` / `delta84-delete-me` (MCP); Synchronize once.
2. For each mutation: note `since` checkpoint → mutate via MCP → `getUpdatedTasks(since)` → write JSON under `.tickticksync/_delta84-*.json` (not committed).
3. Do **not** invent TickTick **app** UI results.

## Evidence

### TP-DELTA-MCP-RENAME — **pass**

| Field | Before (MCP get) | After in `update[]` |
|-------|------------------|---------------------|
| Task | `6ad97afa…` `тест-абис-таск` | title `… delta84-mcp-rename` |
| `etag` | `qjki2pwy` | **`99orsvyr`** (changed) |
| `modifiedTime` | `2026-10-22T08:21:48+0000` | **unchanged** `…08:21:48.849+0000` |
| `commentCount` | (absent on Open get) | **0** in delta |
| In `update[]`? | — | **yes** (`updateLen` 4 for that `since`) |

**Finding:** API/MCP rename lands in delta with **new `etag`** even when **`modifiedTime` does not bump** — supports etag-based echo / quiet-title path.

### TP-DELTA-APP-RENAME — **not run**

No TickTick mobile/desktop UI automation this session.

### TP-DELTA-COMMENT — **pass (MCP; app UI not run)**

Case text asks for TickTick **app** comment. Ran **MCP `add_comment`** (`delta84-mcp-comment` on `6ad97afa…`).

| Field | Prior delta snapshot | After comment in `update[]` |
|-------|----------------------|-----------------------------|
| In `update[]`? | — | **yes** |
| `etag` | `99orsvyr` | **`tmj1dvjl`** (changed) |
| `modifiedTime` | `2026-10-22T08:21:48…` | **`2026-10-23T14:01:42.747+0000`** (changed) |
| `commentCount` | `0` | **`1`** |

**Finding:** MCP comment puts the task in `update[]` and bumps **`commentCount`**, **`etag`**, and **`modifiedTime`**. App-UI comment still unverified.

### TP-DELTA-CLOSE-DELETE — **pass** (MCP)

| Action | Task | Delta |
|--------|------|-------|
| Complete | `6adb68728f08…` `delta84-close-me` | In **`update[]`** with **`status`: 2**, new etag/mtime |
| Delete | `6adb68738f08…` `delta84-delete-me` | In **`delete[]`** as `{ taskId, projectId }` (not a bare string) |

`deleteLen` was 2 on that pull (includes an unrelated prior delete id).

## Conclusion

| ID | Status |
|----|--------|
| TP-DELTA-MCP-RENAME | **pass** |
| TP-DELTA-APP-RENAME | **not run** |
| TP-DELTA-COMMENT | **pass (MCP)**; app UI **not run** |
| TP-DELTA-CLOSE-DELETE | **pass** |

Implications for §3.2: etag-only echo is viable for API renames that skip `modifiedTime`; comment policy can key off `commentCount` / etag in delta (at least for MCP/API comments). App-UI comment still open if product needs that proof.

## Checklist

- [x] Results in evidence file + `TEST_PLAN.md`
- [x] INDEX updated
- [ ] Comment on #84 / closed #62 with link
- [ ] Close #84 after docs PR merges
