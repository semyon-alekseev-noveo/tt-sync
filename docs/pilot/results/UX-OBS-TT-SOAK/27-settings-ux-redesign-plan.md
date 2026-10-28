# 27 — Settings UX redesign plan (epic #189)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 27 (plan / DoR) |
| Epic | [#189](https://github.com/semyon-alekseev-noveo/tt-sync/issues/189) — TickTickSync Settings UX redesign (Abyss) |
| Phase 0 | [#190](https://github.com/semyon-alekseev-noveo/tt-sync/issues/190) — this file + glossary + case IDs |
| Status | **plan / DoR** — no Settings UI code in Phase 0 |
| Related | `24`–`26` (Reset / held / orphan); #187 BUG-RESET-CACHE-DELETE |

## Goal

Fewer delete traps, one clear Abyss settings path, classic surface secondary. **No sync-semantics change** in the same wave — copy, visibility, defaults, mini-help only unless a later phase widens scope.

## Phases (children)

| Phase | Issue | Focus | Priority |
|-------|-------|--------|----------|
| 0 | [#190](https://github.com/semyon-alekseev-noveo/tt-sync/issues/190) | Scaffold: deletion glossary + case IDs / DoR | docs first |
| 1 | [#191](https://github.com/semyon-alekseev-noveo/tt-sync/issues/191) | Traps + mini-help (**no logic change**) | P0 |
| 2 | [#192](https://github.com/semyon-alekseev-noveo/tt-sync/issues/192) | Hide redundancy in Abyss mode | P1 |
| 3 | [#193](https://github.com/semyon-alekseev-noveo/tt-sync/issues/193) | Names & defaults | P1–P2 |
| 4 | [#194](https://github.com/semyon-alekseev-noveo/tt-sync/issues/194) | Cold-start & polish | P2 |

Process: `DEV_FLOW.md` / `AGENTS.md` — analyst cases before Settings UI code. PR into `abyss-mapping` only. Pilot vault only.

## Canonical deletion glossary (30s)

Read this table once. Owner acceptance for Phase 0: can explain **Skip vs Cancel vs Manage Deleted** in ≤30s (comment on #190 or #189). Aligns with `24`–`26` and EMPTY-SIDE-GUARD.

| Term | Where it appears | What it does | What it is **not** |
|------|------------------|--------------|---------------------|
| **Reset** (Reset local sync database) | Settings → Danger / Tasks–Notes | Wipes **local** Dexie + checkpoint. Vault markdown and TickTick tasks stay. Next Synchronize re-pulls. | Not a TickTick wipe. Not “discard held deletions.” Not Manage Deleted. |
| **Held deletions** (mass-delete guard) | Modal **TickTickSync held deletions** after Synchronize | Guard held a vault→TT (or empty-side) delete plan over threshold / empty-side. Choices: **Skip deletions this run**, **Apply once**, **Open report**. Skip / close / timeout = no deletes, checkpoint unchanged. | Not Settings Manage Deleted. Not Reset. Not Confirm Deletion (orphan vault strip). |
| **Skip deletions this run** | Held-deletions modal | Safe default: no planned deletes applied; creates/updates still run; checkpoint held. | Not Cancel on Confirm Deletion. Not “purge soft-deleted rows.” |
| **Apply once** | Held-deletions modal | Applies the held plan **this run only** (real TickTick / Dexie deletes). | Never confuse with Manage Deleted. After Reset+restore false vault-absent: **do not Apply** (`26`). |
| **Confirm Deletion** / Cancel | Per-task / orphan vault-line modal (`TaskDeletionModal`) | Confirm strips vault line(s) or deletes TT task(s) per dialog reason. **Cancel** leaves lines/tasks alone. Post-Reset cache-miss orphan: **Cancel** only (`24` / BUG-RESET-CACHE-DELETE). | Not held-deletions Skip. Not Manage Deleted. |
| **Manage Deleted** (Tasks) | Settings maintenance | Permanent purge of **already soft-deleted** Dexie rows (housekeeping). | **≠ held**. Does not clear a held plan. Do not open it to “discard” a held-deletions modal (`26`). |
| **On TT deletion** (user deletes in TickTick) | Normal sync pull | Remote delete → vault reconcile per product rules (markers / lines). | Not Reset. Not Manage Deleted. Distinct from inventing deletes from vault-absent after Reset. |

### Quick map (≤30s)

1. **Reset** = clear local sync DB only.  
2. **Held** = Synchronize paused a big delete plan → **Skip** (safe) / **Apply once** (dangerous).  
3. **Confirm / Cancel** = one-off delete dialog for specific lines/tasks → **Cancel** if unsure (esp. post-Reset orphan).  
4. **Manage Deleted** = purge soft-deleted Dexie junk ≠ held modal.  
5. **Delete in TickTick** = remote truth; sync pulls it — not a Settings Danger action.

### Doc pointers Phase 1 will surface

- Held / Skip / Apply: `26-held-deletions-after-reset.md`, case `EMPTY-SIDE-GUARD`, `TEST_PLAN.md` TP-EMPTY-SIDE-GUARD / mass-delete rows.
- Confirm / Cancel orphan after Reset: `24-post-reset-delete-modal.md`, `25-reset-cache-delete-prove.md`, `BUG-RESET-CACHE-DELETE` / `UX-RESET-1`.
- Catalog: `ABYSS_FIRST_CASES.md` rows `UX-SET-*` and `DEL-1` / `DEL-3`.

## Case IDs (analyst before code)

Canonical expected behavior: `ABYSS_FIRST_CASES.md`. Manual steps: `TEST_PLAN.md` § UX-SET — Settings redesign. Pilot status stays **not run** until a Settings UI PR is installed and exercised.

### Phase 0 acceptance + Phase 1 (traps / mini-help) — #190 / #191

| ID | Expected (summary) |
|----|---------------------|
| `UX-SET-GLOSSARY` | Owner (or pilot) can state Skip vs Cancel vs Manage Deleted in ≤30s from this glossary; no plugin code required. |
| `UX-SET-SYNCTAG-EMPTY` | Empty SyncTag shows badge/tooltip that empty means **pull ALL** allow-listed lists (not “filter off / safe empty”). Label leans toward pull-filter wording. **Copy only.** |
| `UX-SET-MANAGE-DELETED` | Settings control renamed/clarified so it is obviously ≠ held / Apply once. **Copy only.** |
| `UX-SET-RESET-ONE` | Single Reset story in Danger zone (not multiple competing Reset affordances). **Layout/copy only.** |
| `UX-SET-SYNCED-LISTS-HELP` | Synced lists control has short in-UI help (allow-list / empty = nothing pulled). **Copy only.** |
| `UX-SET-MAINT-SYNC-PRIMARY` | Maintenance: **Synchronize** is the primary action (visually primary vs secondary housekeeping). **Layout only.** |

### Phase 2 (hide redundancy) — #192

| ID | Expected (summary) |
|----|---------------------|
| `UX-SET-HIDE-DEFAULTS` | When GTD/Abyss path active (`projectSchemeEnabled` + `abyssTasksFormat` + non-empty `syncScopeFolders`, same stack as UX-STUB-1), Defaults Tasks folder control is hidden or clearly non-primary. **Visibility only.** |
| `UX-SET-EXTRA-FILTERS` | Extra filters folded/hidden when redundant under Abyss mode. **Visibility only.** |
| `UX-SET-STATUS-VS-STAGE` | When `statusListMappings` is the active SoT, stage→list UI is inactive/hidden (no competing twin). **Visibility only**; mapping engine unchanged unless a later case says otherwise. |

### Phase 3 (names & defaults) — #193

| ID | Expected (summary) |
|----|---------------------|
| `UX-SET-SYNC-NOTES` | Sync Notes label distinguishable from Notebook / NOTE-BODY. |
| `UX-SET-NOTEBOOK-WARN` | Notebook ≠ Inbox warning visible where both appear. |
| `UX-SET-BKUP-DEFAULT` | Backup folder default sane for Abyss pilots (or warned). |
| `UX-SET-LEAN-WARN` | Lean project template surfaces a warn (soak P0), not a full MOC engine. |

### Phase 4 (cold-start & polish) — #194

| ID | Expected (summary) |
|----|---------------------|
| `UX-SET-COLD-START` | Cold-start strip: Synchronize + SyncTag/Abyss cues findable without hunting docs. |
| `UX-SET-DEVICE-PRUNE` | Device prune UX wording clear. |
| `UX-SET-INTERVAL-ZERO` | Sync interval = 0 → progress presentation grey / non-active as specified in implementing PR. |
| `UX-SET-PW-CONFIRM` | If password shown plaintext, confirm/warn present. |

## Out of scope (epic)

- SyncTag / status **engine** semantics; hard-reset **product** redesign beyond Danger copy/layout; lean MOC engine; #187 live prove gate (separate evidence under `25`).

## Checklist (Phase 0)

- [x] Glossary table (Reset ≠ Held ≠ Confirm/Orphan ≠ Manage Deleted ≠ On TT deletion)
- [x] Case IDs in `ABYSS_FIRST_CASES.md` + `TEST_PLAN.md` stubs (**not run**)
- [x] This plan + INDEX row; links #189–#194
- [ ] Owner 30s glossary check recorded on #190 / #189
- [x] Phase 0 DoR merged (#195)
- [x] Phase 1 Settings UI — see `28-settings-ux-phase1.md` / #191 (unit pass; pilot not run; PR #196)
- [x] Phase 2 hide/merge — see `29-settings-ux-phase2.md` / #192 (unit pass; pilot not run; PR #197)
- [ ] Phase 3 names/defaults — see `30-settings-ux-phase3.md` / #193 (unit pass; pilot not run)

## Conclusion

Phase 0 is **docs/DoR only**. Phase 1 must not start Settings UI until case IDs + glossary are merged or the owner explicitly accepts them in issue comments.
