# TickTick API: изменения за период вместо проверки каждой задачи

**Каноническая копия:** этот файл в репозитории `docs/TICKTICK_DELTA_API.md`. Процесс внедрения — `DEV_FLOW.md`; ручные шаги пилота — `TEST_PLAN.md` § Delta API pilot.

**Репозиторий:** `semyon-alekseev-noveo/tt-sync`. Разобрана ветка `cursor/sync-perf-index-cache-aa83` (PR #2, коммит `f6007dd`).
**Дата:** 2026-10-20, время Asia/Novosibirsk (UTC+7).
**Режим:** только чтение. Логина в TickTick не было, живых вызовов API тоже. Всё, что сказано о поведении API, взято из чужих клиентов и документации. Утверждения, которые надо проверить на пилоте, помечены **[проверить]**.

---

## 0. Коротко

1. **Почему существует проверка.** Её добавили в версии 2.0.36 (коммит `54e31bc`, 2026-10-19). Повод: на пилоте переименование в TickTick не доходило до vault, затем `pushLocalEditsFirst` записывал старое название обратно в TickTick. В CHANGELOG причина описана так: «delta pull skipped title-only TT renames when `modifiedTime` stayed unchanged». Upstream TickTickSync подтверждает: правки, сделанные через API или автоматизацию (MCP, скрипты), **не обновляют `modifiedTime`**. Правки в самом приложении TickTick его обновляют.
2. **Главная находка.** Есть веская гипотеза, что такую правку отбрасывает **сам плагин**, а не delta. В `src/sync/pull.ts:54` есть подавление эха: задача пропускается, если `lastModifiedByDeviceId === этот девайс` и `modifiedTime` не изменился. Delta `batch/check/{checkpoint}` строится на сервере по checkpoint, а не по `modifiedTime` задачи. Поэтому правка через API, скорее всего, **приходит** в `update[]`, но с прежним `modifiedTime`, и плагин её выбрасывает. При этом у задачи есть `etag`, и его меняет сервер при каждой записи. **[проверить]**
3. **Дельты для комментариев нет.** Комментарии в `batch/check` не входят. Отдельного endpoint «комментарии с момента X» не нашлось ни в V2, ни в Open API. Есть только `GET .../task/{id}/comments` для одной задачи. В объекте задачи V2 есть поле `commentCount`.
4. **Рекомендация.** Считать опорным checkpoint delta. Подавление эха и разрешение конфликтов перевести на `etag`. Добавить диапазоны `project/all/closed` (Completed и Abandoned) и корзину. На idle sync **не делать ни одного запроса на задачу**. Комментарии запрашивать только у задач из delta (новый `etag` или изменившийся `commentCount`) и раз в сутки делать медленную полную сверку с лимитом.

---

## 1. Код: зачем нужна проверка

### 1.1. Где она находится

`src/services/VaultSyncCoordinator.ts`, функция `vaultLineBehindTask` (строки ~313–375 в PR #2). Вызывается, когда `determineActionNeeded(lt)` вернул `'none'`, то есть `updatedAt <= lastVaultSync`, файл не новый и не перемещён.

1. Строка в vault сравнивается с копией из Dexie (title, status, при `syncNotes` ещё content и desc).
2. **Если они совпадают**, вызывается `getTaskById(task.id, task.projectId)`, и сравнение повторяется со свежей копией.
3. Если и тогда нет расхождений, а Comments API включён, вызывается `getTaskComments`. Отпечатки сравниваются через `apiCommentsDifferFromVault` (это BUG-PULL-COMMENT-STALE, коммит `41e0003`).

Парная защита на стороне push: `TaskModificationDetector.skipPushWhenTickTickRenamedVaultLine`. Если строка не менялась, она вызывает `getTaskById`, и если в TickTick название новее, не отправляет старое (тоже из 2.0.36).

### 1.2. История (git log -L, CHANGELOG)

| Коммит / версия | Что сделано | Причина из CHANGELOG |
|---|---|---|
| 05:32 UTC, предшественник 2.0.36 | `effectiveTaskRevision` в `conflicts.ts`; `upsertTask` берёт `modifiedTime` из TT; убрана ложная метка `modifiedTime` в `forceUpdates` | «inflated `updatedAt` after vault push made pull keep stale Dexie rows». Это **баг плагина**, а не API |
| `54e31bc` 2.0.36 | `vaultLineBehindTask` с безусловным `getTaskById`; `skipPushWhenTickTickRenamedVaultLine` | «Delta pull skipped title-only TT renames when `modifiedTime` stayed unchanged» |
| `0bfd589` 2.0.40 | Сравнение content и desc целым Abyss-блоком | «TT body … did not refresh Obsidian when `modifiedTime` was stale» |
| `41e0003` PR #1 | Сначала сравнивать с кэшем, `getTaskById` только при совпадении; плюс `getTaskComments` | BUG-PULL-COMMENT-STALE: комментарий, созданный только в TickTick, не доходил до vault |
| `f6007dd` PR #2 | Индекс id и кэш файлов; проверка **не тронута** | Базовая линия в тесте: idle sync = 3 `getTaskById` (`synchronizationInner.integration.test.ts:358–390`) |

Обе причины в 2.0.36 найдены в один день. Первая из них, раздутый `updatedAt`, исправлена на уровне конфликтов. Отдельно, что delta действительно не содержит таких правок, **не проверяли**: в журнале видно только, что строка не обновилась.

### 1.3. Пропускает ли delta изменения? Разбор

Цепочка для правки через API, которая не обновила `modifiedTime`:

1. **Сервер.** Checkpoint серверный (`checkPoint` в ответе), задача попадает в delta, если изменилась после checkpoint. Обновление `etag` сервером документировано: `id2etag` в ответе `batch/task`, «Note the etag has changed after the update» ([ticktick-mcp-v2](https://github.com/paoloviselli/ticktick-mcp-v2/blob/main/docs/api-analysis/projects-folders-api.md)). Значит, такая задача **скорее всего есть в `update[]`**. **[проверить]**
2. **Плагин, `pull.ts:54`.**
   ```ts
   if (local && local.lastModifiedByDeviceId === meta.deviceId && local.task.modifiedTime === rt.modifiedTime) continue;
   ```
   Если последним задачу писал этот девайс (обычный случай для задач, созданных в Obsidian), а `modifiedTime` не изменился, правка **молча отбрасывается**.
3. **Плагин, `conflicts.ts`.** При равной ревизии берётся тело из remote (это правильно), но до этого шага дело не доходит из-за п.2.

Upstream пишет: «such an edit may go unnoticed by delta-based sync» ([TickTickSync troubleshooting](https://thesamim.github.io/TickTickSync/troubleshooting/)). Это согласуется и с тем, что delta пустая, и с тем, что клиент отбросил задачу по `modifiedTime`. Источника, где проверено, что сервер исключает задачу из delta, не нашлось.

Ещё два пробела в коде:
- `api/index.ts getUpdatedTasks` читает только `syncTaskBean.update` и `delete`. Поля `syncTaskBean.add`, `tagUpdate`, `projectProfiles`, `projectGroups`, `tags` и `syncTaskOrderBean` из того же ответа **выбрасываются**. Проекты отдельно запрашиваются через `saveProjectsToCache`. dida-cli разбирает `add` отдельно ([sync.go](https://github.com/DeliciousBuding/dida-cli)). Обычно `add` пустой (так в примере pyticktick), но это не гарантировано. **[проверить]**
- `api/index.ts getTask` передаёт `?projectID=` с заглавным `ID`. Ожидаемый параметр, вероятно, `projectId`. Сейчас это работает, видимо, потому что сервер ищет задачу и без проекта. Мелочь, но её стоит знать.

### 1.4. Комментарии в delta

В ответе `batch/check` комментариев нет ни в одном известном разборе: pyticktick `GetBatchV2`, ticktick-sdk `SyncStateV2`, dida-cli `SyncPayload`. У задачи V2 есть `commentCount` (ticktick-sdk `TaskV2`) и `etag`. Обновляет ли добавление комментария `etag`, `modifiedTime` задачи или кладёт ли её в delta, **неизвестно**. **[проверить]** Это главный вопрос пилота для схемы с комментариями.

### 1.5. Выполненные, удалённые и перемещённые задачи

| Случай | Как сейчас | Что даёт API |
|---|---|---|
| Выполнена или «won't do» | Проверка сравнивает status строки и TT; delta-задача со `status: 2` идёт через обычный путь | Full `batch/check/0` отдаёт **только активные** задачи (pyticktick: «all active objects»). В delta закрытие обычно приходит как `update` со `status` 2 или -1 **[проверить]**. Надёжный дополнительный источник: `project/all/closed?from&to&status` |
| Удалена (в корзину) | `syncTaskBean.delete` → `deleted=true`; `deleted` не проверяется | `delete[]` в delta плюс `project/all/trash/pagination` (ticktick-sdk) или `trash/page?from=cursor` (dida-cli). Ответ API похож на мягкое удаление: `deleted=1`, `getTaskById` по-прежнему находит задачу |
| Удалён список | `services/index.ts` ~262–274: задачи пропавших списков помечаются удалёнными, с защитой от частичного ответа | В delta не приходит, комментарий в коде это подтверждает. Нужен список проектов (уже есть) |
| Перемещена в другой проект | Delta отдаёт задачу с новым `projectId` → `determineActionNeeded` → `'move'`; проверка не нужна | `batch/taskProject` меняет задачу, `etag` меняется **[проверить]** |
| Проверка с устаревшим `projectId` | `getTaskById(id, oldProjectId)`; в коде `projectID`, возможно, игнорируется | — |

---

## 2. Endpoints TickTick

Уверенность: **В** — несколько клиентов, недавно проверено вживую; **С** — один-два источника или старая проверка; **Н** — только упоминание или требует Premium.

### 2.1. Неофициальный web API V2 (`https://api.ticktick.com/api/v2`, для Dida `api.dida365.com`)

| Endpoint | Метод, параметры | Что возвращает | Источник | Уверенность |
|---|---|---|---|---|
| `/batch/check/{checkpoint}` | GET; `0` = полный снимок | `checkPoint`, `syncTaskBean{update, add, delete, empty, tagUpdate}`, `projectProfiles`, `projectGroups`, `tags`, `filters`, `syncOrderBean(V3)`, `syncTaskOrderBean`, `remindChanges`, `inboxId`. **Комментариев и вложений отдельно нет** (`attachments` внутри задачи есть) | [pyticktick get_batch_v2](https://pyticktick.pretzer.io/reference/client/v2/), [dida-cli api-coverage](https://github.com/DeliciousBuding/dida-cli/blob/main/docs/api-coverage.md) («Incremental sync … Stable»), [ticktick-sdk](https://github.com/dev-mirzabicer/ticktick-sdk) | **В** |
| `/project/all/closed` | GET; `from`, `to` в формате `YYYY-MM-DD HH:MM:SS` (без зоны), `status=Completed\|Abandoned`, `limit` (ticktick-sdk ставит 100) | Массив задач: `status` 2 или -1, `completedTime`, `modifiedTime`, `etag`, `commentCount` | pyticktick `GetClosedV2`, ticktick-sdk `get_completed_tasks/get_abandoned_tasks`, dida-cli «Closed history … Stable read» | **В** |
| `/project/{ids}/closed` | GET, те же параметры | То же самое, для отдельных проектов | dida-cli | **С** |
| `/project/all/completed` | GET; в dida-cli вызывается с периодами today/week | Выполненные задачи | dida-cli, [gitlab snippet](https://gitlab.com/-/snippets/1827593) | **С** |
| `/project/all/completedInAll/` | GET, без параметров (так в плагине: `getAllCompletedItems`) | `syncTaskBean.update` выполненных задач | Код плагина и upstream TickTickSync; в sync не используется | **С** |
| `/project/all/trash/pagination` | GET; `start`, `limit` (ticktick-sdk: 500) | `{tasks: [...]}` | ticktick-sdk `get_deleted_tasks`; закомментирован в `get-api-endpoints.ts` плагина | **С** |
| `/project/all/trash/page` | GET; `from={cursor}` | Страница корзины с курсором | dida-cli «live read 2026-05-10» | **С** (новая форма: «/page» вместо «/pagination») |
| `/task/{id}` | GET; `projectId` | Одна задача | Плагин (`getTask`) | **В** |
| `/project/{pid}/task/{tid}/comments` | GET | Комментарии одной задачи: `id`, `title`, `createdTime`, `modifiedTime` | Плагин; dida-cli «Stable without attachments» | **В** |
| `/project/{pid}/task/{tid}/comment` (POST), `/project/{pid}/task/{tid}/comment/{cid}` (PUT, DELETE) | Запись | Создание, правка, удаление. **PUT** — тот же path, что DELETE; body `{ title }` (dida-cli `UpdateComment`, live smoke у них). Плагин вызывает его для однозначной правки (GAP-COMMENT-EDIT). **POST body (плагин ≥2.0.74):** webapp shape — `id`, `taskId`, `projectId`, `createdTime`, `title`, …; `{ title }` alone → HTTP 500 (`BUG-COMMENT-API-POST-500`). Empty 200 → success via client id (POST) or the existing comment id (PUT). Live PUT на ticktick.com **не прогонялся**. | dida-cli `internal/webapi/comments.go`; плагин `buildAddTaskCommentBody` / `buildUpdateTaskCommentBody` | **В** для path/body по dida-cli; POST shape verified on pilot; PUT на ticktick.com **не проверен** |

**Push trigger ≠ API contract.** Даже с правильным POST комментарий из **Abyss Tasks view** не уйдёт, пока плагин не запланирует open-note push на `vault.modify` (не только `editor-change`) — **BUG-COMMENT-ABYSS-VIEW** / **2.0.75**. См. `docs/ANALYST_REFERENCE_DIAGRAMS.md` §2b, `docs/COMMENT_SYNC_MODEL.md`.
| `/batch/task` | POST `{add, update, delete, addAttachments, updateAttachments, deleteAttachments}` | `id2etag`, `id2error` | pyticktick `post_task_v2`, ticktick-mcp-v2 | **В** |
| `/batch/taskProject`, `/batch/taskParent` | POST | Перенос в проект, смена родителя | dida-cli, плагин | **В** |
| `/task/activity/count/all` | POST | Только счётчики «due activity», не история | dida-cli | **С**, для синка бесполезен |

**Batch-чтения задач по списку id нет.** Batch-эндпоинта для комментариев тоже нет: нет ни `batch/comment`, ни комментариев внутри `batch/check`.

### 2.2. Legacy V1 web (`/api/v1`): история активности

| Endpoint | Параметры | Возвращает | Источник | Уверенность |
|---|---|---|---|---|
| `GET /api/v1/project/{pid}/task/{tid}/activity` | `skip`, `lastId` | События от новых к старым: `{id, action: T_CREATE\|T_TITLE\|T_CONTENT\|T_DONE\|…, when, deviceChannel, whoProfile}` | [MHoroszowski/ticktick-client](https://github.com/MHoroszowski/ticktick-client), [gitlab snippet](https://gitlab.com/-/snippets/1827593) | **Н**: **только Premium**, работает по одной задаче, то есть N+1 не уходит |
| `GET /api/v1/task/activity/{taskId}` | `skip`, `lastId` | То же | dida-cli: «HTTP 500 errorCode=need_pro» | **Н** |
| `GET /api/v1/project/{pid}/activity` | — | Активность всего проекта | gitlab snippet, ticktick-client | **Н**, Premium. Теоретически даёт историю по проекту одним вызовом на проект, но фильтра по времени на сервере нет («Caller-side filter (no server-side filter exists)») |

### 2.3. Официальный Open API (`https://api.ticktick.com/open/v1`, OAuth Bearer)

Источник: официальная документация [developer.ticktick.com](https://developer.ticktick.com/) (текст снят через [context7 llms.txt](https://context7.com/websites/developer_ticktick/llms.txt)).

| Endpoint | Что делает | Полезно ли для delta |
|---|---|---|
| `GET /project/{pid}/data` | Проект + незакрытые задачи + колонки | Нет checkpoint, только снимок по проекту |
| `GET /project/{pid}/task/{tid}` | Одна задача | Тот же N+1 |
| `POST /task/search` `{keywords, projectIds, tags, status, dueFrom, dueTo}` | Поиск | Фильтр по сроку (**due**), а не по изменению |
| `POST /task/undone` `{projectIds, startDate, endDate}` | Незакрытые задачи за период | Период по датам задачи, не по изменению |
| `POST /task/batch` `{add≤50, update≤50}` | Batch-запись → `id2etag`, `id2error` | Только запись |
| `GET/POST/DELETE /project/{pid}/task/{tid}/comment(s)` | Комментарии одной задачи | Без дельты |

В Open API **нет checkpoint, нет фильтра по `modifiedTime`, нет activity и нет дельты комментариев**. Об этом же пишет [partymola/ticktick-mcp — why-not-the-official-api](https://github.com/partymola/ticktick-mcp/blob/main/docs/why-not-the-official-api.md). Для нашей задачи Open API хуже V2.

### 2.4. Upstream TickTickSync

- [Troubleshooting](https://thesamim.github.io/TickTickSync/troubleshooting/): правки через API не обновляют `modifiedTime`, и delta на других клиентах может их пропустить. Правки в приложении работают нормально.
- [#185](https://github.com/thesamim/TickTickSync/issues/185): слишком старый checkpoint возвращает пустой ответ. Сервер поменял поведение, автор использовал «checkpoint 15 дней назад» как fallback. Это риск для полной сверки через `since=старое`.
- Во время пилота TickTick правили через официальный MCP (`batch_update_tasks`, PO_STATUS 2026-10-16). Это тот самый случай «правка через API без bump». **Скорее всего, TP1-QUIET-TITLE создан правками от MCP или агента, а не от пользователя в приложении.**

---

## 3. Рекомендуемая схема

### 3.1. Идея

Idle sync = **1 запрос `batch/check/{cp}` + 0 запросов на задачу**. Остальные запросы ограничены числом изменённых задач или делаются по расписанию.

### 3.2. Шаги одного прогона

1. **Delta.** `GET batch/check/{cp}`. Разбирать `update ∪ add` (сейчас `add` теряется) и `delete`.
2. **Подавление эха по `etag`, а не по `modifiedTime`.**
   - После своего push сохранять `etag` из `id2etag` (`batch/task` его отдаёт) в `LocalTask.task.etag`.
   - В `pull.ts` пропускать задачу только если `rt.etag === local.task.etag`. Если `etag` другой, это чужая правка, **даже при том же `modifiedTime`**.
   - В `resolveTaskConflict` при равных `modifiedTime` и разных `etag` побеждает remote. Отдельно отслеживать, есть ли локальная неотправленная правка (dirty-флаг), а не опираться на время.
3. **Закрытые задачи.** `GET project/all/closed?from={lastSync−overlap}&to={now}&status=Completed` и `…&status=Abandoned`, с перекрытием окна 1–2 часа и `limit`, с пагинацией по `to` (ограничение по `limit`, точный механизм **[проверить]**). Эти вызовы нужны, только если delta не отдаёт закрытие сама: на пилоте проверить один раз. Если отдаёт, оставить их в суточной сверке.
4. **Корзина.** В обычном прогоне доверять `delete[]` из delta. `trash/pagination` (или `trash/page`) только в суточной сверке, чтобы поймать удаления, которые delta не отдала.
5. **Vault.** `vaultLineBehindTask` без сети: сравнивать строку только с копией в Dexie. Запрос задачи остаётся только в ручном «Repair / Deep reconcile».
6. **Комментарии** (дельты нет):
   - **Вариант A, основной.** `getTaskComments` только для задач, которые (а) пришли в delta с новым `etag`, или (б) у которых изменился `commentCount` относительно Dexie, или (в) у которых в vault изменились comment-строки (push-сторона, уже работает).
   - **Вариант B, если комментарий не трогает ни `etag`, ни `commentCount`, ни delta.** Суточная медленная сверка: 1 раз в сутки обход задач из синкаемых списков с лимитом скорости (например не больше 2 запросов в секунду, с бюджетом на прогон и продолжением со следующего прогона). Задачи с `commentCount = 0` в Dexie пропускаются, если поле надёжно.
   - Правку комментария делать через `PUT .../comment/{cid}` с телом `{ title }` (dida-cli). Плагин так и делает, когда правка однозначна (GAP-COMMENT-EDIT). Если PUT не вернул id — fallback delete+add. Live PUT на ticktick.com всё ещё **[проверить]**.
7. **Суточная сверка** (настройка, по умолчанию 1 раз в сутки, в фоне, не на старте): закрытые за 48 часов, корзина, комментарии по варианту B. Опционально полное сравнение заголовков из `batch/check/0`: это **один** запрос на все активные задачи, а не T запросов. Так ловится даже правка, которую delta не отдала. Полный снимок с title, content и status вместо `getTaskById × T` — главный практический выигрыш.

### 3.3. Что станет с TP1-QUIET-TITLE

Новые ожидания для кейса:

| Источник правки | Что происходит | Когда видно в vault |
|---|---|---|
| Приложение TickTick (обычный случай) | `modifiedTime` и `etag` меняются → delta → обновление строки | В следующем sync |
| API или MCP, `modifiedTime` не меняется, но задача в delta (гипотеза) | `etag` другой → эхо не подавляется → строка обновляется | В следующем sync |
| API, и задачи в delta нет (худший случай, не доказан) | Найдётся в суточной сверке через `batch/check/0` (сравнение title, content, status со строкой) | До 24 ч или по команде «Repair» |

Защиту push (`skipPushWhenTickTickRenamedVaultLine`) тоже перевести на `etag`. Если `etag` из delta новее того, что хранится локально, старую строку не отправлять. Без delta — без запроса: строка, которая не менялась, не является правкой, и отправлять её нечего. Сейчас эта функция делает `getTaskById` на каждую неизменённую строку при push.

Новые кейсы для плана тестирования:
- **TP1-QUIET-TITLE-ETAG:** переименовать через MCP или API → один `batch/check` → строка обновлена, `getTaskById = 0`.
- **TP-ECHO-ETAG:** свой push → следующий sync задачу не переписывает (эхо подавлено по `etag`).
- **TP-COMMENT-COUNT:** комментарий добавлен в приложении TT → проверить, пришла ли задача в delta, изменились ли `etag` и `commentCount` → комментарий в vault.
- **TP-IDLE-ZERO:** idle sync → `[perf]` показывает `getTaskById = 0`, `getTaskComments = 0`. Базовая линия «3» в integration test меняется на 0.
- **TP-DAILY-RECONCILE:** правка без delta (имитация в моке) → ловится суточной сверкой.

### 3.4. Риски

1. **Гипотеза про `etag` не проверена.** Если сервер не кладёт правку через API в delta, вариант с `etag` ничего не даст, и TP1 закроет только суточная сверка (задержка до 24 ч против «следующего sync» сейчас). Сначала нужен пилотный эксперимент (§3.5).
2. **Комментарии.** Если добавление комментария не трогает ни задачу, ни delta, комментарии, созданные только в TickTick, доходят до vault с задержкой до суток (сейчас — в следующем sync ценой T запросов). Это нужно согласовать с владельцем продукта.
3. **Отличия `etag` в старых данных.** У записей в Dexie, созданных до изменения, `etag` нет. На первом прогоне все задачи из delta будут «чужими», это нормально. Для задач не из delta ничего не меняется.
4. **Неофициальный API.** `trash/pagination` и `trash/page` расходятся между клиентами. Формат `from` и `to` у `closed` без зоны, локальное это время или UTC, **[проверить]**. Поведение может поменяться без предупреждения, как в #185.
5. **Пагинация `closed`** в публичных источниках описана плохо (только `limit`). При большом окне можно потерять задачи. Окна держать короткими, с перекрытием.
6. **Задачи, удалённые навсегда** (очистка корзины), не видны нигде, кроме `delete[]` в delta.
7. **Регресс по BUG-PULL-COMMENT-STALE и R2 из SMOKE_TESTS.** Их нужно перепроверить на пилоте после изменения.
8. **Activity API** (Premium) не подходит как основной механизм: только Premium, одна задача на вызов, нет фильтра по времени. Можно использовать как диагностику.

### 3.5. Минимальный эксперимент на пилоте, до кода

Делается вручную или локальным агентом с сессией. В box логина нет.

1. Запомнить `checkPoint`. Переименовать задачу **через MCP или Open API**. Вызвать `batch/check/{cp}`. Записать, есть ли задача в `update[]` и изменились ли `modifiedTime` и `etag`.
2. То же для правки в приложении TT.
3. Добавить комментарий в приложении TT. Есть ли задача в delta? Изменились ли `etag`, `modifiedTime`, `commentCount`?
4. Выполнить задачу и удалить задачу. Есть ли они в `update[]` (со `status` 2) и в `delete[]`?
5. Записать итоги в `TEST_PLAN.md` / `ABYSS_FIRST_CASES.md`. От результатов зависит, понадобятся ли шаги 3 и 4 в обычном прогоне и вариант B для комментариев.

---

## 4. Источники

- pyticktick V2 client: https://pyticktick.pretzer.io/reference/client/v2/ и исходники https://github.com/sebpretzer/pyticktick (`models/v2/parameters/closed.py`)
- ticktick-sdk: https://github.com/dev-mirzabicer/ticktick-sdk (`api/v2/client.py`: `/project/all/closed`, `/project/all/trash/pagination`; `api/v2/types.py`: `commentCount`, `SyncStateV2`)
- dida-cli API coverage (проверка вживую 2026-05-10): https://github.com/DeliciousBuding/dida-cli/blob/main/docs/api-coverage.md
- ticktick-mcp-v2, `batch/task` и `etag`: https://github.com/paoloviselli/ticktick-mcp-v2/blob/main/docs/api-analysis/projects-folders-api.md
- MHoroszowski/ticktick-client (activity, Premium): https://github.com/MHoroszowski/ticktick-client
- TickTick API snippet (activity, completed): https://gitlab.com/-/snippets/1827593
- jaeyeonling/ticktick-client #33 (`status=-1` игнорируется, корзина): https://github.com/jaeyeonling/ticktick-client/issues/33
- Официальный Open API: https://developer.ticktick.com/ (текст через https://context7.com/websites/developer_ticktick/llms.txt)
- Почему не Open API: https://github.com/partymola/ticktick-mcp/blob/main/docs/why-not-the-official-api.md
- Upstream TickTickSync troubleshooting: https://thesamim.github.io/TickTickSync/troubleshooting/ ; issue #185: https://github.com/thesamim/TickTickSync/issues/185
- В репозитории: `src/sync/pull.ts:54`, `src/sync/conflicts.ts`, `src/services/VaultSyncCoordinator.ts vaultLineBehindTask`, `src/services/TaskModificationDetector.ts skipPushWhenTickTickRenamedVaultLine`, `src/api/index.ts getUpdatedTasks/getTask`, `src/api/utils/get-api-endpoints.ts`, `CHANGELOG.md` (итерации 2026-10-19 05:32, 05:36, 09:28), `TEST_PLAN.md` TP1-QUIET-TITLE и TP-PERF-SAME, `SMOKE_TESTS.md` R2.
