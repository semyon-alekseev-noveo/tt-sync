# TickTick folder stubs — why `30 Tasks/TickTick` (and parked twins)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Plugin | **2.0.94** (pilot) |
| Vault | Thinkpad-tts-test (paths below are vault-relative) |
| Status | **done** (inventory + code/docs; no product change) |
| Inputs | Vault tree; plugin settings (non-secret); `ProjectSyncService` / `VaultSyncCoordinator`; `GTD_SYNC_RESEARCH` G1; `ABYSS_FIRST_PLAN` P6; soak `01b` / `05` / `06`; `.tickticksync` journal + pilot-17 notes |

## Inventory (pilot, 2026-10-27)

| Tree | What | Count |
|------|------|-------|
| `30 Tasks/TickTick/` | Live list stubs (`TTS-*.md`) | **1** dir; **6** stubs |
| `zz-parked-17/30 Tasks/TickTick/` | Duplicate stubs (re-created empty) | **1** dir; **5** stubs (no `TTS-nextAction`) |
| `10 Projects/TTS-*.md` | Real project notes (scheme) — **not** list stubs | **4** notes |
| `TickTick Notebook/` | Notebook sync notes (separate feature) | **6** notes |
| Other dirs named `TickTick` | — | **0** beyond the two above |

Live stubs (almost empty banners): `TTS-Inbox`, `TTS-nextAction` (one FOOL line), `TTS-Planned`, `TTS-Projects`, `TTS-someDay`, `TTS-waitingFor`.  
Parked copies: same names minus `TTS-nextAction`; banner `== Added by TickTickSync (Abyss fork) -- 2.0.94 ==`. Journal `sync-mvqe4xqv-v-3ydn` (`2026-10-27T07:55:32Z`) shows `tt->obs` **file create** into `zz-parked-17/30 Tasks/TickTick/…`.

Pilot settings (safe): `TickTickTasksFilePath=30 Tasks/TickTick`, `newTasksFile=""`, `projectSchemeEnabled=true`, `abyssTasksFormat=true`, `syncedLists` = six `TTS-*` lists, `syncScopeFolders` = `00 Inbox/`, `10 Projects/`, `30 Tasks/`. `data.json` has **no** `zz-parked` path; recreation comes from **Dexie file mappings**, not from the setting string.

### Зачем папка `30 Tasks/TickTick`

Это **папка зеркал списков** классического TickTickSync: настройка `TickTickTasksFilePath` («Default folder»). Плагин кладёт туда по одному markdown-файлу на allow-listed TickTick-лист (`syncedLists`), чтобы был путь «один TT list → один `.md`» для pull/mapping (`defaultProjectId` ↔ файл).

Без этой настройки stubs раньше сыпались в **корень** vault (`TickTickTasksFilePath='/'`) — см. `GTD_SYNC_RESEARCH` G1 / AC-2. Папка `30 Tasks/TickTick` как раз и есть «не мусорить в корне».

Остальное под `30 Tasks/` (`301 Noveo_tasks/`, архивы и т.д.) — **человеческая/Abyss** структура vault, не stubs плагина.

### Что внутри (TTS-* lists)

Файлы вида `TTS-<ListName>.md` — **list stubs**:

- Создаются в `ProjectSyncService.checkProjectRename` (banner `== Added by … ==`).
- Пересоздаются, если в Dexie есть mapping, а файла нет: `VaultSyncCoordinator.ensureProjectFilesExist`.
- После фикса G1 stubs только для **`syncedLists`** (не для всех списков аккаунта). Пустой `syncedLists` → stubs не создаются.
- Режим `newTasksFile` (single-file hub) отключает per-list файлы; в пилоте `newTasksFile` **пустой** → stubs **всё ещё создаются**.

В текущем Abyss/GTD пилоте содержимое почти пустое: задачи живут в `10 Projects/…` (Active Zone) и scoped notes, а не как «зеркало всего списка» в stub.

Не путать с `10 Projects/TTS-PILOT-….md` / `TTS-QA-….md`: это **project notes** scheme (`ticktick_id` во frontmatter, MOC/Active Zone), не list stubs.

### Откуда дубликаты (zz-parked / other)

Два дерева `…/TickTick/` — **не** задуманный dual-mirror.

1. **Live** `30 Tasks/TickTick/` — канонический путь из `TickTickTasksFilePath`.
2. **`zz-parked-17/30 Tasks/TickTick/`** — артефакт pilot-17 (empty-vault / deletion-guard): деревья `00 Inbox`, `10 Projects`, `30 Tasks` уезжали в `zz-parked-17/…`; restore частично failed (`Destination already exists`), в Dexie остались orphan paths на parked stubs. Следующий sync (`ensureProjectFilesExist`) **дописывает пустые TTS-*.md обратно в parked**, даже когда «живые» stubs уже есть под `30 Tasks/TickTick/`. Подтверждено journal + soak `01b`.

Других дублей `TickTick/` в vault нет. `TickTick Notebook/` — отдельная фича, не duplicate list folder.

### Нужны ли они при текущем Abyss/GTD режиме

**Как источник правды для задач — нет.** Abyss-first (P6): topology R («строка обязана жить в list file») **parked**; sync не обязан зеркалить vault-born задачи в `TickTickTasksFilePath/<List>.md`. Работают `projectScheme` + `syncScopeFolders` + `abyssTasksFormat` + tag→list.

**Как инфраструктура classic upstream — пока да (по умолчанию кода):** пока `newTasksFile` пуст, allow-listed lists всё равно получают stub + Dexie file entry. Stubs остаются fallback pull target / mapping anchor; в пилоте почти не используются как UX-поверхность. Это **не «случайно забытый мусор настроек»**, а унаследованное поведение per-list mode; при Abyss-first оно выглядит как шум.

`syncScopeFolders` **не** отключает создание stubs (scope = куда можно push/смотреть задачи, не «не создавай list files»).

### Что можно сделать (options)

| Option | Действие | Плюс / минус |
|--------|----------|----------------|
| **Leave** | Оставить `30 Tasks/TickTick/` как есть; parked не трогать глазами | Ноль риска; шум в file tree остаётся |
| **Stop creating** (product later) | Lazy stubs / skip when `abyssTasksFormat` + scheme / require `newTasksFile` hub | Убирает UX-шум; нужен код + проверка fallback pull |
| **Ignore-style** | Не индексировать / не показывать `30 Tasks/TickTick/` и `zz-parked-*` в Abyss queries; exclude parked from write targets | Быстрый UX-выигрыш без смены sync model (см. decision `06` вариант D) |
| **Delete parked** | Удалить `zz-parked-17/30 Tasks/TickTick/` (или весь `zz-parked-17`) **и** почистить Dexie `files` paths на `zz-parked-*`, иначе sync **создаст снова** | Чистит дубликат; без cleanup DB — бессмысленно |

Практичный порядок для пилота: **ignore-style + (опционально) delete parked after Dexie cleanup**; **leave** live stubs until product decides stop-creating. Не удалять только live `30 Tasks/TickTick/` без понимания mapping — sync их вернёт.

### Follow-up (code)

Owner chose **stop-creating**. Cases **UX-STUB-1** / **BUG-LIST-STUB-RECREATE**: Abyss/GTD predicate (`projectSchemeEnabled` + `abyssTasksFormat` + `syncScopeFolders`) skips list stubs; parked Dexie paths drop instead of recreate. Plugin still does not auto-delete existing vault stub files — owner cleans `30 Tasks/TickTick/TTS-*.md` and `zz-parked-17/…` after install.

## Checklist

- [x] Vault inventory (dirs / stub counts) without secrets
- [x] Code/settings path for stub creation documented
- [x] Distinguishes list stubs vs project notes vs parked accident
- [x] Abyss/GTD necessity answered
- [x] Options listed; no plugin code change in this note
