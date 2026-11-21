# 54 — AF-FMT-OFF-LIST-MOVE (#306) live prove ×2 (pilot, real fixture)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Case | `AF-FMT-OFF-LIST-MOVE` / issue [#306](https://github.com/semyon-alekseev-noveo/tt-sync/issues/306) |
| Status | **live pass ×2 + causal negative control** (2026-11-21) |
| Plugin | tickticksync-abyss **2.0.99** (`main.js` sha256 `a3113a4b…88e347`, byte-identical to 2.0.98/2.0.99 assets) |
| Vault | Thinkpad-tts-test (pilot only) |
| Runner | agent — `obsidian-cli` + `obsidian-cli eval` + TickTick REST via plugin session |
| Backup | `/tmp/opencode/pilot-backup/tts-test-pre-306-20261120.tgz` (79 MB, pre-run) |

## Why the 2026-11-14 attempt was inconclusive

`isProjectIdChanged` (the only caller of `handleTickTickStructureMove`) requires `filepathHasDefaultProjectID` of the task's file, and the pilot had **zero** files with a `defaultProjectId` — the structure-move path was unreachable in both builds. This run fixes the fixture.

## Fixture (per cycle)

1. `30 Tasks/PROVE-306*.md` with one marked line; the note gets `defaultProjectId = WIP` through the real **Settings → palette → `TickTickSync: set default project for file`** dropdown (`SetDefaultProjectForFileModal` → `updateFileMetadata`).
2. `abyssTasksFormat` flipped **OFF** (data.json + plugin reload; `syncEnabled` stays false — manual Synchronize only).
3. TT-side list change **WIP → nextAction** via the plugin session API (`projectMove`), then manual Synchronize.

## Runs

| # | Fixture | Gate state | Result |
|---|---------|-----------|--------|
| 1 | `PROVE-306.md` / task `6b01961f…` | shipped `abyssLineInPlace` (true via scheme + push scope) | line **stayed** in `PROVE-306.md`, marker intact; char followed the list (`[/]` → `[!]`, #305 behavior) |
| control | same line | local build `dist/main.js` `dc8f8a9f…` with `abyssLineInPlace` forced `return false` (never shipped, source reverted after build) | line **RELOCATED** to the note owning nextAction — scenario reachable; the gate is what held runs 1/2 |
| 2 | `PROVE-306C.md` / task `6b019bc4…` | shipped build restored (`a3113a4b…`) | line **stayed** with marker intact despite the OFF-mode list stubs (`30 Tasks/nextAction.md` etc.) being recreated beside it |

Honest notes:

- Between run 1 and the control the marker on the control-moved line later detached (`%%tt-detached%%`) on a second gated move — OFF-mode churn on an already-relocated line; recorded as an observation, not part of the prove pair.
- OFF mode recreated the five list-stub files and pulled orphan tasks into them (G1 / `UX-STUB-1` behavior from the OFF matrix). All cleanup was done by deleting the stub files + `Reset local sync cache` + Synchronize (the tail-`25` proven path): **no marker lost** — every `ticktick_id` from the pre-run backup is still in the vault; `10 Projects/` and `30 Tasks/` are byte-identical to the backup; abyss-active re-linked +16 orphan rows (legitimate capture-file re-link after re-pull).
- Probe tasks deleted in TickTick; probe notes deleted; plugin left on the shipped 2.0.99 bytes with `abyssTasksFormat: true`.

## Conclusion

`AF-FMT-OFF-LIST-MOVE (#306)` → **live pass ×2** with a causal negative control. The gate is effective and the scenario is reachable on a real project/default-project fixture. #306 can close.
