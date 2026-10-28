# 32 — Чеклист smoke Settings UX (эпик #189 — код готов)

| Поле | Значение |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Фаза | 32 (pilot smoke — **не запускался**) |
| Эпик | [#189](https://github.com/semyon-alekseev-noveo/tt-sync/issues/189) |
| Фазы-issues | [#191](https://github.com/semyon-alekseev-noveo/tt-sync/issues/191)–[#194](https://github.com/semyon-alekseev-noveo/tt-sync/issues/194) (PR #196–#199) |
| Каталог | `ABYSS_FIRST_CASES.md` `UX-SET-*`; план `27-settings-ux-redesign-plan.md` |
| Vault | Thinkpad-tts-test (только pilot) |
| Сборка | Tip `abyss-mapping` после merge [#199](https://github.com/semyon-alekseev-noveo/tt-sync/pull/199) (`6038e8d`); или BRAT, когда будет тег |
| Статус | **не запускался** — не ставить live **pass** / не закрывать эпик, пока владелец не запишет результаты |

## Входы

- План Phase 0: `27-settings-ux-redesign-plan.md`
- Доказательства реализации: `28`–`31` (unit pass; pilot Settings UI отложен)
- TEST_PLAN § UX-SET

## Tip / установка (релиз на GitHub не обязателен)

1. Pull / checkout tip `abyss-mapping`, в котором есть #199.
2. `npm run build` → скопировать `dist/{main.js,manifest.json,styles.css}` → `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/` **или** BRAT с `abyss-mapping`, если удобнее через релиз.
3. Reload плагина `tickticksync-abyss`. `data.json` / remapping не трогать (не затирать).
4. Открыть **Settings → TickTickSync (Abyss)** и пройти таблицу ниже. Только взгляд — без prove sync-движка, если в строке не сказано `Synchronize`.

## Smoke-чеклист (всё **не запускалось**)

Отметьте строку после просмотра; оставьте **не запускался**, если пропустили. Не выдумывать pass.

### Phase 1 — формулировки / раскладка

| Case | Шаги (≤30–60 с) | Ожидание | Статус |
|------|-----------------|----------|--------|
| UX-SET-GLOSSARY | Глоссарий Maintenance + чипы Sync Control **Deletion guard** (защита от удаления). Различить Skip vs Cancel vs `Purge trash` (DB) (очистить корзину БД). | Вслух верно назвать отличия. | **не запускался** |
| UX-SET-SYNCTAG-EMPTY | GTD: очистить **Pull filter tag**; прочитать badge/tooltip. | Пусто = `pull ALL` allow-listed списков. | **не запускался** |
| UX-SET-MANAGE-DELETED | Maintenance: **Purge trash (DB)** vs модалка held-deletions. | ≠ held / Apply once. | **не запускался** |
| UX-SET-RESET-ONE | Только Maintenance **Danger zone**; у Tasks/Notes нет Reset. | Один контрол Reset; vault+TT целы (по копирайту). | **не запускался** |
| UX-SET-SYNCED-LISTS-HELP | Справка Synced lists под GTD. | Allow-list; пусто → ничего; новый список нужно отметить. | **не запускался** |
| UX-SET-MAINT-SYNC-PRIMARY | Открыть Maintenance. | **Synchronize** — единственная primary CTA. | **не запускался** |

### Phase 2 — видимость (путь Abyss/GTD включён)

| Case | Шаги | Ожидание | Статус |
|------|-------|----------|--------|
| UX-SET-HIDE-DEFAULTS | Sync Control → Defaults (стек GTD включён). | Двойник Default folder скрыт; note → папка GTD Tasks. | **не запускался** |
| UX-SET-EXTRA-FILTERS | Непустой `syncedLists`; Sync Control. | Extra filters / Limit sync отсутствуют. | **не запускался** |
| UX-SET-STATUS-VS-STAGE | Непустой `statusListMappings`; GTD. | Баннер Stage→list неактивен; Status→list под Notes остаётся. | **не запускался** |

### Phase 3 — имена / предупреждения / более безопасные дефолты

| Case | Шаги | Ожидание | Статус |
|------|-------|----------|--------|
| UX-SET-SYNC-NOTES | Notes: **Sync task descriptions**. | ≠ Notebook; help про descriptions / NOTE-BODY. | **не запускался** |
| UX-SET-NOTEBOOK-WARN | Папка Notebook → путь вроде Inbox/capture. | Warn; принудительной перезаписи пути нет. | **не запускался** |
| UX-SET-BKUP-DEFAULT | Maintenance → Backup folder (если значение `/`). | Warn на корне vault; новый дефолт `TickTickSync/backups`. | **не запускался** |
| UX-SET-LEAN-WARN | Шаблон project note → `…/MOC.md`. | Warn lean/MOC; lean/пустой путь — тихо. | **не запускался** |

### Phase 4 — cold-start и полировка

| Case | Шаги | Ожидание | Статус |
|------|-------|----------|--------|
| UX-SET-COLD-START | Верхняя полоса Sync Control. | Projects note + `#system/project` + Active Zone + Synchronize; новый список TT нужно отметить. | **не запускался** |
| UX-SET-DEVICE-PRUNE | Device Identity → Known devices. | Понятные подписи; Remove = только не-текущее. | **не запускался** |
| UX-SET-INTERVAL-ZERO | Automatic sync interval = 0. | Progress-on-scheduled серый/disabled + подсказка. | **не запускался** |
| UX-SET-PW-CONFIRM | Access Control → set/change password. | Явное подтверждение plaintext; Cancel не сохраняет. | **не запускался** |

## Evidence (заполнить после smoke)

- Tip SHA / версия BRAT: `6038e8d` (abyss-mapping после #199); локальная копия tip → `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/` (manifest всё ещё **2.0.94**; в бандле есть cold-start / подсказки `#system/project`); `plugin:reload` пробовали 2026-10-28 ~07:43 UTC
- Дата (UTC): только установка; взгляд Settings **не запускался**
- Заметки / скриншоты (только vault-relative):
- Строки всё ещё **не запускался:** все `UX-SET-*` в таблицах выше

## Заключение

Эпик #189 **code-complete** (фазы 0–4 смержены). Этот файл — pilot Settings smoke владельца по всем `UX-SET-*`. Tip может уже лежать на диске; статус взгляда Settings остаётся **не запускался**, пока таблица не пройдена. **Не** закрывать #189/#194 и не ставить TEST_PLAN / AF live **pass** только по этому чеклисту.

## Чеклист

- [x] Tip с `abyss-mapping` (после #199) установлен на Thinkpad-tts-test (копия агентом; без release/tag)
- [ ] Строки Phase 1 просмотрены
- [ ] Строки Phase 2 просмотрены (путь GTD)
- [ ] Строки Phase 3 просмотрены
- [ ] Строки Phase 4 просмотрены
- [ ] Комментарий в #189 со ссылкой на этот файл + честные статусы (после smoke)
- [ ] Закрывать issues / ставить live pass только после sign-off владельца (не автоматически)
