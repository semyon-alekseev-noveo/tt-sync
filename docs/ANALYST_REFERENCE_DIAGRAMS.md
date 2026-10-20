# Опорные схемы (аналитический мит 2026-10-19)

**Назначение:** перед правкой бага смотреть, **какой поток** затронут, и не ломать соседние границы. Детальный research-sync — в [`GTD_SYNC_RESEARCH.md`](../GTD_SYNC_RESEARCH.md) §3; delta/checkpoint/комментарии без N+1 — [`TICKTICK_DELTA_API.md`](TICKTICK_DELTA_API.md); smoke-IDs — [`SMOKE_TESTS.md`](../SMOKE_TESTS.md).

---

## 1. Analyst B — слои плагина (куда вносить diff)

```mermaid
flowchart TB
  subgraph UI["UI / lifecycle"]
    MAIN[main.ts]
    EVT[EventHandlerService]
    SET[Settings / Notices]
  end
  subgraph Orchestration["Orchestration"]
    SVC[TickTickService services/index.ts]
    SYNC[synchronizationInner]
  end
  subgraph Push["Obsidian → TickTick"]
    TMD[TaskModificationDetector]
    TP[taskParser / convertLineToTask]
    ABYSS_PUSH[abyssCommentSync.syncAbyssCommentsToTickTick]
    API[TicktickRestAPI / Tick]
  end
  subgraph Store["Local store"]
    DEX[Dexie tasks + meta + taskCommentMaps]
    REPO[TaskRepository]
  end
  subgraph Pull["TickTick → Obsidian"]
    PULL[pullFromTickTick / sync.ts]
    VSC[VaultSyncCoordinator]
    FO[fileOperation / convertTaskToLine]
    ABYSS_PULL[mergeAbyssBlock + _apiComments]
  end
  MAIN --> EVT
  MAIN --> SVC
  SVC --> SYNC
  SYNC --> TMD
  SYNC --> PULL
  SYNC --> VSC
  TMD --> TP
  TMD --> ABYSS_PUSH
  TMD --> API
  PULL --> DEX
  VSC --> FO
  FO --> ABYSS_PULL
  REPO --> DEX
```

| Если баг… | Править в первую очередь | Не трогать без нужды | Прогон |
|-----------|--------------------------|----------------------|--------|
| Комментарии не в TT **Comments** | `TaskModificationDetector`, `abyssCommentSync`, `abyssFormat` | `VaultSyncCoordinator` routing, project scheme | `abyssCommentSync.test.ts`, `taskModificationCommentSmoke.test.ts`, NOTE-L3b |
| Описание `- >` не в `content` | `taskParser`, `convertLineToTask` | `taskCommentMaps`, comment API | `notesSmoke.test.ts`, NOTE-L1 |
| Тихий sync / ложный «completed» | `api/index getUpdatedTasks`, `sync.ts`, `main synchronizeNow` | Dexie schema | `sync.test.ts` pull error |
| Delta / API rename не в vault / лишние `getTaskById` | `pull.ts` echo, `conflicts.ts`, `VaultSyncCoordinator vaultLineBehindTask`, `getUpdatedTasks` | Comment maps | `TICKTICK_DELTA_API.md`, `TEST_PLAN.md` TP-DELTA-* |
| Строка в vault устарела | `VaultSyncCoordinator`, `fileOperation` | Push hash в TMD | `syncSmoke`, pull tests |
| Дубли тегов | `contextTags`, `taskParser` push tags | Comment API | `contextTags.test.ts` CTX-D* |

**Правило:** не смешивать в одном MR **push-комментарии** и **маршрутизацию файлов** — разные аналитики, разные регрессии.

---

## 2. Analyst C — полный цикл Synchronize (порядок фаз)

```mermaid
sequenceDiagram
  participant U as User / Obsidian
  participant M as main.scheduledSynchronization
  participant S as synchronizationInner
  participant P as pushLocalEditsFirst
  participant TMD as TaskModificationDetector
  participant TT as TickTick API
  participant D as Dexie
  participant V as VaultSyncCoordinator

  U->>M: Synchronize
  M->>S: synchronization(fullSync?)
  S->>P: edited files since last sync
  P->>TMD: checkFileForModifications
  Note over TMD: push task + abyssCommentSync sweep
  TMD->>TT: updateTask / addTaskComment
  S->>TT: getUpdatedTasks (fail-closed)
  TT-->>D: pull delta
  S->>V: syncVaultWithDatabase
  V->>U: vault.modify lines
```

| Фаза | Инвариант | Типичный баг |
|------|-----------|--------------|
| **Push до pull** | Локальные правки уходят до перезаписи vault | Потеря `[x]` / child lines |
| **Pull fail-closed** | Ошибка `getUpdatedTasks` → sync failed, checkpoint не «успех» | Пустая дельта, «всё синкнулось» |
| **Vault write** | LWW + `vaultLineBehindTask` для догонки | TT-only comment не в `.md` |
| **Active file** | `vault.modify` пропускает открытый файл | Нужен `editor-change` debounce |

---

## 3. Analyst A — Abyss block: описание vs комментарии (Phase 1 API)

```mermaid
flowchart LR
  subgraph Vault["Vault under checkbox"]
    L0["- [ ] task %%ticktick_id%%"]
    L1["- > description"]
    L2["- stamp: comment"]
  end
  subgraph Push["Push path"]
    HASH[abyssBlockHashInput]
    UPD[updateTask content = description only]
    API[syncAbyssCommentsToTickTick]
  end
  subgraph TT["TickTick"]
    CNT[Task content / desc]
    COM[Comments panel API]
  end
  subgraph Pull["Pull path"]
    GET[getTaskComments]
    MERGE[mergeAbyssBlock / formatApiCommentAsAbyssLines]
  end
  L0 --> HASH
  L1 --> UPD
  L2 --> API
  UPD --> CNT
  API --> COM
  GET --> MERGE
  MERGE --> L2
```

**Границы данных (не ломать):**

| Сущность | Vault | TickTick task body | TickTick Comments API | Dexie `taskCommentMaps` |
|----------|-------|--------------------|------------------------|-------------------------|
| Описание `- >` | да | `content` | нет | нет |
| Комментарий `- date:` | да | **нет** (при API on) | `title` комментария | fingerprint ↔ tt comment id |
| Legacy `Comments:` в body | миграция | убирается при push | переносится в API | создаётся map |

**Триггеры push комментария (все должны оставаться рабочими):**

1. `checkLineForModifications` на **родительской** строке (hash / applyModifications).
2. Перенаправление с **дочерней** Abyss-строки на родителя (`findAbyssParentTaskLine`).
3. **`syncAllAbyssCommentsInFile`** в конце `checkFileForModifications` (полный Synchronize).
4. Debounced **`pushActiveFileEdits`** для открытого файла.

**Перед коммитом при баге комментариев:** убедиться, что строка **есть на диске** (Abyss + Enter), затем **Synchronize**; проверка — MCP `get_comment(project_id, task_id)`, не поле `content`.

---

## 4. Матрица «безопасная правка»

1. Найти ID бага в [`PO_STATUS.md`](../PO_STATUS.md) → столбец «суть».
2. Открыть схему выше (A / B / C).
3. Ограничить diff **одним подграфом** (Push *или* Pull *или* UI).
4. Добавить/обновить **один** targeted test (smoke ID из `SMOKE_TESTS.md`).
5. Не менять hash + API + routing в одном коммите без интеграционного теста.

---

## References

- [`PO_STATUS.md`](../PO_STATUS.md) — Problems / To Be Done
- [`CHANGELOG.md`](../CHANGELOG.md) — итерации
- [`ABYSS_NOTES_ALIGNMENT.md`](../ABYSS_NOTES_ALIGNMENT.md) — формат строк
- [`GTD_SYNC_RESEARCH.md`](../GTD_SYNC_RESEARCH.md) — полный mermaid sync
