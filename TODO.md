# TickTickSync (Abyss fork) — TODO

Состояние: ветка `abyss-mapping`, коммит `11df207`, 436 тестов проходят. Проект на паузе с 2026-10-14.

## Журнал и откат
- [ ] Восстановленная/пересозданная задача должна возвращаться в свою заметку и строку, а не в `00 Inbox/TickTick.md`.
- [ ] Хранить снимок задачи TickTick в записи удаления, чтобы откат мог пересоздать задачу, удалённую в самом TickTick.
- [ ] Точнее определять конфликты при откате (по полям/строкам, а не по факту правки файла).
- [ ] Не писать в журнал правки пользователя, сделанные во время синка.
- [ ] Откат больших файлов (>256 КБ) целиком.
- [ ] Вживую проверить правило для `[-]` строк при откате.
- [ ] Вынести `redoLogRetentionDays` в окно настроек.

## Синк
- [ ] Ссылки с путём к файлу не обновляются при переносе папки проектов (используется `vault.rename`).
- [ ] Строки без маркера синка не переписываются при смене таблицы тегов.
- [ ] Удалять пустую старую папку после переноса папки проектов.
- [ ] Закрыть окно рассинхрона при смене таблицы тегов через интерфейс настроек.
- [ ] Порядок подзадач: одинаковые `sortOrder` и подзадачи не подряд.
- [ ] Диапазон начало–срок пишется как `[HH:MM]` — привести к формату Abyss (`⏰`).
- [ ] Убрать лишний тег `type-now` из TickTick.
- [ ] Сложные правила повтора (например, «по пн и ср») закрывают всю серию.
- [ ] Комментарий, удалённый в TickTick, остаётся в Obsidian (сознательно; решить, нужна ли настройка).
- [ ] Первый синк после перезапуска до ~45 с, если висит окно подтверждения (таймаут 15 с на окно).

## Дальше
- [ ] Поставить сборку на копию реального хранилища и прогнать на реальных данных.
- [ ] Решить про публикацию форка на GitHub.

## Идеи из похожих кейсов (Dropbox, Jepsen, Todoist, Event Sourcing)
- [ ] Переписать «метод дурака» на fast-check (model-based testing): случайные цепочки правок/удалений/сбоев сети/повторных синков; проверять, что синк завершается, задачи не пропадают и не дублируются, стороны сходятся; воспроизведение по seed. https://fast-check.dev/docs/advanced/model-based-testing/
- [ ] Хранить «последнее синхронное» состояние каждой задачи как базу трёхстороннего слияния (как Dropbox). https://dropbox.tech/infrastructure/-testing-our-new-sync-engine
- [ ] Идемпотентный журнал: uuid у каждой операции, отметка «применено» после ответа TickTick (как Todoist Sync API). https://developer.todoist.com/api/v1/
- [ ] Сбрасывать журнал на диск (fsync) до отправки в TickTick; тест «процесс убит посреди синка». https://jepsen.io/
- [ ] Предпросмотр отката с показом разницы; удалённые задачи восстанавливать в прежнюю заметку. https://help.obsidian.md/Plugins/File+recovery

## Abyss-first sync (`ABYSS_FIRST_PLAN.md`) — текущий план
- [x] Step 1: PO подтвердить принципы P1–P6; T4 / topology R — out of scope v1 (2026-10-16).
- [x] Step 2: Abyss `membershipQuery` → `10 Projects/`, вставка задач в `## Active Zone` (test vault 2026-10-16).
- [x] Step 3: **Option B** — `taskIgnoreQuery: #ticktick`, untagged inbox (2026-10-16).
- [ ] Step 3.2: UI verify — synced line with only `#ticktick` stays in Abyss Inbox after reload.
- [x] Step 4: scope push без `#ticktick`; строка не переезжает при смене списка; pull по id на месте (2026-10-16).
- [ ] Step 5: единое определение проекта в UI; P6 regression doc.
- [ ] Step 6–7: кейсы AF-* и пилот на `Thinkpad-tts-test`.

## GTD-синк (архив / `GTD_SYNC_RESEARCH.md` + `GTD_SYNC_CASES.md`)
- [x] Не создавать пустые файлы для всех списков TickTick: файл списка только для разрешённых списков и по первой задаче (`ProjectSyncService.checkProjectRename`, `VaultSyncCoordinator.ensureProjectFilesExist`).
- [x] Настройка `syncedLists` (несколько списков вместо одного `SyncProject`); пустой список = ничего не синкать.
- [x] Настройка `syncScopeFolders`: отправлять в TickTick только строки из этих папок.
- [x] Раздел настроек «GTD и проекты»: `TickTickTasksFilePath`, `syncedLists`, `projectsFolder`, `projectsListName`, `projectSchemeEnabled`, `tagListMappings`.
- [x] Метка источника: считать строку синхронной по `#ticktick` или `#obsidian` при наличии `ticktick_id`; тест vitest.
- [x] `projectTemplatePath` для шаблона проекта (без промптов Templater).
- [ ] Подключить обратный `projectMappings` (`pathForProjectId`) или удалить мёртвый код.
- [ ] Пилот: скопировать новую сборку в тестовое хранилище, выбрать `TTS-*` в «GTD and projects», Sync now (см. CHANGELOG 2026-10-16 05:00).
- [ ] Если `SyncTag` задан без `SyncProject`, после апдейта `syncedLists` пуст — проверить, нужна ли миграция «все списки».
- [ ] Прогнать кейсы из `GTD_SYNC_CASES.md` §9 (пилот) и оставшиеся «Not exercised» на `Thinkpad-tts-test` (`TTS-*`).
