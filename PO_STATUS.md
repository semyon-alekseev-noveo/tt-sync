# Product owner brief — TickTickSync Abyss fork (project scheme)

**Обновлено:** 2026-10-24  
**Audience:** Product owner / decision maker  
**Repo:** `tickticksync` branch `abyss-mapping`  
**Test vault:** `<pilot-vault>` (copy only; live vault `<live-vault>` untouched)  
**Install:** BRAT → `https://github.com/semyon-alekseev-noveo/tt-sync` track **latest release** (**2.0.90** after tag); plugin id **`tickticksync-abyss`** — `docs/BRAT_INSTALL.md`. Preset: `00 Inbox/TTS-data-preset.json`.

История изменений — только в `CHANGELOG.md`; здесь — снимок для PO.

## Context

- Релиз **2.0.48** на `abyss-mapping`: PR #1 (fail-closed pull, debounce open-note 5s, BUG-COMMENT-INLINE, интеграционный тест). Релиз **2.0.47**: BUG-COMMENT-1 / BUG-TAG-1.
- Abyss-first: задачи живут там, где их кладёт Abyss; TT зеркалит теги/списки и родителей-проекты (`ABYSS_FIRST_PLAN.md`, топология R / CASE-T4 отложена).
- Комментарии Abyss → TickTick **Comments API** (`syncAbyssCommentsViaApi`, по умолчанию вкл.); описание остаётся в `content`.
- Живой vault не трогаем; пилот — только `<pilot-vault>`. Ручной синк. Токен `tp_…` из чата — **отозван** (2026-10-25, [#32](https://github.com/semyon-alekseev-noveo/tt-sync/issues/32)).
- Аналитический мит 2026-10-19 (три аналитика) — см. раздел ниже.

## Target

1. **Надёжный sync без тихих сбоев:** любая ошибка pull/push видна пользователю, чекпоинт не обманывает.
2. **Abyss-комментарии и теги стабильны:** правка дочерней строки и TT-only изменения комментариев доезжают без ручных обходов.
3. **Безопасный запуск на живом vault:** Step 6 (кейсы AF-*) и Step 8, плюс soak NOTE-L3b на пилоте. Один живой прогон, не отдельный набор.
4. **Поддерживаемость:** интеграционный тест `synchronizationInner` есть на этой ветке. Цикл `main` ↔ `services` снят (`PluginContext`); sync phases/store ports extracted (#31); god-класс `TickTickService` ещё open.

## Validation

- Релиз **2.0.90** (2026-10-25): **AF-GTD-TAG-ADD** Option A + hash-stuck (#140/#141) — last stage tag wins list; vault rewrite; prove×2 pass. Also ships nest/GTD pilot docs. Tag after bump PR merges.
- Релиз **2.0.89** (2026-10-24): **API-seed comment map** from [#120](https://github.com/semyon-alekseev-noveo/tt-sync/pull/120) (#104) — equal-key link upserts the TickTick id so a later TT delete is a mapped miss (no re-POST). Tip prove×2 (API-seed + vault-first) pass before merge; #104 **closed**. BRAT install after tag.
- Релиз **2.0.88** (2026-10-24): **F1/F1b** from [#118](https://github.com/semyon-alekseev-noveo/tt-sync/pull/118) (#104). Box re-prove **fail**: API-seed comment re-POSTed, bullet kept, `syncedLists` empty (`104-live-2.0.88-box.md`). #104 **reopened** until [#120](https://github.com/semyon-alekseev-noveo/tt-sync/pull/120). Vault-first tip prove×2 does not cover that path.
- Релиз **2.0.87** (2026-10-24): **BUG-COMMENT-DELETE-REPOST** from [#112](https://github.com/semyon-alekseev-noveo/tt-sync/pull/112) (#104) — no create on single mapped miss; strip when live GET empty despite stale Dexie count. Owner re-prove on **2.0.87** still **fail** (F1).
- Релиз **2.0.86** (2026-10-23): **TP-COMMENT-TT-DELETE** unit fix from [#108](https://github.com/semyon-alekseev-noveo/tt-sync/pull/108) (#104) — single mapped miss waits for pull. Live **fail** (`104-live-2.0.86.md`).
- Релиз **2.0.85** (2026-10-23): PERF/DELTA slice 5 from [#99](https://github.com/semyon-alekseev-noveo/tt-sync/pull/99) (#98) — cut quiet `getTaskById` / `TP-IDLE-BYID-ZERO`. Live `#85` **pass**: byId **0**, comments **0**, `totalMs` ~7 s (`PERF-DELTA/85-idle-zero-2.0.85.md`). Epic [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) **closed** (idle/wall-time; `TP-DELTA-*` → [#84](https://github.com/semyon-alekseev-noveo/tt-sync/issues/84)); evidence `PERF-DELTA/62-epic-close.md`. Post-PERF [#102](https://github.com/semyon-alekseev-noveo/tt-sync/issues/102) done; #104 unit on tip.
- Релиз **2.0.84** (2026-10-23): PERF/DELTA slice 4 from [#95](https://github.com/semyon-alekseev-noveo/tt-sync/pull/95) (#94) — empty-thread skip + `deferCommentSweep` / `TP-IDLE-EMPTY-SWEEP`. Live quiet: comments **0**, byId **44**, `totalMs` ~18 s (`PERF-DELTA/84-idle-zero-2.0.84.md`); idle-zero still fail on byId.
- Релиз **2.0.83** (2026-10-23): PERF/DELTA slice 3 from [#91](https://github.com/semyon-alekseev-noveo/tt-sync/pull/91) (#83) — stop double comment-sweep / `TP-IDLE-MANUAL-SCOPE`. Live quiet comments **871** (`PERF-DELTA/83-idle-zero-2.0.83.md`).
- Релиз **2.0.82** (2026-10-23): PERF/DELTA slice 2 from [#88](https://github.com/semyon-alekseev-noveo/tt-sync/pull/88) (#82) — `commentCount` backfill + idle-fast sync / `preparePersistNetwork` gate. Live `TP-IDLE-ZERO` **fail** (`getTaskComments` **1741**; `PERF-DELTA/82-idle-zero-2.0.82.md`).
- Релиз **2.0.81** (2026-10-23): PERF/DELTA slice 1 from [#79](https://github.com/semyon-alekseev-noveo/tt-sync/pull/79) — idle skip `getTaskComments` when vault threads already match `commentCount`. Live `TP-IDLE-ZERO` **fail** (1757 comment GETs; `PERF-DELTA/81-idle-zero-2.0.81.md`).
- Релиз **2.0.80** (2026-10-22): **BUG-COMMENT-VAULT-DUP-KEY** (#27) quiet-sync rewrite; merge [#60](https://github.com/semyon-alekseev-noveo/tt-sync/pull/60); Vitest **701**. Pilot `task-11-16` stays **4** bullets after release deploy (`docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/60-release-2.0.80-smoke.md`). #27 closed; #28/#29 stay open (unit-only).
- Релиз **2.0.79** (2026-10-22): **BUG-COMMENT-EMPTY-VAULT-WIPE** (#28), **BUG-COMMENT-GET-FAIL-OPEN** (#29) via [#58](https://github.com/semyon-alekseev-noveo/tt-sync/pull/58) (also merge collapse for #27, insufficient alone). Vitest **697**. Synchronize smoke **pass**; #27 twins remained until **2.0.80**.
- Релиз **2.0.78** (2026-10-22): modularization tip (**2.0.77**) + re-cut **BUG-COMMENT-ABYSS-VIEW** / **BUG-COMMENT-DUP-STAMP** (was open #24/#26). Combined PR into `abyss-mapping`; closes obsolete #24/#26/#54.
- Релиз **2.0.77** (2026-10-22): **TECH-SYNC-MODULARIZATION** (#31) — PRs #34–#40 on `abyss-mapping` (phases, lifecycle, vault-io, PluginContext, taskParser, TMD, store ports). Vitest **688**. Modularization-only tip (comment fixes were not ancestors).
- Релиз **2.0.76** (2026-10-21): **BUG-COMMENT-DUP-STAMP** — dedupe stamped+plain TT Comments; plain-only POST; skip create when key present. Vitest **685**. Pilot **pass** `docs/pilot/results/BUG-COMMENT-DUP-STAMP/` (`task-11-16` → 4 plain Comments).
- Пилот **2.0.76** (2026-10-21): **#16** open-note/editor — **pass** (4 rows); filed **BUG-COMMENT-VAULT-DUP-KEY** [#27](https://github.com/semyon-alekseev-noveo/tt-sync/issues/27) (vault stamp twins). Evidence `docs/pilot/results/PILOT-BATCH-EDITOR-SAFETY/`.
- Релиз **2.0.75** (2026-10-21): **BUG-COMMENT-ABYSS-VIEW** — Abyss `vault.modify` schedules 5s open-note push; flush without active markdown leaf. Pilot pass `docs/pilot/results/BUG-COMMENT-ABYSS-VIEW/`. Vitest **682**.
- Релиз **2.0.74** (2026-10-21): **BUG-COMMENT-API-POST-500** — v2 comment POST uses webapp body; **PILOT-GATE-TEST-11-12** pass. Vitest **680**.
- Релиз **2.0.64** (2026-10-21): **BUG-COMMENT-BOTH-WAYS** — при расхождении с обеих сторон reconcile пушит vault-only комменты в TT и не пропускает pull TT-only. Vitest **659**.
- Релиз **2.0.63** (2026-10-21): **BUG-COMMENT-TT-AHEAD-NO-DELETE** — не удалять TT Comments, которых ещё нет в vault (push до pull). Включает **2.0.61**/**2.0.62**. Vitest **658**.
- Релиз **2.0.62** (2026-10-21): **BUG-COMMENT-STALE-MAPS** — после массового wipe в TT снова пушит несколько vault-комментов со stale maps; reconcile не блокируется guard `skip` для vault-ahead. Vitest **657**. Пилот — **partial** (`TEST_PLAN.md`).
- Релиз **2.0.61** (2026-10-21): **BUG-COMMENT-NO-MASS-DELETE** — push path no longer deletes mapped TT comments when API list is empty or when adding a new vault bullet. Vitest **655**.
- Релиз **2.0.60** (2026-10-21): hotfix — `vaultHasUnpushedCommentThreads` restores **TP-COMMENT-TT-DELETE** while keeping **BUG-COMMENT-VAULT-AHEAD** push. Vitest **653**.
- Релиз **2.0.59** (2026-10-21): **BUG-COMMENT-VAULT-AHEAD**, **BUG-COMMENT-MERGE-NO-STRIP**, **BUG-COMMENT-MANUAL-PRE-PULL**. Vitest **652**. Superseded by **2.0.60** for TT-delete regression.
- Релиз **2.0.58** (2026-10-21): PR #9 comment sync wire — normalized keys (`planCommentSync`, **BUG-COMMENT-KEY-EQUIV**), no TT wipe when vault has no comment bullets (**BUG-COMMENT-NO-TT-WIPE**), active note in pre-pull push (**BUG-COMMENT-ACTIVE-NOTE**); `SyncRunContext` / `preparePhase` scaffold. Vitest **649**. Пилот NOTE-L3b / comment cases — **not run** (Thinkpad-tts-test).
- Релиз **2.0.57** (2026-10-21): **BUG-DEFERRED-ID-PHASE2-DELETE** (pending marker guard in Phase 2 deletion; `pendingMarkerTaskIds`, prune at sync start). Vitest **635**. Пилот `BUG-DEFERRED-ID-PHASE2-DELETE` — **not run** (vault Thinkpad-tts-test).
- Релиз **2.0.56** (2026-10-21): **BUG-EMPTY-EDITOR-DISK** (`repairEmptyEditorFromDisk`, disk fallback in `readNoteForWrite`, disk sync after open patch). Vitest **634**. Пилот `TP-EMPTY-EDITOR-DISK` — **not run** (vault Thinkpad-tts-test).
- Релиз **2.0.55** (2026-10-21): PR #6 **BUG-OPEN-NOTE-BUFFER** (`syncRead`, defer under caret, `lastVaultSync`, write trace). Vitest **631**. Пилот open-note-buffer и см. `TEST_PLAN.md` — **not run** (vault Thinkpad-tts-test).
- Релиз **2.0.54** (2026-10-20): PR #4 **BUG-STALE-EDITOR-WRITE** (`commitVaultText`, journal editor patches); PR #5 mass-deletion / empty-side guard. Vitest **625**. Пилот hotfix и `TP-EMPTY-SIDE-GUARD` — **not run** (`TEST_PLAN.md`).
- Релиз **2.0.47:** `npx vitest run` — 67 файлов, 550 тестов.
- Пилот **2.0.48** (2026-10-20): debounce/open-note — pass; NOTE-L3b / Comments API — **fail**; DEL-1 — pass. Детали в `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md`, `CHANGELOG.md`.
- Релиз **2.0.53** (2026-10-20): idle sync без `getTaskById` на тихую задачу; эхо по `etag`; `getTaskComments` только при расхождении `commentCount`. Vitest **589**. Пилот `TP-IDLE-ZERO` — not run.
- Релиз **2.0.54** включает **EMPTY-SIDE-GUARD**: порог массового удаления и пустая сторона держат удаления и чекпоинт. Пилот `TP-EMPTY-SIDE-GUARD` — **not run**.
- Релиз **2.0.52** (2026-10-20): vault-комментарий сохраняется при перерисовке строки; пилот NOTE-L3b — not run.
- Релиз **2.0.51** (2026-10-20): PR #3 — `lastVaultPushWallMs`, delta `add`; пилот NOTE-L3b — **fail**.
- Релиз **2.0.50** (2026-10-20): PR #2 — id index, file-run cache, `[perf]`; 584 tests. Пилот TP-PERF-* частично (`TEST_PLAN.md`).
- Детали и даты прогонов — в `CHANGELOG.md`.

## Problems

| ID | Приоритет | Статус | Суть |
|----|-----------|--------|------|
| **BUG-COMMENT-1** | P1 | resolved в 2.0.47 | Комментарии не синкались при неизменном hash; нужен live-soak NOTE-L3b |
| **BUG-TAG-1** | P2 | mitigated в 2.0.47 | Дубли `note/`/`proj/`; на «грязных» задачах нужен один re-sync (CTX-D2) |
| **BUG-SYNC-SILENT-FAIL** | P1 | fixed on this branch | `getUpdatedTasks` бросает `TickTickPullError`, `syncTickTickWithDexie` пробрасывает, `synchronizationInner` возвращает `{ok:false}`. Notice: «Sync failed: …». Чекпоинт не двигается. Не релиз |
| **BUG-NOTICE-1** | P1 | fixed on this branch | Текст загрузки собирается в `formatPluginLoadedNotice` (`src/sync/result.ts`), без сломанного приоритета `+` / `?:` |
| **BUG-COMMENT-INLINE** | P1 | fixed on this branch | Дочерняя comment/description строка вызывает `checkLineForModifications` родителя. Соседние comment-буллеты — отдельные треды (`extractAbyssCommentThreads`) |
| **RISK-OPEN-FILE-EDIT** | P1 | mitigated on this branch | После 5 с тишины `editor-change` пушит строки с `ticktick_id`, кроме незакрытой строки захвата (`%%`). **BUG-COMMENT-ABYSS-VIEW**: `vault.modify` тоже планирует тот же debounce (Abyss view); flush не требует active markdown leaf. |
| **BUG-COMMENT-ABYSS-VIEW** | P0 | **pass** (**2.0.75**) | Коммент из Abyss view → TT Comments: `vault.modify` планирует 5s push; flush без active markdown leaf. Evidence: `docs/pilot/results/BUG-COMMENT-ABYSS-VIEW/`. Issue #23. |
| **BUG-COMMENT-DUP-STAMP** | P0 | **pass** (**2.0.76**, on tip **2.0.78**) | После Abyss push: пары stamped+plain в TT Comments на один vault-тред. Fixed: dedupe by key, plain-only POST, skip create when key present. Issue [#25](https://github.com/semyon-alekseev-noveo/tt-sync/issues/25) closed. |
| **BUG-PULL-COMMENT-STALE** | P2 | fixed on this branch | `vaultLineBehindTask` сравнивает отпечатки Comments API. `getTaskById` только если заголовок/статус/content уже совпали; повторного вызова в цикле vault-sync нет. Комментарии кэшируются на задаче (`_apiComments`) |
| **RISK-PULL-WINS-LOCAL** | P2 | open | При победе локальной версии в LWW строка в vault может остаться устаревшей |
| **BUG-COMMENT-MAP-ORPHAN** | P2 | fixed on this branch | `deleteCommentMapsForTask` вызывается из `TaskRepository` (delete/hard delete/purge), `markTaskDeleted` и pull при удалённой на TT задаче |
| **PILOT-GATE-TEST-11-12** | P0 | **pass** (**2.0.74**) | `test-11-12` → TT Comments `comment 1` + `test-new-verision`. Evidence: `docs/pilot/results/PILOT-GATE-TEST-11-12/16-phase-3b-verify.md`. Корневой фикс **BUG-COMMENT-API-POST-500** (#21). Issues #10–#14/#21 closed. |
| **BUG-COMMENT-NO-PUSH** | P0 | **resolved** on **2.0.89** (also **2.0.85**) | Child comment → TT Comments; vault bullet kept. Evidence: `NOTE-L3B-RECHECK/65-note-l3b-2.0.89.md` (#65). Historical **2.0.51** fail. |
| **BUG-STALE-EDITOR-WRITE** | P0 | **resolved** (**2.0.54** code; pilot cluster **pass** on **2.0.76** / [#16](https://github.com/semyon-alekseev-noveo/tt-sync/issues/16)) | Открытая заметка переписывалась из снимка до Comments API. |
| **BUG-OPEN-NOTE-BUFFER** | P0 | **resolved** (**2.0.55** code; same #16 pilot **pass**) | Буфер открытой заметки откатывался при sync/push. |
| **BUG-EMPTY-EDITOR-DISK** | P0 | fixed в **2.0.56** (pilot **pass** on **2.0.76**) | Диск с текстом, markdown view пустой после reopen. **TP-EMPTY-EDITOR-DISK** pilot pass `#16`. |
| **BUG-DEFERRED-ID-PHASE2-DELETE** | P0 | fixed в **2.0.57** (pilot **not run**) | Создание в TT при открытой daily note: id в файл отложен (`commitVaultText` caret), Dexie уже знает задачу → ложный «удалена из Obsidian»; в строке нет `%%[ticktick_id:: …]%%`, Abyss view пусто. Guard: `registerPendingMarkerTaskId`, skip Phase 2 delete, `prunePendingMarkerTaskIds` at sync start. |
| **BUG-ACTIVEZONE-COMMENT-SHUFFLE** | P1 | **resolved** on **2.0.89** tip (#134) | `repairProjectNoteTasks` keeps Abyss comments with each sibling (#19). Pilot **pass** ×2: `BUG-ACTIVEZONE-COMMENT-SHUFFLE/19-prove-2.0.89.md`. |
| **BUG-TICKTICK-ID-LEAK** | P1 | mitigated on branch | Канонический `%%[ticktick_id:: <24hex>]%%`, strip loose fragment из title; тест `bugTicktickIdLeak.test.ts`. Почистить дубли в TT вручную. |
| **AF-GTD-TAG-ADD** | P1 | **resolved** (#140+#141+#144) | Option A **kept** (PO 2026-10-25). Independence from Abyss: exclusivity in TTS. Intent **AF-GTD-STAGE-MOVE**. Planned rename `type/*`→`gtd/*`: `docs/pilot/AF-GTD-PREFIX.md`. Checkbox GTD parked. |
| **NOTE-BODY** | P2 | partial ([#152](https://github.com/semyon-alekseev-noveo/tt-sync/issues/152)) | Unit **pass** (delimiter ↔ `content`/`desc` + BUG-NOTE-BODY-WIPE); live BODY-1/2 **not run**. Brief §5 working answers. |
| **FEAT-NOTEBOOK** | P2 | open (M–L) | TickTick Notebook ↔ vault — [#159](https://github.com/semyon-alekseev-noveo/tt-sync/issues/159); brief `docs/pilot/NOTEBOOK.md`. **Not** task-body Notes. |
| **BUG-NOTEBOOK-NO-DELETE** | P1 | open | Sync must not delete TT Notebook notes — [#160](https://github.com/semyon-alekseev-noveo/tt-sync/issues/160). Safety before FEAT MVP. |
| **GAP-COMMENT-EDIT** | P2 | open | Правка комментария = delete + add (новые ID, шум в ленте TT) |
| **RISK-DUAL-STORE** | P2 | open | Две «истины»: Dexie `tasks` и `fileMetadata`/`syncFiles` → возможен дрейф |
| **RISK-LARGE-VAULT** | P2 | partial (#62 slice 1) | `idsPresentInVault` + file cache; idle `getTaskById` already 0; idle `getTaskComments` only on count mismatch / unknown count / stamp twins (not every vault thread). `ensureVaultFilesRegistered` still walks all `.md` |
| **TECH-START-1** | P2 | open | Полный pull на старте блокирует инициализацию |
| **TECH-API-1** | P1 | partial (playbook + contract via [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66)) | Live TT breakage risk remains; #66 closed for modularization DoD |
| **TECH-CIRC-1 / GOD-1/2** | P2 | **resolved** ([#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66) A–G) | Cycle CI + 0 file-size exceptions on tip |
| **DOC-STALE-1** | P3 | mitigated on this branch | Канон: `DEV_FLOW.md`, `PO_STATUS.md`, `ABYSS_FIRST_PLAN.md`. `GTD_SYNC_*`, `TT_ABYSS_ROADMAP.md`, `SYNC_PROJECTS_AND_SUBTASKS.md` — архив. Comments API описан в `ABYSS_NOTES_ALIGNMENT.md` |
| **SEC-CREDS-1** | P1 | **resolved** 2026-10-25 | `tp_…` revoke + live auth: session cookie (not Open API); autologin password-in-`data.json` stays opt-in — exclude from vault sync if on. Step 8.0 in `ABYSS_FIRST_PLAN.md`. [#32](https://github.com/semyon-alekseev-noveo/tt-sync/issues/32). |
| Прежние | — | mitigated | Pilot `data.json` drift **resolved** on Thinkpad-tts-test **2.0.89** ([#64](https://github.com/semyon-alekseev-noveo/tt-sync/issues/64)). |

## Redo journal

Каждый синк пишет журнал `<vault>/.tickticksync/journal/YYYY-MM-DD.jsonl` до изменения (`src/redo/log.ts`). Откат: палитра **Undo last sync (preview first)** и **Preview undo of last sync (dry run only)** (`planUndo` в `src/redo/rollback.ts`, команды в `src/redo/commands.ts`). Откат сам пишется в журнал. Выключить плагин: Settings → Community plugins → TickTickSync. На живом vault этот откат не прогонялся.

## To Be Done

1. Editor-safety epic [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15) **closed** (#16 partial; #17/#18/#28/#29 **pass** on **2.0.89**).
2. [#64](https://github.com/semyon-alekseev-noveo/tt-sync/issues/64) / [#65](https://github.com/semyon-alekseev-noveo/tt-sync/issues/65) **closed** (pass on **2.0.89**). #104 closed; BRAT **2.0.89** on pilot.
3. `TP-DELTA-*` app UI still **not run** → [#84](https://github.com/semyon-alekseev-noveo/tt-sync/issues/84). Idle-zero **pass** on **2.0.85**.
4. **BUG-ACTIVEZONE-COMMENT-SHUFFLE** [#19](https://github.com/semyon-alekseev-noveo/tt-sync/issues/19) — **closed**; pilot **pass** ×2 on tip after #134.
5. Step 7 AF soak [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20) + [#76](https://github.com/semyon-alekseev-noveo/tt-sync/issues/76) **closed** (**pass** on **2.0.89**). Step 8 live vault still closed.
6. Open: GAP-COMMENT-EDIT / risks ([#63](https://github.com/semyon-alekseev-noveo/tt-sync/issues/63)); TECH-START-1; TECH-API-1 live. [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66) / [#32](https://github.com/semyon-alekseev-noveo/tt-sync/issues/32) / [#137](https://github.com/semyon-alekseev-noveo/tt-sync/issues/137) **closed**.
7. AF-NEST-1 nest→TT hierarchy **pass** on pilot — usable; deepen only if Active Zone sibling-nest vs MOC parent matters.
8. **AF-GTD-PREFIX** + release **2.0.91** — **done** (tagged); [#66](https://github.com/semyon-alekseev-noveo/tt-sync/issues/66) A–G **closed** (cycle/size DoD).
9. **NOTE-BODY** [#152](https://github.com/semyon-alekseev-noveo/tt-sync/issues/152): unit discovery green; **live** BODY-1 then BODY-2 on pilot still open.
10. **BUG-NOTEBOOK-NO-DELETE** [#160](https://github.com/semyon-alekseev-noveo/tt-sync/issues/160) before FEAT-NOTEBOOK [#159](https://github.com/semyon-alekseev-noveo/tt-sync/issues/159) (M–L). Brief: `docs/pilot/NOTEBOOK.md`.
11. Optional: DEL-1/DEL-3 modal on 2.0.91 (skipped in REGRESSION-2.0.91).
12. Live re-soak **AF-2 / AF-3 / AF-4** on **2.0.91** — **pass** (`162-af2-af3-af4-tip-2.0.91.md`).


## Аналитический мит 2026-10-19

**Analyst A — Abyss-задачи**
- Цепочка: строка Abyss → `convertLineToTask` → `TaskModificationDetector` (hash) → `syncAbyssCommentsToTickTick` → TT; обратно `fileOperation` → `convertTaskToLine`/`mergeAbyssBlock`.
- Дыры: правка дочерней строки не пушится; pull не видит TT-only комментарии; delete+recreate при правке; сироты `taskCommentMaps`.
- Тест `taskModificationCommentSmoke` считает hash через `abyssLinesToNote`, а прод использует `abyssDescriptionToNote` — тест может не ловить регрессию.
- Доки отстают от кода (Phase 1 уже в 2.0.46–2.0.47).

**Analyst B — архитектура плагина**
- Слои: `main.ts` → `TickTickService` (god-class) → Dexie/репозитории → `VaultSyncCoordinator`/`fileOperation`; `Tick` — неофициальный API-клиент.
- Связность: цикл `main` ↔ `services` снят (`PluginContext`); глобальные синглтоны (`getSettings`, `db`, `getTick`), дубль `FileOperation`.
- Нет тестов: `EventHandlerService`, `FolderSyncService`, `main.ts` lifecycle, `Tick`, полный `synchronizationInner`.
- BUG-NOTICE-1 подтверждён.

**Analyst C — стабильность sync**
- Жизненный цикл: startup full pull → `pushLocalEditsFirst` → pull в Dexie → `VaultSyncCoordinator` → `syncFiles`; конфликты по `modifiedTime`, 3-way merge на push.
- Главный риск — тихие ошибки pull/UI; затем активный файл без push, LWW «локальный побеждает», O(vault×tasks) сканы, двойное хранилище.

**Противоречия и их разрешение**
- C назвал сбой pull P0 («чекпоинт сдвигается») — **проверкой по коду не подтверждено**: при ошибке чекпоинт остаётся прежним (потери данных нет). Понижено до P1 как «тихий сбой» → BUG-SYNC-SILENT-FAIL.
- B: `SyncMan` — дублирующий движок; C: «не используется». Факт: `syncTickTickToObsidian` мёртв (вызов закомментирован), но `forceUpdates` живой (`services/index.ts`). Вывод: удалять только мёртвую часть.
- A считает «рассинхрон комментариев» багом задач, C — частным случаем LWW/`vaultLineBehindTask`: **общая корневая причина** — pull-детектор «строка отстаёт от задачи» не учитывает комментарии, а push-триггеры завязаны на родительскую строку.

**Общие корни**
1. Отсутствие fail-closed и наблюдаемости sync (тихие catch, «Sync completed» безусловно).
2. Триггеры push/pull завязаны на родительскую checkbox-строку и mtime, а не на полный состав блока (дети, комментарии, активный файл).
3. Нет интеграционных тестов поверх моков → регрессии 2.0.46/2.0.47 нашли вручную.
4. Большие связанные модули и неофициальный API повышают цену изменений.

**Консенсус:** сначала надёжность и видимость sync, затем live-soak, и только потом рефакторинг. На живой vault не выходить до Step 8.

**Проверка после мита (эта ветка, код, не номера строк из отчёта):**
- Тихий pull и notice закрыты тестами `BUG-SYNC-SILENT-FAIL` / `BUG-NOTICE-1`.
- Утверждение «прод хеширует через `abyssDescriptionToNote`, а тест через `abyssLinesToNote`» **не подтвердилось**. Оба пути хеша в `TaskModificationDetector` используют `abyssLinesToNote`. `abyssDescriptionToNote` — только тело `content` на push.
- Соседние comment-буллеты склеивались в один тред. Теперь каждый буллет — свой тред.
- Интеграционный тест `synchronizationInner` есть. Живые кейсы по-прежнему не прогнаны.

**Опорные mermaid-схемы при багфиксе (слои, цикл sync, Abyss comments, матрица безопасного diff):** [`docs/ANALYST_REFERENCE_DIAGRAMS.md`](docs/ANALYST_REFERENCE_DIAGRAMS.md). Процесс analyst → test → fix: [`DEV_FLOW.md`](DEV_FLOW.md).

---

## Приложение: история решений PO (2026-10-16)

Ниже — прежний бриф без изменений по существу (контекст первого sync, решения по topology R / Abyss-first).

---

## 1. What we wanted to learn

Can TickTickSync (Abyss fork) safely bidirectional-sync with Obsidian for a GTD/Abyss workflow, specifically:

| Direction | Desired behavior |
|-----------|------------------|
| **TickTick → Obsidian** | Parent tasks in TT list **Projects** become Obsidian project notes via **project scheme template** (`system/project`, `## Active Zone`, frontmatter `ticktick_id`) under `10 Projects/` |
| **Obsidian → TickTick** | Obsidian project notes (same scheme) create/update parent tasks in TT list **Projects**; inline/Active Zone tasks stay as children |

---

## 2. What actually happened (first sync)

| Area | Result |
|------|--------|
| Login | OK (session cookie; **not** Open API `tp_…` token) |
| Defaults | **Unlimited sync** (empty Sync Tag / Sync Project) → mirrored **all** TT lists into vault root (`Inbox.md`, `Projects.md`, …) |
| Obsidian (test) | ~123 tasks written with `ticktick_id`; Abyss format was off on first pull |
| TickTick (live) | ~123 titles got Obsidian file links; tag `ticktick` injected; 2 test tasks created |
| Real vault `Thinkpad` | Not modified |
| Limited soak | Failed — limits were wiped on login |

**Cleanup (2026-10-16):** TickTick restored via official MCP (`batch_update_tasks` + `delete_task`): stripped Obsidian links from titles, removed `ticktick` tags (~120 tasks), deleted TTS samples A/B. Verified: filter `tag=ticktick` → empty; probe titles clean.

Test-vault plugin settings hardened (do not re-enable full sync): Sync Tag `tts-test`, interval 86400s, `fileLinksInTickTick=noLink`, `stopInjectingTickTickTag=true`, `projectSchemeEnabled=true`.

---

## 3. Desired product behavior (for PO analysis)

### Project scheme (already in fork code — pilot)

Source: `src/projectScheme.ts`, `src/services/ProjectSchemeService.ts`

- Obsidian note with tag `system/project` in folder `10 Projects/` ↔ TT **parent** task in list `Projects` (tags `project` + `obsidian`).
- Template includes: frontmatter (`status`, `ticktick_id`, …), `# Title`, `## Overview`, `## Active Zone`.
- Subtasks live in Active Zone (and notes linked via `project:`); parents are not written as checkbox lines.
- Status sync: note `status` done-like ↔ parent completed (3-way via `projectSnapshot`).

### Gaps / decisions needed from PO

1. **Default safety:** Should empty Sync Tag/Project stay “sync everything”, or should a fresh install default to “pull nothing until configured”?
2. **Link injection:** Default `fileLinksInTickTick=taskLink` polluted live TT titles — should default be `noLink` for Abyss builds?
3. **Tag injection:** Default injects `#ticktick` into TT — keep, or default `stopInjectingTickTickTag=true`?
4. **Project scheme scope:** Sync **only** list `Projects` + project notes (ignore Inbox / nextAction / …), or full account + scheme as overlay?
5. **Single-file vs per-list files:** Abyss GTD often wants `newTasksFile` + tag→list mapping; project scheme wants `10 Projects/*.md`. Confirm preferred topology.
6. **Publish fork?** Still open (`TODO.md`).

---

## 4. Recommended next experiment (after PO OK)

1. Keep plugin **disabled** or Sync Tag limited until settings confirmed in UI.  
2. Enable **only** project scheme path: Sync Project = `Projects` (or Sync Tag reserved for projects).  
3. `fileLinksInTickTick=noLink`, stop injecting `ticktick` tag.  
4. Sync one TT Projects parent → expect one note under `10 Projects/` from template.  
5. Create one Obsidian `system/project` note → expect parent in TT Projects.  
6. Do **not** touch live vault until this passes.

---

## 5. Ask for PO

**§1 target scheme:** approved by owner 2026-10-16 (TT Projects ↔ Obsidian project notes both ways).

Still open for later (not blocking): defaults in §3 (items 1–5).

**Next:** limited soak — sync **only** list `Projects`, one parent task / one note.

## 6. PO decision (2026-10-16)

**Abyss-first principles P1–P6:** **confirmed** — see `ABYSS_FIRST_PLAN.md` §1. Topology R canonical list-file (CASE-T4) **parked** for v1.

---

## 6a. PO decision (proposed 2026-10-16, topology R era)

Full analysis: `GTD_SYNC_RESEARCH.md` (hypotheses A/B, recommended R, test plans, open questions §9). **Executable scenarios:** `GTD_SYNC_CASES.md` (CASE-* IDs, preconditions, expected Obsidian + TickTick, pilot matrix §9).

**Answers to §3 open points**

| §3 item | Proposed decision |
|---|---|
| 1 Default scope | A fresh install syncs **nothing** until lists are chosen (new `syncedLists`; empty = no sync + notice). |
| 2 Link injection | Fork default `fileLinksInTickTick=noLink`, `taskLinksInObsidian=noLink`. |
| 3 Tag injection | Fork default `stopInjectingTickTickTag=true`. |
| 4 Project scheme scope | Scheme is an **overlay** on an allow-listed account: list `Projects` + project notes in `10 Projects/`; other lists only if allow-listed. |
| 5 Topology | **R:** one file per GTD list in `30 Tasks/TickTick/` (no root files), GTD state by tag (`type/*` ↔ list), context by tag, projects by scheme. Hub file (`newTasksFile`) stays a fallback. |
| 6 Publish fork | Still open. |

**Why R:** the owner named `NextAction.md`, `Planned.md`… as the target, so list files stay; tags decide the list on push so inline tasks work anywhere; projects stay the only parent/child object.

**Test vault hardened (2026-10-16 follow-up):** `SyncTag=tts-test`, `projectSchemeEnabled=true`, `TickTickTasksFilePath=30 Tasks/TickTick`, `tagListMappings` for `type/*`, Abyss `membershipQuery=10 Projects/`. Sync still creates stub files for every TT list (under `30 Tasks/TickTick/`) until plugin fix G1 — see `GTD_SYNC_RESEARCH.md` §3.7.

**Owner confirmed (2026-10-16):** Topology **R + hub** (`30 Tasks/TickTick/` list files + capture hub). Sync lists: Inbox, nextAction, Planned, waitingFor, someDay, Projects, KB. GTD pilot: **Hypothesis A** tag table `type/next|planned|waiting|someday` (vault note `type/*` is mostly **document** taxonomy in frontmatter — not task routing; see `GTD_SYNC_RESEARCH.md` §2.4). Project template: **`60 templates/MOC.md`**. TTS-* test lists: **yes** (MCP).

**Owner closed (2026-10-25):** [#32](https://github.com/semyon-alekseev-noveo/tt-sync/issues/32) SEC-CREDS-1 — exposed `tp_…` revoked; live vault stays on session cookie; plaintext autologin remains opt-in with `data.json` excluded from vault sync if enabled.

**Install (2026-10-16):** Community id `tickticksync` replaced by **`tickticksync-abyss`** — TickTickSync (Abyss fork) via BRAT ([Review](0a91bc4d-6305-4611-b72b-1b50e114e0f3#changes)); see `docs/BRAT_INSTALL.md`. **Push `abyss-mapping` to GitHub** before BRAT can pull (branch not on remote yet). Test vault: only `tickticksync-abyss` enabled; latest `dist/` deployed.

**MVP behaviour:** GTD sync, login/settings fixes, auto-login, re-enable persistence, settings tab — see prior reviews in `CHANGELOG.md`. Settings: **Community plugins → TickTickSync (Abyss fork) → gear**. Preset: `00 Inbox/TTS-data-preset.json`.

**GTD settings wipe (2026-10-16):** Fixed in **2.0.20** — login no longer saves empty GTD defaults when `loadSettings` is still running; use **Import GTD from clipboard** (or re-merge preset) if `data.json` was already wiped. Test vault preset re-merged same day.

**Pilot sync checklist**

| Step | Status | Owner action |
|------|--------|----------------|
| 1 | **Ready** — preset + six `TTS-*` lists; deploy plugin **2.0.20** (`dist/` → test vault) | GTD settings → confirm lists; `projectsListName=TTS-Projects` (name wins over stale `projectsListId`) |
| 2 | **Retest (2.0.18)** — Phase B core passed on 2.0.17 but **FAIL** scoped pull (16 legacy project notes + wrong list id); fix in 2.0.18 | **Synchronize** → only `#tts-test` parent creates/updates; other `10 Projects/` notes untouched; `TTS-Projects.md` stub under `30 Tasks/TickTick/` |
| 3 | **Pass (2026-10-16)** — `TTS-PILOT- Phase C test` → TT parent `6ad1dc711befa8582aceadd7` in **TTS-Projects**, clean title | Optional: add `tts-test` tag on TT parent (note had YAML tag) |
| 4 | **Code done (2026-10-16)** — scope sync without `#ticktick`; no file move on list change; pull by id in place; CASE-T4 **parked** | Deploy `dist/` → reload → Phase D (`TTS-PILOT-tag-routing.md`) |
| 5 | **Pass (spot)** — empty `syncedLists` sync added no journal pulls | Formal UI test still useful |

**Phase B validation (2026-10-16, subagent):** pilot parent + MOC note — pass; five list stubs — pass; missing `TTS-Projects.md` — fixed in 2.0.18; 16 unrelated project notes updated — **fail** (fixed in 2.0.18 via scheme scope + `resolveProjectsList`).

Runbook: test vault `00 Inbox/TTS-PILOT-RUN.md` (phases map to **CASE-*** in `GTD_SYNC_CASES.md`).

**Still open:** reverse `projectMappings`; dual hub + per-list files; existing installs that relied on `SyncTag` only need `syncedLists` set.

## References

- `CHANGELOG.md` (история итераций, 2.0.47)  
- `SMOKE_TESTS.md`, `TT_ABYSS_ROADMAP.md`  
- `ABYSS_FIRST_PLAN.md` (current step-by-step alignment with Abyss)  
- `GTD_SYNC_CASES.md` (legacy TickTick/topology-R case catalog)  
- `GTD_SYNC_RESEARCH.md` (GTD research and recommendation)  
- `ABYSS_MAPPING.md` (step 7 project scheme)  
- `TODO.md`  
- `CHANGELOG.md`  
- `docs/BRAT_INSTALL.md`  
- `PROJECT_STATE.md`  
- Docs: https://thesamim.github.io/TickTickSync/ (upstream UX)  
