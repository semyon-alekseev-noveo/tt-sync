# 137b — AF-NEST soak: Abyss reparent → TT hierarchy (evidence catalog)

| Field | Value |
|-------|--------|
| Gate | ABYSS-NEST-GTD |
| GitHub | [#139](https://github.com/semyon-alekseev-noveo/tt-sync/issues/139) |
| Soak run | 2026-10-25, plugin **2.0.89**, `<pilot-vault>` (Thinkpad-tts-test) |
| Runner | Obsidian CLI (`tts-sync`) + TickTick MCP |
| Status | **pass** — this file reconstructs the evidence table from the [#139 issue body](https://github.com/semyon-alekseev-noveo/tt-sync/issues/139); the issue linked this filename but the file was never committed. No new observations were added; results are quoted from the issue as recorded on 2026-10-25. |

## Results (from #139)

After Abyss nests a checkbox (View nest/indent = `reparent-task`), Synchronize sets TickTick `parentId` / `childIds`.

| Case | Result |
|------|--------|
| AF-NEST-1 inbox (2nd fixture) | **pass** — child `…43c` → parent `…43b` |
| AF-NEST-AZ Active Zone siblings | **pass** — child under sibling; MOC stays parent of local parent |
| AF-NEST-DEEP grandchild | **pass** — `…43e` → `…43c` |

Prior: first AF-NEST-1 pass via markdown indent (`…438`/`…439`) in [`137-af-nest-gtd-pilot.md`](137-af-nest-gtd-pilot.md).

## Scope notes

- Docs/evidence catalog for nest behavior (not a bug).
- Pointer DnD UI gestures not separately instrumented; product path = Abyss hierarchy mutation → file indent → sync.
- Out of scope here: AF-GTD-TAG-ADD stage replace ([#137](https://github.com/semyon-alekseev-noveo/tt-sync/issues/137)); project/task **status** YAML sync (`docs/pilot/AF-STATUS-AXES.md`, follow-up).
