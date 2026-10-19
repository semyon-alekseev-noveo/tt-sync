# Product owner brief — TickTickSync Abyss fork (project scheme)

**Обновлено:** 2026-10-19  
**Audience:** Product owner / decision maker  
**Repo:** `tickticksync` branch `abyss-mapping`  
**Test vault:** `<pilot-vault>` (copy only; live vault `<live-vault>` untouched)  
**Install:** BRAT → `https://github.com/semyon-alekseev-noveo/tt-sync` track **latest release** (**2.0.47**, tag `2.0.47`); plugin id **`tickticksync-abyss`** — `docs/BRAT_INSTALL.md`. Preset: `00 Inbox/TTS-data-preset.json`.

История изменений — только в `CHANGELOG.md`; здесь — снимок для PO.

## Context

- Релиз **2.0.47** выпущен: исправлены BUG-COMMENT-1 (комментарии Abyss не уходили в TickTick Comments, если hash строки не менялся) и BUG-TAG-1 (дубли тегов `note/`, `proj/`). Тег и ветка `abyss-mapping` отправлены в `tt-sync`.
- Abyss-first: задачи живут там, где их кладёт Abyss; TT зеркалит теги/списки и родителей-проекты (`ABYSS_FIRST_PLAN.md`, топология R / CASE-T4 отложена).
- Комментарии Abyss → TickTick **Comments API** (`syncAbyssCommentsViaApi`, по умолчанию вкл.); описание остаётся в `content`.
- Живой vault не трогаем; пилот — только `<pilot-vault>`. Ручной синк. Токен `tp_…`, если он светился в чате, отозвать.
- Аналитический мит 2026-10-19 (три аналитика) — см. раздел ниже.

## Target

1. **Надёжный sync без тихих сбоев:** любая ошибка pull/push видна пользователю, чекпоинт не обманывает.
2. **Abyss-комментарии и теги стабильны:** правка дочерней строки и TT-only изменения комментариев доезжают без ручных обходов.
3. **Безопасный запуск на живом vault:** Step 6 (кейсы AF-*) и Step 8, плюс soak NOTE-L3b на пилоте. Один живой прогон, не отдельный набор.
4. **Поддерживаемость:** интеграционный тест `synchronizationInner` есть на этой ветке. Цикл `main` ↔ `services` ещё открыт.

## Validation

- Релиз **2.0.47:** `npx vitest run` — 67 файлов, 550 тестов. Эта ветка (ещё не релиз, версию не поднимали): **73 файла, 569 тестов**, `npm run build` — ok. В том числе `src/test/synchronizationInner.integration.test.ts`.
- Ручные smoke-сценарии: `SMOKE_TESTS.md` и каталог `ABYSS_FIRST_CASES.md`. NOTE-L3b, CTX-D2 и живой AF-гейт на пилоте **не прогонялись** в этой ветке.
- Детали и даты прогонов — в `CHANGELOG.md`.

## Problems

| ID | Приоритет | Статус | Суть |
|----|-----------|--------|------|
| **BUG-COMMENT-1** | P1 | resolved в 2.0.47 | Комментарии не синкались при неизменном hash; нужен live-soak NOTE-L3b |
| **BUG-TAG-1** | P2 | mitigated в 2.0.47 | Дубли `note/`/`proj/`; на «грязных» задачах нужен один re-sync (CTX-D2) |
| **BUG-SYNC-SILENT-FAIL** | P1 | fixed on this branch | `getUpdatedTasks` бросает `TickTickPullError`, `syncTickTickWithDexie` пробрасывает, `synchronizationInner` возвращает `{ok:false}`. Notice: «Sync failed: …». Чекпоинт не двигается. Не релиз |
| **BUG-NOTICE-1** | P1 | fixed on this branch | Текст загрузки собирается в `formatPluginLoadedNotice` (`src/sync/result.ts`), без сломанного приоритета `+` / `?:` |
| **BUG-COMMENT-INLINE** | P1 | fixed on this branch | Дочерняя comment/description строка вызывает `checkLineForModifications` родителя. Соседние comment-буллеты — отдельные треды (`extractAbyssCommentThreads`) |
| **RISK-OPEN-FILE-EDIT** | P1 | mitigated on this branch | Активный файл по-прежнему не пушится на `vault.modify`. После 5 с тишины `editor-change` пушит строки с `ticktick_id`, кроме незакрытой строки захвата (`%%`). Новые чекбоксы без id не считаются удалениями |
| **BUG-PULL-COMMENT-STALE** | P2 | fixed on this branch | `vaultLineBehindTask` сравнивает отпечатки Comments API. `getTaskById` только если заголовок/статус/content уже совпали; повторного вызова в цикле vault-sync нет. Комментарии кэшируются на задаче (`_apiComments`) |
| **RISK-PULL-WINS-LOCAL** | P2 | open | При победе локальной версии в LWW строка в vault может остаться устаревшей |
| **BUG-COMMENT-MAP-ORPHAN** | P2 | fixed on this branch | `deleteCommentMapsForTask` вызывается из `TaskRepository` (delete/hard delete/purge), `markTaskDeleted` и pull при удалённой на TT задаче |
| **GAP-COMMENT-EDIT** | P2 | open | Правка комментария = delete + add (новые ID, шум в ленте TT) |
| **RISK-DUAL-STORE** | P2 | open | Две «истины»: Dexie `tasks` и `fileMetadata`/`syncFiles` → возможен дрейф |
| **RISK-LARGE-VAULT** | P2 | open | Каждый sync сканирует все `.md` (`idsPresentInVault`, `ensureVaultFilesRegistered`) |
| **TECH-START-1** | P2 | open | Полный pull на старте блокирует инициализацию |
| **TECH-API-1** | P1 | open (риск) | Неофициальный клиент `Tick`: изменения TT ломают sync, покрытие тестами минимальное |
| **TECH-CIRC-1 / GOD-1/2** | P2 | open | Цикл `main` ↔ `services`; god-классы `TickTickService`, `TaskModificationDetector` |
| **DOC-STALE-1** | P3 | mitigated on this branch | Канон: `DEV_FLOW.md`, `PO_STATUS.md`, `ABYSS_FIRST_PLAN.md`. `GTD_SYNC_*`, `TT_ABYSS_ROADMAP.md`, `SYNC_PROJECTS_AND_SUBTASKS.md` — архив. Comments API описан в `ABYSS_NOTES_ALIGNMENT.md` |
| Прежние | — | open | Токен `tp_…` из чата — отозвать; `data.json` тест-vault дрейфует от §2 — не синкать вслепую |

## Redo journal

Каждый синк пишет журнал `<vault>/.tickticksync/journal/YYYY-MM-DD.jsonl` до изменения (`src/redo/log.ts`). Откат: палитра **Undo last sync (preview first)** и **Preview undo of last sync (dry run only)** (`planUndo` в `src/redo/rollback.ts`, команды в `src/redo/commands.ts`). Откат сам пишется в журнал. Выключить плагин: Settings → Community plugins → TickTickSync. На живом vault этот откат не прогонялся.

## To Be Done

1. Пилот человеком или локальным агентом в Obsidian: NOTE-L3b, CTX-D2, один гейт AF + DEL + NOTE-L3b (`ABYSS_FIRST_CASES.md`). Результаты не выдумывать.
2. Отозвать токен `tp_…`, если он ещё действует.
3. Abyss Inbox: в плагине `#inbox` — тег стадии списка по умолчанию. Режим Abyss «untagged» после `#obsidian` задачу из Inbox убирает. Это настройка Abyss, не этот плагин. Проверить вид Inbox на пилоте.
4. Открыто в коде: GAP-COMMENT-EDIT (правка комментария = delete + add), RISK-PULL-WINS-LOCAL, RISK-DUAL-STORE, RISK-LARGE-VAULT, TECH-START-1, TECH-CIRC-1.

## Аналитический мит 2026-10-19

**Analyst A — Abyss-задачи**
- Цепочка: строка Abyss → `convertLineToTask` → `TaskModificationDetector` (hash) → `syncAbyssCommentsToTickTick` → TT; обратно `fileOperation` → `convertTaskToLine`/`mergeAbyssBlock`.
- Дыры: правка дочерней строки не пушится; pull не видит TT-only комментарии; delete+recreate при правке; сироты `taskCommentMaps`.
- Тест `taskModificationCommentSmoke` считает hash через `abyssLinesToNote`, а прод использует `abyssDescriptionToNote` — тест может не ловить регрессию.
- Доки отстают от кода (Phase 1 уже в 2.0.46–2.0.47).

**Analyst B — архитектура плагина**
- Слои: `main.ts` → `TickTickService` (god-class) → Dexie/репозитории → `VaultSyncCoordinator`/`fileOperation`; `Tick` — неофициальный API-клиент.
- Связность: цикл `main` ↔ `services`, глобальные синглтоны (`getSettings`, `db`, `getTick`), дубль `FileOperation`.
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

**Owner confirmed (2026-10-16):** Topology **R + hub** (`30 Tasks/TickTick/` list files + capture hub). Sync lists: Inbox, nextAction, Planned, waitingFor, someDay, Projects, KB. GTD pilot: **Hypothesis A** tag table `type/next|planned|waiting|someday` (vault note `type/*` is mostly **document** taxonomy in frontmatter — not task routing; see `GTD_SYNC_RESEARCH.md` §2.4). Project template: **`60 templates/MOC.md`**. TTS-* test lists: **yes** (MCP). Still: rotate exposed `tp_…` token if not done.

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
