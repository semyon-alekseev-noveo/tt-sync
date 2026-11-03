# 32 — Smoke Settings (глазами)

Только смотри Settings. Ничего опасного не жми. Статусы: ☐ не смотрел · ☑ ок · ✗ плохо.

| Field | Value |
|-------|--------|
| Vault | Thinkpad-tts-test |
| Tip | `abyss-mapping` after [#270](https://github.com/semyon-alekseev-noveo/tt-sync/pull/270) (ARCH-SYNC closed; Settings copy from #191–#194 + #206) |
| Plugin | `tickticksync-abyss` |
| Status | **ready for owner re-smoke** (rewrite 2026-11-03 — labels match tip) |
| Epic | [#189](https://github.com/semyon-alekseev-noveo/tt-sync/issues/189) · feedback [#205](https://github.com/semyon-alekseev-noveo/tt-sync/issues/205) |

Копирайт в UI: `src/ui/settings/settingsUxCopy.ts`, `settingsUxNames.ts`, `settingsUxVisibility.ts`, `settingsUxPolish.ts`.

---

## Как начать

1. Reload плагина `tickticksync-abyss` (или перезапусти Obsidian).
2. Settings → **TickTickSync**.
3. Вкладки: **Access Control** · **Sync Control** · **Maintenance** · **Task Settings** · **Task & note format**.
4. Иди по списку. Меняй поля только если пункт говорит «поставь / очисти».

## Что НЕ жать

Пока идёшь по списку — **не** нажимай:

- **Apply once** (Sync discrepancies)
- **Confirm** / удаление в TickTick из модалок
- **Delete in TickTick** (orphan modal)
- **Reset local sync cache**
- **Purge soft-deleted cache rows** (можно прочитать help; кнопку не жать)

**Synchronize** / **Check sync cache** — только если пункт явно просит. Обычно хватает взгляда.

**Термин в UI:** везде **local sync cache** (не Dexie / не «local database»).

---

## A. Maintenance

### A1. Tab intro + primary Sync

- [ ] **Где:** `Maintenance` (верх)  
  **Смотри:** intro («run sync / check / backup / purge / Reset»; what/how → Sync Control); кнопка **Synchronize**.  
  **Ок если:** Synchronize — единственная яркая primary (`mod-cta`); Check / Backup / Purge — вторичные.  
  **Плохо если:** Purge или Reset выглядит главнее Sync.  
  `UX-SET-MAINT-SYNC-PRIMARY` · `UX-SET-TAB-OWNERSHIP`

### A2. Deletion glossary (~4 строки)

- [ ] **Где:** `Maintenance` → **Deletion glossary** (и чипы у Deletion guard в Sync Control)  
  **Смотри:** ровно ~4 термина. Ожидаемые имена: **Sync discrepancies → Don’t delete / Rebind / Apply once** · **Confirm (PushDeleteTT) → Don’t delete** · **Purge soft-deleted** · **Reset**.  
  **Ок если:** за 10 сек ясно: Don’t delete / Rebind безопасны; Apply once = wipe; Purge ≠ held; Reset = только cache.  
  **Плохо если:** старые «Skip deletions» / «Held deletions» / «Purge trash (DB)» / «Dexie» или простыня из 7+ строк.  
  `UX-SET-GLOSSARY`

### A3. Check sync cache (orphans)

- [ ] **Где:** `Maintenance` → **Check local sync cache** / кнопка **Check sync cache**  
  **Смотри:** help (не жми, если не готов к модалке).  
  **Ок если:** это rare diagnostic, не второй Synchronize; day-to-day → Synchronize (Don’t delete / Rebind). Orphans = нет matching id; **Leave TickTick alone** обычно после restore; Add may duplicate; Delete in TickTick.  
  **Плохо если:** Check звучит как обычный sync или молчит про орфанов.  
  *(UX-SYNC-ONE-FLOW / Maintenance follow-up)*

### A4. Purge soft-deleted

- [ ] **Где:** `Maintenance` → **Purge soft-deleted cache rows**  
  **Смотри:** лейбл + help (когда появляются soft-deleted rows, retention days).  
  **Ок если:** чистит только soft-deleted строки **local sync cache**; ≠ live TT delete, ≠ vault wipe, ≠ held / Apply once.  
  **Плохо если:** похоже на «удалить задачи из TickTick» или на Sync discrepancies.  
  `UX-SET-MANAGE-DELETED` (#205 §3)

### A5. One Reset

- [ ] **Где:** `Maintenance` → **Danger zone**; потом `Task Settings` и `Task & note format`  
  **Смотри:** есть ли Reset только в Danger zone.  
  **Ок если:** один **Reset local sync cache**; на Tasks/Notes Reset нет; copy: vault markdown + TickTick intact. Нигде нет «Dexie».  
  **Плохо если:** Reset в двух местах или звучит как wipe vault/TT.  
  `UX-SET-RESET-ONE` (#205 §4)

### A6. Backup folder

- [ ] **Где:** `Maintenance` → **Backup folder**  
  **Смотри:** значение. Если `/` — warn.  
  **Ок если:** совет/дефолт `TickTickSync/backups`; на корне vault — Warning.  
  **Плохо если:** молча корень vault без предупреждения.  
  `UX-SET-BKUP-DEFAULT`

---

## B. Sync Control

### B1. Tab intro + cold start

- [ ] **Где:** верх `Sync Control`  
  **Смотри:** intro (what/how to sync; run → Maintenance → Synchronize); полоска **Cold start — make a synced project**.  
  **Ок если:** Projects note + `#system/project` + Active Zone + Synchronize; новый TT list — галкой в Synced lists.  
  **Плохо если:** полоски нет или непонятно с чего начать; Full vault выглядит как «главный sync».  
  `UX-SET-COLD-START` · `UX-SET-TAB-OWNERSHIP` (#205 §6)

### B2. Synced lists — help + layout

- [ ] **Где:** `Sync Control` → **GTD and projects** → **Synced lists**  
  **Смотри:** help; панель списков на всю ширину; stale/unknown блок (**Remove from allow-list** / Remove all stale).  
  **Ок если:** allow-list; пусто → ничего не тянем; новый TT list нужно отметить; layout не прижат к правому краю; stale можно снять.  
  **Плохо если:** help нет; numbered/stale нельзя убрать; UI «сломан».  
  `UX-SET-SYNCED-LISTS-HELP` · `UX-SET-SYNCED-LISTS-LAYOUT` (#205 §5)

### B3. Пустой Pull filter

- [ ] **Где:** `Sync Control` → GTD → **Pull filter tag**  
  **Смотри:** очисти, если не пустое. Badge / tooltip.  
  **Ок если:** badge **`pull ALL`**; пусто = тянуть **все** задачи из отмеченных списков.  
  **Плохо если:** «пусто = ничего не тянуть» или «фильтр выключен и безопасно».  
  `UX-SET-SYNCTAG-EMPTY`

### B4. Defaults (Abyss ON)

- [ ] **Где:** `Sync Control` → Defaults (pilot: Abyss/GTD ON)  
  **Смотри:** help про Abyss ON vs OFF; **Default Project (fallback list)**; есть ли twin **Default folder location**.  
  **Ок если:** понятен dual-mode текст; на Abyss path folder-twin скрыт (Tasks folder — в GTD); Default Project = fallback, не «единственный список».  
  **Плохо если:** два одинаковых контрола папки или Defaults непрозрачны.  
  `UX-SET-HIDE-DEFAULTS` · `UX-SET-DEFAULTS-MODE` (#205 §7)

### B5. Extra filters нет

- [ ] **Где:** `Sync Control` (есть отмеченные Synced lists)  
  **Смотри:** секции **Extra filters** / Limit synchronization.  
  **Ок если:** их нет (или note что hidden while synced lists are allow-list).  
  **Плохо если:** снова просят выбрать списки «по-старому».  
  `UX-SET-EXTRA-FILTERS`

### B6. Status → list vs GTD tag → list

- [ ] **Где:** `Sync Control` → GTD; плюс Notes / **Status → list mapping** (pilot: есть `statusListMappings`)  
  **Смотри:** баннер; лейбл **GTD tag → list mapping (inactive)** — без слова «stage».  
  **Ок если:** GTD tag→list inactive; Status→list остаётся SoT; jargon = **tag**, не stage.  
  **Плохо если:** два живых конкурирующих list-map или «GTD stage mapping (inactive)».  
  `UX-SET-STATUS-VS-STAGE` (#205 §9)

### B7. Lean / MOC warn

- [ ] **Где:** GTD → **Project note template**  
  **Смотри:** путь с `MOC.md`; потом пустой/lean.  
  **Ок если:** на MOC — Warning; на пустом/lean — тихо.  
  **Плохо если:** warn на всём подряд или нет warn на MOC.  
  `UX-SET-LEAN-WARN`

### B8. Known devices

- [ ] **Где:** `Sync Control` → Device Identity → **Known devices**  
  **Смотри:** подписи; **Remove**.  
  **Ок если:** понятно что за устройства; Remove только не-текущее (badge **current** не снять).  
  **Плохо если:** можно снести текущее или лейблы каша.  
  `UX-SET-DEVICE-PRUNE`

### B9. Interval = 0

- [ ] **Где:** `Sync Control` → automatic sync interval  
  **Смотри:** поставь `0`; рядом **Show progress during scheduled sync**.  
  **Ок если:** progress серый/disabled + hint про interval.  
  **Плохо если:** toggle живой при нуле.  
  `UX-SET-INTERVAL-ZERO`

### B10. Full vault (правило, не run)

- [ ] **Где:** `Sync Control` → Full vault sync  
  **Смотри:** help.  
  **Ок если:** это **rule** здесь; Abyss/GTD обычно off; run → Maintenance → Synchronize.  
  **Плохо если:** кажется дублем кнопки Synchronize.  
  `UX-SET-TAB-OWNERSHIP` (#205 §6)

---

## C. Task & note format · Access Control

### C1. Notebook ≠ Inbox

- [ ] **Где:** `Task & note format` → **Notebook folder**  
  **Смотри:** поставь путь вроде `00 Inbox` / Inbox / capture (можно вернуть).  
  **Ок если:** Warning; путь сам не переписывается.  
  **Плохо если:** молчит или насильно меняет путь.  
  `UX-SET-NOTEBOOK-WARN`

### C2. Password confirm

- [ ] **Где:** `Access Control` → смена/ввод пароля Regular Login  
  **Смотри:** диалог перед сохранением.  
  **Ок если:** явное **Store password in plaintext?**; Cancel — не сохраняет.  
  **Плохо если:** пароль пишется без спроса.  
  `UX-SET-PW-CONFIRM`

### — Skip (owner)

- **Sync task descriptions ≠ Notebook** — owner 2026-10-28: **not needed** (#205 §10). Не смотри для закрытия эпика.

---

## После прохода (коротко)

- Дата (UTC):
- Что поставил ☑ / ✗ (особенно **A4–A5, B1–B2, B4, B6** = бывшие #205 §3–9):
- Заметки (пути только относительно vault):

Не ставь live **pass** и не закрывай эпик #189, пока сам не прошёл этот список.
После прохода: комментарий в [#205](https://github.com/semyon-alekseev-noveo/tt-sync/issues/205) + обновить статус здесь / в `INDEX.md`.
