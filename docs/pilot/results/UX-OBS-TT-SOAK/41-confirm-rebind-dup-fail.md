# 41 — Confirm Rebind InsertLine duplicates (live fail after #273)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 41 (live fail / bug) |
| Case | `BUG-CONFIRM-REBIND-DUP` (extends `UX-SYNC-CONFIRM-REBIND`) |
| Status | **live pass ×2** (2026-11-17, 2.0.98) — unit fix verified on the pilot vault; see below |
| Related | #273 Confirm Rebind merge; gap [`40-confirm-rebind-gap.md`](./40-confirm-rebind-gap.md); ARCH-SYNC #257 Link tombstones |

## Meta

| Field | Value |
|-------|--------|
| Vault | Thinkpad-tts-test (pilot) |
| Note | `10 Projects/PKM - journaling.md` |
| Owner choice | Confirm → **Rebind** |
| Confirm PushDeleteTT ids | `6ae82058d07c7a23f9eed592`, `6ae82059d07c7a23f9eed593`, `6ae9baf1eec3d823f964606e` |

## Evidence (owner / journal)

- Journal `.tickticksync/journal/2026-11-04.jsonl` + write-trace: rematch `writeFile` during vaultDeletion **inserted** 3 lines (`newCount:3`) beside existing same-title lines that still carried older live markers (`…eed586`–`…eed591`).
- Confirm ids remained alive in TickTick → result = **duplicates**, not Link rewrite.
- Root cause: `findRebindLineIndex` refused to steal a same-title line whose marker was still in `allLiveIds`, so Confirm rematch fell through to InsertLine.

## Rule chosen (fix)

**Confirm Rebind only** (`applyConfirmRematch` → `allowDisplaceLiveSameTitle: true`): when the planned file already has a same-title checkbox, **Link-displace** that marker and stamp a Link tombstone for the displaced id — do not InsertLine a duplicate. Held Rematch / `ID-REBIND-DEDUP` leave the flag off so true multi-task same-title cases keep distinct lines.

## Checklist

- [x] Live fail recorded (this file)
- [x] AF case `BUG-CONFIRM-REBIND-DUP`
- [x] Unit named by case id
- [x] Pilot re-prove ×2 (2026-11-17, agent, 2.0.98) — **pass** (see below)

## Cleanup guidance (optional; do not auto-edit vault)

After tip install + Rebind prove: manually collapse duplicate same-title checkboxes in `PKM - journaling.md` (keep one line per intended TT task; drop InsertLine twins). Prefer leave vault as-is until owner confirms a safe cleanup path.

---

## Live re-prove — **pass ×2** (2026-11-17, 2.0.98, pilot vault)

| Field | Value |
|-------|--------|
| Plugin | tickticksync-abyss **2.0.98** (release asset) |
| Vault | Thinkpad-tts-test (pilot only) |
| Runner | agent — `obsidian-cli eval` (no CDP, no restart) + TickTick MCP |
| Backup | `/tmp/opencode/pilot-backup/tts-test-pre-41-20261116T040002Z.tgz` (79 MB, pre-run) |

Fixture shape (both proves): the note has one same-title checkbox with a **live** marker; a second TickTick task with the same title has its vault line removed (it was previously linked, so Dexie keeps `file`). Synchronize → Sync discrepancies Confirm (PushDeleteTT) → **Rebind**.

| Prove | Note | Confirm candidate | Result |
|-------|------|-------------------|--------|
| 1 | `30 Tasks/PROVE-41.md` | `6afbe9c8897972173772559e` | line marker displaced `6afa8241…` → `6afbe9c8…`; **one line**, no twin; journal `line delete` + `line create` on the same line; TT tasks untouched |
| 2 | `30 Tasks/PROVE-41B.md` | `6afbecba89797217377255a0` | line marker displaced `6afbec97…` → `6afbecba…`; **one line**, no twin; TT untouched |

Modal copy observed both times: «Sync discrepancies … Rebind vault to TickTick (no TT deletes)», reason «Their task lines were removed from Obsidian (or are no longer in the vault)». No InsertLine twins, no Apply once, no TT delete.

**Observation (not a blocker):** the displaced id from prove 1 (`6afa8241…`) re-appeared as a PushDeleteTT candidate on the next Synchronize — Link tombstones block the **same run** only, so the next run re-offers it; Rebind displaced it back. Worth tracking if it gets noisy.

Cleanup: both probe notes deleted; 5 probe TT tasks deleted; the `00 Inbox/abyss-active.md` probe line removed; vault scan has no `PROVE-41`; TickTick search empty.
