# Stub cleanup prove ×2 (UX-STUB-1 / BUG-LIST-STUB-RECREATE)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Cases | UX-STUB-1, BUG-LIST-STUB-RECREATE |
| Plugin | tickticksync-abyss **2.0.94** (merged tip, no version bump) |
| Tip | `343284ebb6c2b50af7a910343149ec85f06546ea` (merge #179); stub fix `68a98228c08c7d795da3fb25024e73e58cf9c81f` |
| Vault | Thinkpad-tts-test (paths vault-relative) |
| Runner | agent (Obsidian CLI `tickticksync-abyss:tts-sync`) |
| Status | **pass** ×2 |
| Recorded | 2026-10-27 ~10:00 UTC |

## Inputs

- Prior inventory: [`07-ticktick-folder-stubs.md`](07-ticktick-folder-stubs.md)
- Merged PR: [#179](https://github.com/semyon-alekseev-noveo/tt-sync/pull/179)
- Pilot settings (safe): `projectSchemeEnabled=true`, `abyssTasksFormat=true`, `syncScopeFolders` = `00 Inbox/`, `10 Projects/`, `30 Tasks/`, `newTasksFile=""`, `TickTickTasksFilePath=30 Tasks/TickTick`, `syncedLists` = six TTS-* lists

## Evidence

### Install

1. Checked out `abyss-mapping` at merge tip `343284e`.
2. `npm run build` → `dist/main.js` / `manifest.json` / `styles.css` (**2.0.94**).
3. Copied into `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/`; `cmp` matched; `plugin:reload` → version **2.0.94**.

### Vault cleanup (list stubs only)

Deleted before prove syncs:

- `30 Tasks/TickTick/TTS-*.md` (6 stubs) then empty `30 Tasks/TickTick/`
- `zz-parked-17/30 Tasks/TickTick/TTS-*.md` (5 stubs) then empty TickTick + empty `zz-parked-17/30 Tasks/`

Kept:

- `10 Projects/TTS-*.md` (4 project notes)
- Real task folders under `30 Tasks/301…` / `302…` / `303…` / `399…`

### Prove 1 — Synchronize

| Step | Result |
|------|--------|
| Clear stuck `syncRunning` | done |
| `obsidian … command id=tickticksync-abyss:tts-sync` | **Executed** (~09:54:45Z) |
| Activity | `.tickticksync/write-trace.jsonl` grew; sample `in-sync` on `10 Projects/UX-*.md` / `00 Inbox/UX-FOOL-capture…` @ `2026-10-27T09:54:49Z` |
| `checkPoint` | unchanged this pass (idle delta); `syncRunning` stayed true (known sticky flag) |
| Live `30 Tasks/TickTick/TTS-*.md` | **absent** |
| Parked `zz-parked-17/…/TickTick/TTS-*.md` | **absent** |
| Any `TickTick` dir | **absent** |
| Journal stub creates in prove window | **none** |
| Write-trace `TickTick/TTS-*` after 09:54 | **0** |

**Prove 1: pass**

### Prove 2 — unrelated touch + Synchronize

| Step | Result |
|------|--------|
| Touch | `00 Inbox/ux-stub-prove2-touch.md` (unrelated note) |
| Clear `syncRunning` | done |
| `tts-sync` | **Executed** (~09:59:54Z) |
| Activity | write-trace grew `45461643` → `45631748`; `checkPoint` `1793093206267` → `1793093417200` |
| Sample | `in-sync` on project/inbox notes @ `2026-10-27T10:00:16Z` |
| Live / parked stubs / `TickTick` dirs | still **absent** |
| Write-trace TickTick stub refs in prove2 window | **none** |
| Project notes + `30 Tasks/301…` | still present |

**Prove 2: pass**

## Conclusion

After #179 tip deploy and deleting list stubs, two Synchronize runs did **not** recreate `30 Tasks/TickTick/TTS-*.md` or `zz-parked-17/…/TickTick` stubs. UX-STUB-1 and BUG-LIST-STUB-RECREATE are live **pass** ×2 on pilot (build still labeled **2.0.94** until a bump).

## Checklist

- [x] Merge tip built and installed to pilot plugin folder
- [x] List stubs deleted; project notes / 301… kept
- [x] Prove 1 Synchronize — stubs stay gone
- [x] Prove 2 Synchronize (after unrelated touch) — stubs stay gone
- [ ] Optional: Dexie `files` parked-path rows confirmed empty (not probed this run)
