# 35 — BUG-208 Rematch prove (1 of 2)

| Field | Value |
|-------|--------|
| Issue | [#208](https://github.com/semyon-alekseev-noveo/tt-sync/issues/208) |
| Vault | Thinkpad-tts-test |
| Tip | local tip with rematch vault-only + `commitVaultText` (PR [#212](https://github.com/semyon-alekseev-noveo/tt-sync/pull/212) open; #211 merged) |
| When | 2026-10-28T15:10:01Z |
| Status | **pass** (prove 1) — second fixture/run still required before close |

## Evidence

- Guard report: `.tickticksync/reports/deletions-2026-10-28T15-09-57-609Z.md` — `Decision: rematch`, 159 task deletions held.
- Journal: `mass-delete-guard` choice `rematch` @ `2026-10-28T15:10:01.348Z`.
- write-trace: `phase=rematch` `commitVaultText` for:
  - `00 Inbox/abyss-active.md`
  - `10 Projects/Годовые задачи.md`
  - `10 Projects/Подключение посудомойки.md`
  - `10 Projects/PKM - journaling.md`
  - `10 Projects/оборудовать рабочее место.md`

## Vault after

| Note | `ticktick_id` markers |
|------|------------------------|
| `10 Projects/Подключение посудомойки.md` | 7 (AZ restored: смеситель, мойка, столешница, …) |
| `10 Projects/Годовые задачи.md` | 5 |
| `10 Projects/оборудовать рабочее место.md` | 3 |
| `10 Projects/PKM - journaling.md` | 3 |
| `00 Inbox/abyss-active.md` | 141 |

Earlier Rematch @ 13:57 / 14:35 on tip without vault-only write left AZ empty — void for prove.

## Blocker after prove 1

Owner Synchronize after Rematch aborted with **File already exists** creating Notebook NOTE `00 Inbox/.cursorrules (dbb8c8ff).md` (file already on disk; Obsidian often does not index leading-dot basenames, so MVP tried create again). Keyboard-garbled report: «ынтс афшдув…» → *sync failed file already exists. check*.

Fix: `notebookVault` strip leading `.` + catch exists (PR #212 follow-up). Prove 2 waits on tip reload.

## Next

1. Tip with notebook create fix; reload Obsidian.
2. Synchronize (Skip / Rematch only if held again): expect no `File already exists`; quiet or small held plan — prove 2.
3. Then close #208.
