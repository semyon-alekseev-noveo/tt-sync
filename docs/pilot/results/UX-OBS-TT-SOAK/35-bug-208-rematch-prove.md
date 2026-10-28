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

## Next

1. Merge #212 if not yet.
2. Second Synchronize: expect quiet or much smaller held plan (prove 2 / different check).
3. Then close #208.
