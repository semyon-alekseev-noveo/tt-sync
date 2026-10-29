# ID-CHAIN glossary — Skip / Cancel / Confirm / Rebind

| Field | Value |
|-------|--------|
| Issue | [#217](https://github.com/semyon-alekseev-noveo/tt-sync/issues/217) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| Cross-link | Settings `UX-SET-GLOSSARY` / Deletion glossary |

## Owner 30s

| UI | Safe | Avoid after restore |
|----|------|---------------------|
| **Held deletions** modal | **Skip** · **Rebind vault to TickTick (no TT deletes)** · Open report | **Apply once** (wipes TickTick for missing vault markers) |
| **Confirm Deletion** | **Cancel** | Confirm Deletion |
| Settings → Purge | leave alone unless clearing soft-deleted cache rows | confusing with Apply once |
| Settings → Reset | only if you mean wipe local Dexie | then Synchronize + Rebind/Skip, never Apply |

**Rebind** = rewrite/attach vault `ticktick_id` markers from live TickTick/Dexie (by title when stale). Does **not** delete TickTick tasks. Notice may say `rebound N`.

**Skip** = leave plan unapplied this run; checkpoint unchanged.

**Cancel** = dismiss Confirm Deletion; nothing deleted.

## Checklist

- [x] Modal / notice / Settings glossary copy
- [ ] Owner 30s check comment on #217
