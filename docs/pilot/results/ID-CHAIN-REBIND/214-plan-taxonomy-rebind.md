# 214 — Identity chain plan (taxonomy + rebind)

| Field | Value |
|-------|--------|
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| When | 2026-10-29 |
| Status | **plan / DoR** |
| Inputs | `UX-OBS-TT-SOAK/34`, `35`; #208; dual-analyst briefs |

## Meta

Owner «гоу»: land DoR after analysts mapped **vault ↔ Dexie ↔ TickTick** tt-id failures and a phased fix plan. **No product code in this file.**

## Chain map (short)

| Hop | Id store | Role |
|-----|----------|------|
| Vault line | `%%[ticktick_id:: <24hex>]%%` | Primary child/task identity for sync + deletion guard scan |
| Vault FM | `ticktick_id:` YAML | Project **parent** only; **not** in guard `presentIds` |
| Dexie `tasks` | `taskId`, `file`, `deleted` | Hub between API and vault writes |
| Checkpoint | `checkPoint` / `lastDeltaSync` | TT delta cursor (held on Skip/Rematch) |
| TickTick | API task ids | After backup restore → **new** ids |

Truth: **obs→tt** = vault line (in push scope); **tt→obs** = TT (+ Dexie tombstone → strip/detach).

## Failure taxonomy (blunt)

| Case | Break | Risk | Current repair? |
|------|-------|------|-----------------|
| EMPTY-TT-WIPE | Mass `tt→obs` line delete empties AZ | **High** | Fail-closed unit; live prove open; **past wipe not undone** |
| TT-RESTORE-NEW-IDS | Dexie new; vault empty/old markers | **High** if Apply | Rematch = **insert from held plan only** |
| DEXIE-RESET | Cache cleared; vault unchanged | High if Apply | Skip/hold; partial rematch |
| VAULT-OLD-MARKERS-TT-GONE | Archive stale ids | Medium (strip vault) | Confirm Deletion — **wrong for history** |
| TEXT-NO-MARKER | Checkbox without marker | High if Apply | Partial rematch if in plan |
| MISSING-FROM-TT-BACKUP | Never came back | **Irrecoverable** | Detach + honest UX only |

Full analyst tables: session briefs → condensed here for gate archive.

## Owner intent vs shipped Rematch (#208)

| | Shipped | Intended |
|--|---------|----------|
| Trigger | Held modal **Rematch** when plan is all vault→TT | Post wipe/restore **Rebind** |
| Action | Insert AZ lines from Dexie into planned files | Vault-wide **marker rewrite** + match + insert-if-missing |
| Archive / stale | Untouched → later Confirm strip | Detach / never strip history |
| TT deletes | Never on Rematch | Never on Rebind |

## Target model

**Dexie-anchored rebind**

1. Scan vault markers (scope-aware).
2. For each live Dexie task: match line (same file + title → lineHash → single vault-wide title) → **rewrite id in place**; else insert at Active Zone.
3. Stale id (∉ live Dexie / TT 404): **detach** keep text — never `deleteTaskFromFile` in rebind flows.
4. Out-of-scope / archive / detached: read-only for strip/orphan.
5. Rebind never `deleteTask` on TickTick for vault-absent.

Rejected: title-only auto-merge; hash-only; more Rematch buttons without identity model; Apply mass deletes; invent TT tasks not in backup.

## Phases

| Phase | Issue | Goal |
|-------|-------|------|
| P0 | [#215](https://github.com/semyon-alekseev-noveo/tt-sync/issues/215) | Safety: empty-TT no AZ strip (live ×2); archive/stale never Confirm-wipe |
| P1 | [#216](https://github.com/semyon-alekseev-noveo/tt-sync/issues/216) | Vault-wide rebind after restore |
| P2 | [#217](https://github.com/semyon-alekseev-noveo/tt-sync/issues/217) | UX: Rebind naming, glossary, no Apply nudge |
| P3 | [#218](https://github.com/semyon-alekseev-noveo/tt-sync/issues/218) | Optional DeletionPolicy refactor if paths still diverge |

**Patch vs refactor:** P0 incremental; P1 new rebind module + hooks; P3 when planning + reconcile + phase-2 still disagree.

## Case IDs (analyst before code)

Canonical: `ABYSS_FIRST_CASES.md`. Manual: `TEST_PLAN.md` § ID-CHAIN.

| ID | Phase | Expected (summary) |
|----|-------|---------------------|
| `BUG-208-EMPTY-TT-NO-AZ-STRIP` | P0 | Wipe-shaped TT delta does not empty AZ; live ×2 |
| `ID-ARCHIVE-NO-STRIP` | P0 | Stale/archive marker ∉ TT → detach or no-op; checklist text remains |
| `ID-REBIND-RESTORE` | P1 | After restore new ids: markers rewritten (or inserted once); no TT deletes |
| `ID-REBIND-DEDUP` | P1 | No duplicate checkbox for same task after rebind |
| `ID-REBIND-UX` | P2 | UI says Rebind / keep TT; no Apply nudge on restore-shaped holds |
| `BUG-208-REMATCH` | legacy | Held-plan **insert** only — keep until P1 supersedes wording |

## Conclusion

DoR ready for P0 (#215). Do not close #208 on insert-only Rematch. Do not mark live pass without evidence under this gate or linked logs.

## Checklist

- [x] Epic #214 + children #215–#218
- [x] Gate INDEX + this plan
- [x] AF + TEST_PLAN stubs
- [ ] P0 implementation PR
- [ ] P1 rebind PR
