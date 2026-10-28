# 32 — Smoke Settings (глазами)

Только смотри Settings. Ничего опасного не жми. Статусы: ☐ не смотрел · ☑ ок · ✗ плохо.

Vault: Thinkpad-tts-test · Сборка: tip после #199 · Статус: **не запускался**

---

## Как начать

1. Reload плагина `tickticksync-abyss` (или перезапусти Obsidian).
2. Settings → **TickTickSync** (Abyss).
3. Иди по списку ниже. Меняй поля только если в пункте сказано «поставь / очисти».

## Что НЕ жать

Пока идёшь по этому списку — **не** нажимай:

- `Apply once` (held-модалка после sync)
- `Confirm Deletion`
- `Delete from ticktick`
- `Reset local sync database`
- `Purge trash (DB)` (можно найти глазами, кнопку не жать)

`Synchronize` — только если пункт явно просит. Обычно хватает взгляда.

---

## Список

### 1. Слова про удаление

- [ ] **Где:** `Maintenance` + `Sync Control` → `Deletion guard`  
  **Смотри:** `Deletion glossary` (полная таблица) и короткие чипы у Deletion guard.  
  **Ок если:** ясно, что `Skip` ≠ `Cancel` ≠ `Purge trash (DB)`; held-модалка — после sync, не в Purge.  
  **Плохо если:** всё выглядит как одно и то же.  
  `UX-SET-GLOSSARY`

### 2. Пустой Pull filter

- [ ] **Где:** `Sync Control` → GTD  
  **Смотри:** поле `Pull filter tag` — очисти, если не пустое. Badge / tooltip.  
  **Ок если:** badge `pull ALL`; пусто = тянуть **все** задачи из отмеченных списков.  
  **Плохо если:** кажется, что «пусто = ничего не тянуть» или «фильтр выключен и безопасно».  
  `UX-SET-SYNCTAG-EMPTY`

### 3. Purge trash ≠ удаление задач

- [ ] **Где:** `Maintenance`  
  **Смотри:** кнопка/лейбл `Purge trash (DB)` и help рядом.  
  **Ок если:** это чистка уже soft-deleted строк в локальной БД; не held / не `Apply once`.  
  **Плохо если:** похоже на «удалить задачи из TickTick» или на held-модалку.  
  `UX-SET-MANAGE-DELETED`

### 4. Один Reset

- [ ] **Где:** `Maintenance` → `Danger zone`; потом вкладки `Task Settings` и `Task & note format`  
  **Смотри:** есть ли Reset только в Danger zone.  
  **Ок если:** один `Reset local sync database`; на Tasks/Notes Reset нет; текст: vault и TickTick целы.  
  **Плохо если:** Reset в двух местах или звучит как wipe vault/TT.  
  `UX-SET-RESET-ONE`

### 5. Synced lists — справка

- [ ] **Где:** `Sync Control` → GTD → `Synced lists`  
  **Смотри:** короткий help под контролом.  
  **Ок если:** allow-list; пусто → ничего не тянем; новый список TT нужно отметить галкой.  
  **Плохо если:** help нет или непонятно, что пустой список = тишина.  
  `UX-SET-SYNCED-LISTS-HELP`

### 6. Главная кнопка Maintenance

- [ ] **Где:** `Maintenance`  
  **Смотри:** какая кнопка «главная» (яркая / primary).  
  **Ок если:** только `Synchronize` — primary; Check / Backup / Purge — вторичные.  
  **Плохо если:** Purge или Reset выглядит главнее Sync.  
  `UX-SET-MAINT-SYNC-PRIMARY`

### 7. Defaults скрыты (путь GTD)

- [ ] **Где:** `Sync Control` → Defaults (GTD/Abyss уже включён на pilot)  
  **Смотри:** есть ли `Default folder location`.  
  **Ок если:** двойник папки скрыт; папка задач — в GTD (`Tasks folder`).  
  **Плохо если:** два одинаковых контрола папки рядом.  
  `UX-SET-HIDE-DEFAULTS`

### 8. Extra filters нет

- [ ] **Где:** `Sync Control` (есть отмеченные `Synced lists`)  
  **Смотри:** секции `Extra filters` / `Limit synchronization`.  
  **Ок если:** их нет (или не как второй allow-list).  
  **Плохо если:** снова просят выбрать списки «по-старому».  
  `UX-SET-EXTRA-FILTERS`

### 9. Status→list vs Stage→list

- [ ] **Где:** `Sync Control` → GTD; плюс Notes / status map (есть `statusListMappings`)  
  **Смотри:** баннер про Stage→list; блок `Status → list mapping`.  
  **Ок если:** Stage→list неактивен; Status→list под Notes остаётся.  
  **Плохо если:** два живых конкурирующих маппинга списка.  
  `UX-SET-STATUS-VS-STAGE`

### 10. Sync descriptions ≠ Notebook

- [ ] **Где:** `Task & note format` (Notes)  
  **Смотри:** лейбл `Sync task descriptions` vs Notebook.  
  **Ок если:** ясно, что это описания задач (NOTE-BODY), не Notebook.  
  **Плохо если:** путается с `Notebook folder` / Sync Notebook.  
  `UX-SET-SYNC-NOTES`

### 11. Notebook ≠ Inbox

- [ ] **Где:** `Task & note format` → `Notebook folder`  
  **Смотри:** поставь путь вроде `00 Inbox` / Inbox / capture (можно вернуть назад).  
  **Ок если:** Warning; путь сам не переписывается.  
  **Плохо если:** молчит или насильно меняет путь.  
  `UX-SET-NOTEBOOK-WARN`

### 12. Backup folder

- [ ] **Где:** `Maintenance` → `Backup folder`  
  **Смотри:** значение. Если `/` — warn.  
  **Ок если:** дефолт/совет `TickTickSync/backups`; на корне vault есть Warning.  
  **Плохо если:** молча лежит в корне vault без предупреждения.  
  `UX-SET-BKUP-DEFAULT`

### 13. Lean / MOC warn

- [ ] **Где:** `Sync Control` → GTD → `Project note template`  
  **Смотри:** путь с `MOC.md`; потом пустой/lean.  
  **Ок если:** на MOC — Warning; на пустом/lean — тихо.  
  **Плохо если:** warn на всём подряд или нет warn на MOC.  
  `UX-SET-LEAN-WARN`

### 14. Cold start полоска

- [ ] **Где:** верх `Sync Control`  
  **Смотри:** полоска `Cold start — make a synced project`.  
  **Ок если:** Projects note + `#system/project` + `Active Zone` + `Synchronize`; новый список TT — галкой в Synced lists.  
  **Плохо если:** полоски нет или непонятно с чего начать.  
  `UX-SET-COLD-START`

### 15. Known devices

- [ ] **Где:** `Sync Control` → Device Identity → `Known devices`  
  **Смотри:** подписи; кнопка `Remove`.  
  **Ок если:** понятно что за устройства; Remove только не-текущее (`current` не снять).  
  **Плохо если:** можно снести текущее устройство или лейблы каша.  
  `UX-SET-DEVICE-PRUNE`

### 16. Interval = 0

- [ ] **Где:** `Sync Control` → `Automatic sync interval time`  
  **Смотри:** поставь `0`; рядом `Show progress during scheduled sync`.  
  **Ок если:** progress серый/disabled + подсказка про interval.  
  **Плохо если:** toggle живой при нуле.  
  `UX-SET-INTERVAL-ZERO`

### 17. Password confirm

- [ ] **Где:** `Access Control` → смена/ввод пароля Regular Login  
  **Смотри:** диалог перед сохранением.  
  **Ок если:** явное подтверждение plaintext (`Store password in plaintext?`); Cancel — не сохраняет.  
  **Плохо если:** пароль пишется без спроса.  
  `UX-SET-PW-CONFIRM`

---

## После прохода (коротко)

- Дата (UTC):
- Что поставил ☑ / ✗:
- Заметки (пути только относительно vault):

Не ставь live **pass** и не закрывай эпик #189, пока сам не прошёл список.
