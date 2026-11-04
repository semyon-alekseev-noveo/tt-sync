# 43 — Conflict resolution: TT-only same-title dedupe (DoR)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 43 (analyst DoR / conflict catalog extension) |
| Cases | `UX-SYNC-TT-DEDUPE`, `UX-SYNC-TT-DEDUPE-NO-KEEPER`, `ARCH-SYNC-CONFLICT-CATALOG` |
| Status | **docs / DoR** — code **blocked** until analyst sign-off + owner merge of this doc |
| Related | debate [`37`](./37-sync-intent-identity-debate.md), plan [`38`](./38-sync-intent-identity-plan.md), Confirm gap [`40`](./40-confirm-rebind-gap.md), InsertLine dups [`41`](./41-confirm-rebind-dup-fail.md), open-note Confirm [`42`](./42-opennote-delete-confirm.md), epic [#255](https://github.com/semyon-alekseev-noveo/tt-sync/issues/255) (closed), issue [#276](https://github.com/semyon-alekseev-noveo/tt-sync/issues/276), glossary `settingsUxCopy.ts` |
| Owner clarif. | 2026-11-04: duplicates live **only in TickTick**; vault has **no** lines for those orphan ids; Synchronize does **not** propose Create/Add |

## Meta / trigger

After ARCH-SYNC (#255), Sync discrepancies offers Don’t delete / Rebind / Apply once. **Rebind** rewrites vault markers; it does **not** collapse same-title TickTick orphans under a parent. Owner rejects manual TT delete as operational trash.

Primary fixture (owner): PKM journaling churn left **multiple live TT tasks** with the same title (e.g. «Подумать над механикой») under one parent/list. Those extra ids are **not** in the vault. Sync does **not** offer to Add/Insert them. They are invisible to Rebind (nothing to bind) and must not be treated as vault→TT Confirm `PushDeleteTT` (that path is for markers removed from notes).

Proposed product action inside the **conflict-resolution** model: **Delete unlinked TT duplicates** (EN) / **Удалить несвязанные дубликаты в TickTick** (RU).

## Conflict class catalog → allowed actions

Extends #37/#38 intents with one new **authorized** destructive class. Residual Sync discrepancies UI remains the only place that may delete TickTick.

| Conflict class | Typical signal | Allowed actions | Forbidden |
|----------------|----------------|-----------------|-----------|
| Marker/id mismatch (stale or unmarked vault line) | vault line vs live TT | Don’t delete; **Rebind** = Link (+ InsertLine when no candidate); Apply once = `PushDeleteTT` only after explicit authorize | silent wipe; open-note 5s Confirm (`BUG-OPENNOTE-DELETE-CONFIRM`) |
| Remote-gone | TT/Dexie deleted, vault still marked | **DetachMarker** (text kept); drain hold | Confirm wipe of gone id; invent TT from vault |
| User removed vault line (proven) | marker absent after identity pass | Don’t delete; Rebind when rematchable; **Apply once** = `PushDeleteTT` | auto wipe under threshold without Confirm; editor Delete Confirm |
| Check orphan (no vault id match) | Check sync cache | Leave TickTick alone; Add may duplicate; Delete in TickTick (per-row orphan modal) | treat as day-to-day Synchronize; wipe via Apply once without orphan UI |
| **TT-only unlinked same-title siblings** (this phase) | ≥2 **live** TT tasks, same **normalized title**, same **parent/list**; ≥1 id **not** present in any vault marker; Synchronize does **not** propose Add/InsertLine for those extras | Don’t delete (leave TT as-is); **Deduplicate unlinked TT** (new — deletes non-keeper TT ids only, after confirm); never Rebind-only (nothing to bind for orphan ids) | **Apply once** wipe of unrelated vault→TT plans; silent delete; Check orphan “Delete” as the only path; InsertLine/Add to “fix” dups; open-note Confirm |

**Not the same as:**

- `PushDeleteTT` Confirm after vault line delete (user-removed / held).
- Orphan modal bulk Delete (Check diagnostic; may delete tasks with no same-title vault keeper).
- `BUG-CONFIRM-REBIND-DUP` / InsertLine twins **in the vault** (vault-side cleanup stays manual or Rebind Link-displace — out of scope here).

## New intent (proposed)

| EN | RU | Role |
|----|----|------|
| DeduplicateUnlinkedTT | удалить несвязанные TT-дубликаты | Authorized delete of **non-keeper** live TT ids in a same-title+parent cluster |

**Precedence (extended):** Link ≻ DetachMarker ≻ InsertLine ≻ PullStripVault ≻ **DeduplicateUnlinkedTT** ≻ PushDeleteTT.

- Deduplicate is **destructive** → counts toward mass-delete threshold if batched with other deletes; prefer a **dedicated confirm** listing ids/titles (not silent fold into Apply once).
- Deduplicate **never** auto-runs in identity pass. Identity pass may *detect* clusters and surface them; apply only after Sync discrepancies authorize.
- Deduplicate ≠ Apply once: Apply once executes the held/Confirm `PushDeleteTT` / `PullStripVault` plan; Deduplicate executes only the dedupe candidate set.

## When Deduplicate is offered

All of the following:

1. **Surface:** manual **Synchronize** Sync discrepancies (held and/or a dedicated residual panel) and/or **Check sync cache** residual that uses the **same enumerator** — **not** the open-note 5s path, **not** editor Delete/Backspace.
2. **Cluster:** two or more **live** (status open / not soft-deleted) TickTick tasks in **synced lists**, sharing:
   - same **normalized title** (reuse rebind title normalize: trim, collapse whitespace, strip checkbox/marker noise — same helper as `normalizeRebindTitle` unless tests prove a safer shared normalizer);
   - same **parent key**: `parentId` if both have the same non-empty parent; else same project/list id when both are roots (`parentId` empty). Mixed parent vs root → **not** one cluster.
3. **Unlinked extras:** at least one task id in the cluster is **absent** from vault markers (`presentIds` / line `ticktick_id` scan) **and** is not the chosen keeper.
4. **Vault does not propose Add** for those extras (owner fixture): detection must not invent InsertLine/Add to “heal” TT-only dups.

### Keeper rules (fail-closed)

| Situation | Keeper | Deduplicate offered? | Deletes |
|-----------|--------|----------------------|---------|
| Exactly one vault marker id belongs to the cluster (same title+parent) | that vault-linked id | **Yes** (after confirm) | all other **live** cluster members **not** in vault markers |
| Vault has a same-title line but its marker id is **outside** this parent cluster | none for this cluster | **No** auto | — |
| Two+ vault lines / markers with same title bound to **different** ids in the cluster | ambiguous | **No** — fail-closed; report only | never pick |
| Vault has **no** marker for this title (TT-only cluster) | none | **No silent delete.** Offer **explicit list** of all live candidates; owner must **pick exactly one keeper** (or Cancel). If UI cannot require an explicit keeper pick in v1 → **do not offer** Deduplicate for that cluster (fail-closed). | only non-keeper ids after explicit pick |
| Cluster size 1 | n/a | No | — |
| Id is Notebook / `kind: NOTE` / protected | n/a | Never include (`BUG-NOTEBOOK-NO-DELETE` / `ID-NOTEBOOK-RESTORE-SAFE`) | — |
| Empty Dexie / checkPoint 0 / incomplete vault index | n/a | Fail-closed — do not offer | — |
| Completed / abandoned / recurrence instance | n/a | Skip (same spirit as `UX-ORPHAN-SKIP-DONE`) | — |

**Invariants:**

- Never delete a vault-linked id.
- Never silent delete.
- Never treat TT-only unlinked siblings as vault Confirm `PushDeleteTT` “tasks were removed from the file”.
- Never use Deduplicate to wipe a whole list or held vault→TT plan.

## Confirm UI copy (draft — glossary + modal)

| EN | RU (gloss) |
|----|------------|
| Sync discrepancies | окно расхождений |
| Delete unlinked TT duplicates | Удалить несвязанные дубликаты в TickTick |
| Keep vault-linked task; delete other same-title TickTick copies under the same parent. | Оставить задачу, привязанную в vault; удалить другие копии с тем же названием в TickTick под тем же родителем. |
| No vault link for this title — pick which TickTick task to keep, or Cancel. | Нет привязки в vault для этого названия — укажите, какую задачу TickTick оставить, или Отмена. |
| Don’t delete | Не удалять |
| This is not Apply once (vault→TT wipe). | Это не «Apply once» (wipe vault→TT). |

Glossary row addition (when code lands): fourth chip/row must stay ≤ owner 30s rule — prefer extending the Sync discrepancies row text rather than a fifth jargon term. Suggested:

> Sync discrepancies → Don’t delete / Rebind / **Deduplicate unlinked TT** / Apply once — Deduplicate = delete TT-only same-title extras under one parent; keep vault-linked id; never silent.

## Safety

- Confirm required; list title, parent/list, keeper id, delete ids (truncate with count).
- Fail-closed on ambiguity, empty Dexie, incomplete index, Notebook.
- Not on open-note identifiedOnly / 5s path; not on editor keyup.
- Only Synchronize / Check Sync discrepancies surfaces sharing the intent enumerator.
- Deduplicate deletes go through the same TT delete API as authorized deletes, but **candidate set ≠** held `PushDeleteTT` plan unless the owner also chose Apply once (separate buttons).
- After success: refresh Dexie; do not advance destructive checkpoint for skipped Don’t delete; journal/trace should record dedupe authorize distinctly if write-trace exists.

## Acceptance (engineering — after DoR green)

1. AF cases below have **failing then green** unit tests named by case id.
2. Detection finds TT-only same-title+parent clusters; does not InsertLine/Add.
3. With vault keeper → confirm → non-keeper TT ids deleted; keeper + vault marker unchanged.
4. No vault keeper → no delete without explicit keeper pick (or action hidden).
5. Two vault markers different ids same title → no offer / no delete.
6. Notebook ids never in delete set.
7. Open-note Delete does not trigger Deduplicate or Confirm wipe.
8. Glossary / modal copy match this doc.
9. `TEST_PLAN.md` updated in the **same** code PR; pilot status stays **not run** until prove ×2.

## Pilot prove ×2 plan (after code merge — not this docs PR)

Prefer two independent fixtures on `<pilot-vault>` (`bug-prove-twice.mdc`):

| Prove | Fixture idea | Steps | Expected |
|-------|--------------|-------|----------|
| 1 | Title A with vault marker id K + two TT orphans same title+parent | Synchronize → Sync discrepancies shows Deduplicate → confirm | Orphans gone in TT; K alive; vault line still K; no Add |
| 2 | Different title B (or second parent/list); same shape | Same | Same class of outcome; evidence in this folder |

Do **not** mark live **pass** after a single run. Unit green ≠ second live proof.

Dry-run scenarios for analyst testing (no invented live pass):

| # | Scenario | Expected outcome (dry-run) |
|---|----------|----------------------------|
| S1 | TT ids T1,T2,T3 same title+parent; vault marker = T1 only | Offer Deduplicate; keeper T1; delete T2,T3 after confirm |
| S2 | TT T1,T2 same title+parent; **no** vault marker for title | Fail-closed or explicit pick-keeper list; default = no delete |
| S3 | Vault lines mark T1 and T2 (same title, different ids) | No Deduplicate offer |
| S4 | T2 is Notebook NOTE | T2 excluded; if only one deletable left and keeper exists, offer only for deletable non-keepers |
| S5 | Empty Dexie | No offer |
| S6 | Same title, **different** parents | Two clusters or none; never cross-parent delete |
| S7 | Editor Delete marked line | No Deduplicate; no PushDeleteTT Confirm (`BUG-OPENNOTE-DELETE-CONFIRM`) |
| S8 | Held Apply once plan for unrelated vault-absent markers | Deduplicate button does not equal Apply once; plans stay separate |
| S9 | Check sync cache | Same detection rules if enumerator shared; still confirm; Leave alone remains safe default for classic orphans |
| S10 | Completed TT duplicate | Skipped from cluster |

## Analyst self-review (adversarial)

Reviewer: single thorough pass (Analyst A catalog + B safety), 2026-11-04. Scenarios above = **dry-run expected outcomes only** — live **not run**.

| Check | Result |
|-------|--------|
| Owner fixture is TT-only (no vault lines / no Add proposal) | **Incorporated** — class ≠ Rebind, ≠ InsertLine, ≠ vault Confirm PushDeleteTT |
| Keeper when vault has one linked id | **Defined** — keep vault id; delete other live same-title+parent |
| No vault keeper | **Defined** — fail-closed or explicit keeper pick; v1 may hide action |
| Two vault ids same title | **Fail-closed** — no offer |
| Notebook / empty Dexie / completed | **Excluded** |
| Not open-note 5s / editor Delete | **Stated** |
| Distinct from Apply once / orphan Delete | **Stated** |
| Gloss RU/EN | **Drafted** |
| AF + TEST_PLAN stub + INDEX | **This PR** |
| Ambiguities left for owner/analyst sign-off before code | See DoR gate below |

### DoR gate (must be green before code)

- [x] Conflict class mapped in this phase doc
- [x] Keeper / fail-closed rules written
- [x] Safety surfaces written
- [x] AF case IDs filed
- [x] TEST_PLAN stubs (pilot **not run**)
- [x] INDEX updated
- [ ] **Analyst / owner sign-off** on: (1) parent key = `parentId` else list id; (2) v1 behavior when no vault keeper = **hide Deduplicate** vs **pick-keeper UI**; (3) button placement = fourth Sync discrepancies action vs sub-confirm after Don’t delete/Rebind/Apply
- [ ] GitHub issue DoR checklist ticked after doc merge
- [ ] Code only after sign-off — **DEV_FLOW:** case → failing test → fix

**Verdict this turn:** DoR is **complete enough to review**, but **not unambiguously green for code** (open choices 1–3). **Docs-only PR**; stop before implementation.

## Checklist

- [x] Phase doc written with owner TT-only clarification
- [x] AF cases added
- [x] INDEX row
- [x] TEST_PLAN stubs (**not run**)
- [x] Analyst adversarial table (dry-run)
- [ ] Owner/analyst sign-off on open DoR items
- [ ] Code + prove ×2 (later PR)

## References

- `37-sync-intent-identity-debate.md`, `38-sync-intent-identity-plan.md`
- `40-confirm-rebind-gap.md`, `41-confirm-rebind-dup-fail.md`, `42-opennote-delete-confirm.md`
- `ABYSS_FIRST_CASES.md` → `UX-SYNC-TT-DEDUPE*`, `ARCH-SYNC-CONFLICT-CATALOG`
- `UX-SYNC-ONE-FLOW`, `ARCH-SYNC-INTENT-IDENTITY`, `BUG-NOTEBOOK-NO-DELETE`
- `src/ui/settings/settingsUxCopy.ts`
- `DEV_FLOW.md`, `AGENTS.md`, `.cursor/rules/bug-prove-twice.mdc`
