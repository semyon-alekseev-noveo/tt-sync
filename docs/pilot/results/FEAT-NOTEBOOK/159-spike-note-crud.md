# FEAT-NOTEBOOK spike — note-project + NOTE CRUD

## Meta

| Field | Value |
|-------|--------|
| Issue | [#159](https://github.com/semyon-alekseev-noveo/tt-sync/issues/159) |
| Recorded | 2026-10-26 ~08:51 UTC |
| Runner | agent (TickTick MCP only) |
| Status | Spike **done** — no plugin vault mapping yet |

## Inputs

- `docs/pilot/NOTEBOOK.md` slice 1 (Spike S)
- Safety gate [#160](https://github.com/semyon-alekseev-noveo/tt-sync/issues/160) already merged

## Evidence

1. **Note project:** `TTS-Notebook-Safety` id `6adeff608f08dc411431aff4`, `kind: NOTE` (listed via `list_projects`).
2. **Create NOTE:** `create_task` with `kind: NOTE` → id `6adf147e8f08f3950543e3aa`, title `FEAT-NOTEBOOK spike 154900`, content `spike body CRUD`.
3. **Update NOTE:** `update_task` content → `spike body CRUD updated`; `kind` stayed `NOTE`.

Delta behaviour for NOTE items vs tasks: **not measured** in this spike (no plugin delta log capture). Follow-up MVP should log whether NOTE updates appear in `batch/check` `update[]` when only content changes.

## Conclusion

Unofficial API already supports note-project + NOTE CRUD. Next MVP: opt-in vault folder + id mapping; keep default off on Abyss pilots. Do not confuse with NOTE-BODY / `syncNotes`.

## Checklist

- [x] List note-project
- [x] Create NOTE
- [x] Update NOTE content
- [ ] Delta behaviour note in plugin logs
- [ ] MVP TT→vault folder (PO folder/id)
