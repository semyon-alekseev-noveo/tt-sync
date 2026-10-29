# 230 — Dexie Reset + dual-zero fail-closed

| Field | Value |
|-------|--------|
| Issue | [#230](https://github.com/semyon-alekseev-noveo/tt-sync/issues/230) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) / matrix [#228](https://github.com/semyon-alekseev-noveo/tt-sync/issues/228) |
| Status | **unit pass**; live `ID-DEXIE-RESET-NO-WIPE` **pass** ×2 |
| Tip | `abyss-mapping` after [#236](https://github.com/semyon-alekseev-noveo/tt-sync/pull/236) (`27df318`); plugin `tickticksync-abyss` 2.0.94 tip install |
| Vault | Thinkpad-tts-test (pilot) |
| When | 2026-10-29 ~09:36–09:44 UTC |

## AF coverage

| AF ID | Unit | Live |
|-------|------|------|
| `ID-DEXIE-RESET-NO-WIPE` | **pass** (`massDeleteGuard.test.ts`) | **pass** ×2 (below) |
| `ID-DUALZERO-VAULT-DEXIE-EMPTY` | **pass** | **not run** |
| `ID-DUALZERO-STALE-DEXIE` | **pass** | **not run** |
| `ID-DUALZERO-VAULT-ONLY` | **pass** | **not run** |

## Behavior locked (unit)

- Reset / empty Dexie / checkPoint 0: orphan vault-line strip skipped; mass deletes `empty-dexie`.
- After refill with missing vault markers: `empty-vault` hold + Rebind offered; Skip does not Apply.
- Dual-zero cells B4–B6 fail-closed in unit (see tests).

## Live prove ×2 — `ID-DEXIE-RESET-NO-WIPE`

Method: Obsidian eval clears Dexie stores (same tables as `clearLocalSyncDatabase`) + `checkPoint=0` (no Settings CLI for Reset); then `command id=tickticksync-abyss:tts-sync`; disk marker counts. Never Apply.

Fixtures:

- `30 Tasks/301 Noveo_tasks/DON-253.md` — **10** `ticktick_id` markers
- `10 Projects/Подключение посудомойки.md` — **7** markers

| Prove | When (UTC) | Reset | Sync | Markers after | New deletion report | Dexie after |
|-------|------------|-------|------|---------------|---------------------|-------------|
| 1 | 09:36–09:40 | clear tables + cp0; sync + second sync | Executed | DON-253 **10**, dish **7** | none (latest still 07:53Z) | refill → **159** tasks; sync idle |
| 2 | 09:42–09:44 | clear verified `taskCount:0` + cp0; sync | Executed | DON-253 **10**, dish **7** | none | refill → **159**; idle |

Vault-local: `.tickticksync/_clear-dexie.js`, `_clear2.json` (not committed).

## Live plan (remaining)

- Dual-zero B4–B6 live still **not run** (needs empty-side fixtures; empty-TT remains #215).

## Checklist

- [x] AF IDs + named unit tests
- [x] TEST_PLAN rows for #230
- [x] Live `ID-DEXIE-RESET-NO-WIPE` prove ×2
- [ ] Dual-zero live (optional / separate)
- [x] Comment on #230 with tip evidence
