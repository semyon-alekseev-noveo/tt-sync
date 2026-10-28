# 34 — Post-restore held + Active Zone wipe (root cause)

| Field | Value |
|-------|--------|
| Issue | [#208](https://github.com/semyon-alekseev-noveo/tt-sync/issues/208) |
| Vault | Thinkpad-tts-test |
| Date | 2026-10-28 |
| Status | **root cause identified**; unit fix on `fix/bug-208-held-post-restore`; live prove **not run** |

## Owner question

«Почему инлайн задачи пропали? Ты их грохнул?»

## Answer

**Not a chat/agent `Write` of the project note.** Plugin Synchronize during **TT wipe** (empty account) ran **`tt→obs` line deletes** and emptied `## Active Zone`.

Evidence: `.tickticksync/journal/2026-10-28.jsonl` around `2026-10-28T04:47:29Z`, file `10 Projects/Подключение посудомойки.md`, `dir: tt->obs`, `op: delete` per checkbox (смеситель, мойка, столешница, …) until AZ blank. Write-trace `commitVaultText` same window. Journal path on pilot host: `<pilot-vault>/.tickticksync/journal/`.

## Then held deletions

TT restore → new task ids in TickTick → Dexie refill → vault AZ empty / no line markers → guard plans `vault-to-ticktick` deletes → modal (Skip only).

## Product work (#208) — this branch

1. Human copy: **Would delete from TickTick — missing vault line/marker** (`BUG-208-HELD-LABEL`)
2. Fail-closed: wipe-shaped delta → `empty-ticktick` (`BUG-208-EMPTY-TT-NO-AZ-STRIP` / `looksLikeTickTickWipe`)
3. Rematch: held modal **Rematch into vault (keep TickTick)** → rewrite lines from Dexie; no Apply (`BUG-208-REMATCH`)

## Owner now

Skip held until tip has this build. Then **Rematch into vault (keep TickTick)** — do **not** Apply. Prove ×2 before close.
