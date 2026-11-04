# 41 — Confirm Rebind InsertLine duplicates (live fail after #273)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 41 (live fail / bug) |
| Case | `BUG-CONFIRM-REBIND-DUP` (extends `UX-SYNC-CONFIRM-REBIND`) |
| Status | **live fail** recorded; unit fix this PR; pilot re-prove **not run** |
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
- [ ] Pilot re-prove ×2 after tip install (**not run** — owner)

## Cleanup guidance (optional; do not auto-edit vault)

After tip install + Rebind prove: manually collapse duplicate same-title checkboxes in `PKM - journaling.md` (keep one line per intended TT task; drop InsertLine twins). Prefer leave vault as-is until owner confirms a safe cleanup path.
