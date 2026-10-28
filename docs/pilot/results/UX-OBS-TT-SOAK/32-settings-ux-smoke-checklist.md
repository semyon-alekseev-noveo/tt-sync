# 32 — Smoke Settings (глазами)

Только смотри Settings. Ничего опасного не жми. Статусы: ☐ не смотрел · ☑ ок · ✗ плохо.

Vault: Thinkpad-tts-test · Сборка: tip после #199 / #204 · Статус: **частично** (owner smoke 2026-10-28)  
Фидбек §3–9 → [#205](https://github.com/semyon-alekseev-noveo/tt-sync/issues/205)

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



### 1. Глоссарий удалений (короткий)

- [x] **Где:** `Maintenance` (таблица) и `Deletion guard` (чипы)  
  **Смотри:** ровно ~4 строки: Held→Skip · Confirm→Cancel · Purge · Reset.  
  **Ок если:** за 10 сек понятно три «безопасных» хода: Skip / Cancel / не трогать Purge.  
  **Плохо если:** простыня из 7+ терминов или всё звучит одинаково.  
  `UX-SET-GLOSSARY`



### 1b. Орфаны в Maintenance

- [x] **Где:** `Maintenance` → `Check Database`  
  **Смотри:** help под кнопкой (не жми, если не готов к модалке).  
  **Ок если:** написано явно: модалка `Orphaned TickTick Tasks` → **Cancel** = оставить в TT (обычно после Reset); `Add to file & db` = забрать в vault; `Delete from ticktick` = удалить в TT (не жать без нужды).  
  **Плохо если:** Check Database молчит про орфанов или непонятно, что жать.  
  *(не отдельный UX-SET; follow-up к Maintenance / #189)*



### 2. Пустой Pull filter

- [x] **Где:** `Sync Control` → GTD  
  **Смотри:** поле `Pull filter tag` — очисти, если не пустое. Badge / tooltip.  
  **Ок если:** badge `pull ALL`; пусто = тянуть **все** задачи из отмеченных списков.  
  **Плохо если:** кажется, что «пусто = ничего не тянуть» или «фильтр выключен и безопасно».  
  `UX-SET-SYNCTAG-EMPTY`



### 3. Purge trash ≠ удаление задач

- [x] **Где:** `Maintenance`  
  **Смотри:** кнопка/лейбл `Purge trash (DB)` и help рядом.  
  **Ок если:** это чистка уже soft-deleted строк в локальной БД; не held / не `Apply once`.  
  **Плохо если:** похоже на «удалить задачи из TickTick» или на held-модалку.  
  `UX-SET-MANAGE-DELETED`  
  **Owner 2026-10-28 ✗:** непонятно что такое trash и когда возникает → [#205](https://github.com/semyon-alekseev-noveo/tt-sync/issues/205)



### 4. Один Reset

- [x] **Где:** `Maintenance` → `Danger zone`; потом вкладки `Task Settings` и `Task & note format`  
  **Смотри:** есть ли Reset только в Danger zone.  
  **Ок если:** один `Reset local sync database`; на Tasks/Notes Reset нет; текст: vault и TickTick целы.  
  **Плохо если:** Reset в двух местах или звучит как wipe vault/TT.  
  `UX-SET-RESET-ONE`  
  **Owner 2026-10-28 ✗ (terms):** в UI путаются local database / Dexie / др. → единый термин, [#205](https://github.com/semyon-alekseev-noveo/tt-sync/issues/205)



### 5. Synced lists — справка

- [x] **Где:** `Sync Control` → GTD → `Synced lists`  
  **Смотри:** короткий help под контролом.  
  **Ок если:** allow-list; пусто → ничего не тянем; новый список TT нужно отметить галкой.  
  **Плохо если:** help нет или непонятно, что пустой список = тишина.  
  `UX-SET-SYNCED-LISTS-HELP`  
  **Owner 2026-10-28 ✗:** layout прижат вправо; старые номерные списки нельзя убрать → [#205](https://github.com/semyon-alekseev-noveo/tt-sync/issues/205)



### 6. Главная кнопка Maintenance

- [x] **Где:** `Maintenance`  
  **Смотри:** какая кнопка «главная» (яркая / primary).  
  **Ок если:** только `Synchronize` — primary; Check / Backup / Purge — вторичные.  
  **Плохо если:** Purge или Reset выглядит главнее Sync.  
  `UX-SET-MAINT-SYNC-PRIMARY`  
  **Owner 2026-10-28 ✗ (tabs):** Full sync / смыслы дублируются Maintenance ↔ Sync Control → [#205](https://github.com/semyon-alekseev-noveo/tt-sync/issues/205)



### 7. Defaults скрыты (путь GTD)

- [x] **Где:** `Sync Control` → Defaults (GTD/Abyss уже включён на pilot)  
  **Смотри:** есть ли `Default folder location`.  
  **Ок если:** двойник папки скрыт; папка задач — в GTD (`Tasks folder`).  
  **Плохо если:** два одинаковых контрола папки рядом.  
  `UX-SET-HIDE-DEFAULTS`  
  **Owner 2026-10-28 ✗:** Defaults непонятны; нужен dual-mode Abyss ON/OFF → [#205](https://github.com/semyon-alekseev-noveo/tt-sync/issues/205)



### 8. Extra filters нет

- [x] **Где:** `Sync Control` (есть отмеченные `Synced lists`)  
  **Смотри:** секции `Extra filters` / `Limit synchronization`.  
  **Ок если:** их нет (или не как второй allow-list).  
  **Плохо если:** снова просят выбрать списки «по-старому».  
  `UX-SET-EXTRA-FILTERS`



### 9. Status→list vs Stage→list

- [x] **Где:** `Sync Control` → GTD; плюс Notes / status map (есть `statusListMappings`)  
  **Смотри:** баннер про Stage→list; блок `Status → list mapping`.  
  **Ок если:** Stage→list неактивен; Status→list под Notes остаётся.  
  **Плохо если:** два живых конкурирующих маппинга списка.  
  `UX-SET-STATUS-VS-STAGE`  
  **Owner 2026-10-28 ✗:** «stage» непонятно — если это тег, так и назвать → [#205](https://github.com/semyon-alekseev-noveo/tt-sync/issues/205)



### 10. Sync descriptions ≠ Notebook

- [ ] **Где:** `Task & note format` (Notes)  
  **Смотри:** лейбл `Sync task descriptions` vs Notebook.  
  **Ок если:** ясно, что это описания задач (NOTE-BODY), не Notebook.  
  **Плохо если:** путается с `Notebook folder` / Sync Notebook.  
  `UX-SET-SYNC-NOTES`  
  **Owner 2026-10-28:** сообщение оборвалось на «10 -» — допиши фидбек



### 11. Notebook ≠ Inbox

- [x] **Где:** `Task & note format` → `Notebook folder`  
  **Смотри:** поставь путь вроде `00 Inbox` / Inbox / capture (можно вернуть назад).  
  **Ок если:** Warning; путь сам не переписывается.  
  **Плохо если:** молчит или насильно меняет путь.  
  `UX-SET-NOTEBOOK-WARN`



### 12. Backup folder

- [x] **Где:** `Maintenance` → `Backup folder`  
  **Смотри:** значение. Если `/` — warn.  
  **Ок если:** дефолт/совет `TickTickSync/backups`; на корне vault есть Warning.  
  **Плохо если:** молча лежит в корне vault без предупреждения.  
  `UX-SET-BKUP-DEFAULT`



### 13. Lean / MOC warn

- [x] **Где:** `Sync Control` → GTD → `Project note template`  
  **Смотри:** путь с `MOC.md`; потом пустой/lean.  
  **Ок если:** на MOC — Warning; на пустом/lean — тихо.  
  **Плохо если:** warn на всём подряд или нет warn на MOC.  
  `UX-SET-LEAN-WARN`



### 14. Cold start полоска

- [x] **Где:** верх `Sync Control`  
  **Смотри:** полоска `Cold start — make a synced project`.  
  **Ок если:** Projects note + `#system/project` + `Active Zone` + `Synchronize`; новый список TT — галкой в Synced lists.  
  **Плохо если:** полоски нет или непонятно с чего начать.  
  `UX-SET-COLD-START`



### 15. Known devices

- [x] **Где:** `Sync Control` → Device Identity → `Known devices`  
  **Смотри:** подписи; кнопка `Remove`.  
  **Ок если:** понятно что за устройства; Remove только не-текущее (`current` не снять).  
  **Плохо если:** можно снести текущее устройство или лейблы каша.  
  `UX-SET-DEVICE-PRUNE`



### 16. Interval = 0

- [x] **Где:** `Sync Control` → `Automatic sync interval time`  
  **Смотри:** поставь `0`; рядом `Show progress during scheduled sync`.  
  **Ок если:** progress серый/disabled + подсказка про interval.  
  **Плохо если:** toggle живой при нуле.  
  `UX-SET-INTERVAL-ZERO`



### 17. Password confirm

- [x] **Где:** `Access Control` → смена/ввод пароля Regular Login  
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