# 35 — BUG-208 Rematch prove (2 of 2)

| Field | Value |
|-------|--------|
| Issue | [#208](https://github.com/semyon-alekseev-noveo/tt-sync/issues/208) |
| Vault | Thinkpad-tts-test |
| Tip | abyss-mapping tip after #242 (`2.0.94`) |
| Status | **pass** ×2 (prove 1 + prove 2) |

## What this proves (plain language)

After restore/reset the plugin can show a held list: “would delete from TickTick because the vault line/marker is missing.” Choosing **Rematch into vault** puts the missing checkboxes back into the notes. It must **not** Apply (wipe TT) and must **not** crash on Notebook “File already exists”.

(Separate feature: **Rebind** rewriting stale ids — that was #216, already closed.)

## Prove 1 — 2026-10-28T15:10:01Z

- Report: `deletions-2026-10-28T15-09-57-609Z.md` — Decision `rematch`, 159 held.
- Journal: `mass-delete-guard` choice `rematch`.
- write-trace `phase=rematch` into dishwasher / годовые / PKM / рабочее место / abyss-active.
- AZ markers restored (dishwasher 7, etc.).

Blocker after prove 1: Notebook create `File already exists` on `.cursorrules` — fixed in #212.

## Prove 2 — 2026-11-02T05:32:13Z (different fixture)

Method: strip all `ticktick_id` markers on `PKM - journaling.md` + one marker on `Годовые задачи.md` → Synchronize → click **Rematch** (not Apply).

| Check | Result |
|-------|--------|
| Report Decision | `rematch` (`deletions-2026-11-02T05-32-13-295Z.md`) |
| Journal choice | `rematch` @ 05:32:13Z |
| Honest label | `Would delete from TickTick — missing vault line/marker` |
| PKM markers after | 3 (lines back) |
| Годовые markers after | 5 |
| Notebook `File already exists` | **none** |
| Apply | **not** clicked |

Vault-local: `.tickticksync/_prove208-2-result.json`.

Note: Rematch wrote Dexie ghost ids from pre–empty-TT rows; markers re-mapped to live TT ids via existing idMap cleanup (same session). Does not void Rematch pass.

## Conclusion

`BUG-208` Rematch live **pass** ×2. Safe to close #208.
