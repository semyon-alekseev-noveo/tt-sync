# Owner live checklist — Reset + NOTICE tails

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Vault | **Thinkpad-tts-test only** (не live-vault) |
| Tip | текущий `abyss-mapping` (после #288 Sync off; плагин `tickticksync-abyss`) |
| Cases | `BUG-RESET-CACHE-DELETE` (`24`/`25`), `UX-NOTICE-REATTACH` / `UX-NOTICE-MODAL-COPY` (`36`) |
| Sources | `24-…`, `25-…`, `36-…`, `TEST_PLAN.md`, `ABYSS_FIRST_CASES.md` |

Короткий чеклист для владельца. Не выдумывать шаги сверх этих файлов. После прогона — комментарий в issue / правка фазы + `INDEX.md`.

---

## Общие правила

1. Только vault **Thinkpad-tts-test**.
2. Tip = актуальный `abyss-mapping` (не старый zip; Reload плагина после обновления).
3. **Не** жать **Apply once** / Confirm на Sync discrepancies (held / «vault-absent») — только **Don’t delete** / **Skip** / **Rebind** если есть; иначе Cancel (`26`).
4. Любой Confirm Deletion «task not found in local cache» → только **Cancel** (`24`).
5. Результат писать в `25-…` (Reset) и `36-…` (NOTICE); обновить `INDEX.md`; короткий комментарий в связанный issue. Live **pass** для Reset — только после **двух** независимых Sync после Reset (`bug-prove-twice`).

---

## A. BUG-RESET-CACHE-DELETE (Reset → Sync ×2)

Фикстура из `25`: `30 Tasks/301 Noveo_tasks/DON-253.md` (строки с `%%[ticktick_id:: …]%%`, в т.ч. Merge MR / `6ad3324d80c8b04a254e8109`).

### Перед стартом

1. Открыть DON-253, запомнить число маркеров `ticktick_id` (в `25` было **10**).
2. Settings → TickTickSync (Abyss) → убедиться, что remapping/`syncedLists`/`syncScopeFolders` на месте (не трогать без нужды).

### Шаги

1. Settings → **Maintenance** → **Danger zone** → **Reset local sync cache** → подтвердить.  
   (После Settings UX Reset **только** здесь; не Tasks/Notes.)
2. Ожидать notice: локальный sync cache очищен; vault-файлы на месте; `checkPoint` → `0`. TickTick задачи Reset **не** удаляет.
3. **Synchronize** (Maintenance / ribbon / команда).
4. **Pass A:** нет модалки Confirm Deletion «task not found in local cache»; маркеры DON-253 на месте.
5. **Synchronize** ещё раз (второй независимый proof).
6. **Pass B:** то же — нет orphan-strip модалки; маркеры на месте.

### Fail / что НЕ жать

- Модалка «task not found in local cache» / Confirm Deletion → **Cancel** только; записать **fail** в `25`, не Confirm.
- Sync discrepancies «will be deleted» / held после Reset → **не Apply once** (`26`).
- Не чистить маркеры вручную «чтобы помочь» во время prove.

### Куда писать

- `25-reset-cache-delete-prove.md` (checklist prove A/B), `INDEX` строка 25, `TEST_PLAN` / AF live **pass** только после обоих Sync.

---

## B. UX-NOTICE — strip-marker + orphan glance (`36`)

Юнит уже green; нужен owner tip glance.

### B1. Reattach toast (`UX-NOTICE-REATTACH`)

1. В одном in-scope файле с уже синкнутой строкой **снять только** `%%[ticktick_id:: …]%%` (заголовок строки тот же).
2. Дождаться push (Synchronize или settle линии, если reactive sync **on**).
3. **Pass:** toast **Reattached existing…** (со старым id), **не** «New … created».
4. Опционально контроль: новая уникальная строка → toast **New … created** (`TEST_PLAN` UX-NOTICE-REATTACH create).

### B2. Orphan / cleanup copy (`UX-NOTICE-MODAL-COPY`)

1. Maintenance → **Check sync cache** (или Orphan / Clean up, если предложит).
2. **Pass glance:** текст **local sync cache** (не голое «database»); Orphan: Leave alone / Add to vault & cache / Delete from TickTick.
3. Для glance достаточно открыть и прочитать; **не** обязательно Add/Delete. Если Leave alone — ок.

### Fail / что НЕ жать

- Не жать **Apply once** на Sync discrepancies в этом прогоне.
- Не массово Delete orphans «для чистоты» во время NOTICE prove.

### Куда писать

- `36-modal-notice-copy-review.md` (checklist strip-marker + orphan glance), `INDEX` 36, `TEST_PLAN` pilot колонка.

---

## Уже закрыто отдельно (не в этом чеклисте)

- **UX-SET-SYNC-MASTER-OFF** / [#287](https://github.com/semyon-alekseev-noveo/tt-sync/issues/287): owner live OK → см. `49-ux-set-sync-master-off.md`.
