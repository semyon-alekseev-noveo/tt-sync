# 43 — Conflict resolution: TT-only same-title dedupe (DoR)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 43 (analyst DoR / conflict catalog extension) |
| Cases | `UX-SYNC-TT-DEDUPE`, `UX-SYNC-TT-DEDUPE-NO-KEEPER`, `ARCH-SYNC-CONFLICT-CATALOG` |
| Status | **DoR green (analyst locked)** — choices **1A / 2A / 3A**; code still **blocked** until failing tests → fix PR (DEV_FLOW); docs follow-up after [#277](https://github.com/semyon-alekseev-noveo/tt-sync/pull/277) |
| Related | debate [`37`](./37-sync-intent-identity-debate.md), plan [`38`](./38-sync-intent-identity-plan.md), Confirm gap [`40`](./40-confirm-rebind-gap.md), InsertLine dups [`41`](./41-confirm-rebind-dup-fail.md), open-note Confirm [`42`](./42-opennote-delete-confirm.md), epic [#255](https://github.com/semyon-alekseev-noveo/tt-sync/issues/255) (closed), issue [#276](https://github.com/semyon-alekseev-noveo/tt-sync/issues/276), glossary `settingsUxCopy.ts` |
| Owner clarif. | 2026-11-04: duplicates live **only in TickTick**; vault has **no** lines for those orphan ids; Synchronize does **not** propose Create/Add |
| Analyst lock | 2026-11-04 08:59 UTC — **1A** parent key; **2A** hide Deduplicate when no vault keeper; **3A** fourth Sync discrepancies peer action |

## Meta / trigger

After ARCH-SYNC (#255), Sync discrepancies offers Don’t delete / Rebind / Apply once. **Rebind** rewrites vault markers; it does **not** collapse same-title TickTick orphans under a parent. Owner rejects manual TT delete as operational trash.

Primary fixture (owner): PKM journaling churn left **multiple live TT tasks** with the same title (e.g. «Подумать над механикой») under one parent/list. Those extra ids are **not** in the vault. Sync does **not** offer to Add/Insert them. They are invisible to Rebind (nothing to bind) and must not be treated as vault→TT Confirm `PushDeleteTT` (that path is for markers removed from notes).

**Product scope for v1 Deduplicate:** clusters where the vault already links **exactly one** id in the title+parent group (keeper). TT-only extras under that keeper are deleted after confirm. Clusters with **no** vault marker for the title are **out of Deduplicate v1** (fail-closed hide) — Check orphan Delete remains the rare per-row escape; no Add/create offer for TT-only orphans.

Proposed product action inside the **conflict-resolution** model: **Delete unlinked TT duplicates** (EN) / **Удалить несвязанные дубликаты в TickTick** (RU).

## Conflict class catalog → allowed actions

Extends #37/#38 intents with one new **authorized** destructive class. Residual Sync discrepancies UI remains the only Synchronize place that may delete TickTick (plus Check’s same enumerator).

| Conflict class | Typical signal | Allowed actions | Forbidden |
|----------------|----------------|-----------------|-----------|
| Marker/id mismatch (stale or unmarked vault line) | vault line vs live TT | Don’t delete; **Rebind** = Link (+ InsertLine when no candidate); Apply once = `PushDeleteTT` only after explicit authorize | silent wipe; open-note 5s Confirm (`BUG-OPENNOTE-DELETE-CONFIRM`) |
| Remote-gone | TT/Dexie deleted, vault still marked | **DetachMarker** (text kept); drain hold | Confirm wipe of gone id; invent TT from vault |
| User removed vault line (proven) | marker absent after identity pass | Don’t delete; Rebind when rematchable; **Apply once** = `PushDeleteTT` | auto wipe under threshold without Confirm; editor Delete Confirm |
| Check orphan (no vault id match) | Check sync cache | Leave TickTick alone; Add may duplicate; Delete in TickTick (per-row orphan modal) | treat as day-to-day Synchronize; wipe via Apply once without orphan UI |
| **TT-only unlinked same-title siblings** (this phase) | ≥2 **live** TT tasks, same **normalized title**, same **parent key (1A)**; ≥1 id **not** present in any vault marker; Synchronize does **not** propose Add/InsertLine for those extras | Don’t delete (leave TT as-is); **Deduplicate unlinked TT** (**3A** — fourth Sync discrepancies peer) when **exactly one** vault-linked keeper exists; never Rebind-only for orphan ids | **Apply once** wipe of unrelated vault→TT plans; silent delete; Check orphan “Delete” as the only Synchronize path; InsertLine/Add to “fix” dups; open-note Confirm; Deduplicate when **no** vault keeper (**2A** hide) |

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

## Locked DoR decisions (analyst)

| # | Choice | Locked | Rejected alternative |
|---|--------|--------|----------------------|
| **1** | Cluster **parent key** | **1A** — same non-empty `parentId`; else same project/list id when **both** are roots (`parentId` empty). Mixed parent vs root → **not** one cluster. | Title-only; list-only ignoring parent; treating empty parent as matching a concrete parent |
| **2** | No vault keeper (v1) | **2A** — **hide** Deduplicate for that cluster (fail-closed). No silent delete. Pick-keeper UI **deferred** (v2). | Ship pick-keeper in v1 |
| **3** | Button placement | **3A** — **fourth peer** on Sync discrepancies: Don’t delete / Rebind / **Deduplicate unlinked TT** / Apply once. Dedicated confirm listing keeper + delete ids. Show only when ≥1 eligible **1A** cluster with vault keeper exists. | Nest Deduplicate under Apply once / after the three-button confirm |

### Analyst decision log

| Field | Value |
|-------|--------|
| Date (UTC) | **2026-11-04 08:59 UTC** |
| Role | Analyst (owner deferred picks: «давай на это ответит аналитик») |
| Locked | **1A**, **2A**, **3A** |
| Issue | [#276](https://github.com/semyon-alekseev-noveo/tt-sync/issues/276) |
| Prior docs PR | [#277](https://github.com/semyon-alekseev-noveo/tt-sync/pull/277) (merged; open choices) |

**Why 1A (parent key):** Clear, stable clustering that mirrors TickTick hierarchy and the owner fixture (same-title siblings under one parent). Fail-closed: mixed parent/root never clusters, so Deduplicate cannot cross-parent wipe. Title-only would delete across unrelated parents/lists; list-only would collapse different parents under one list. Same non-empty `parentId`, else same list id for roots only — one deterministic key, no heuristics.

**Why 2A (hide when no keeper):** Deduplicate’s stable logic is “vault names the keeper.” Without a vault marker, picking a keeper is guesswork and a new UI dialect; fail-closed hide keeps UX-SYNC-ONE-FLOW simple and matches empty-Dexie / ambiguity spirit from #37/#38. Primary AF case (`UX-SYNC-TT-DEDUPE`) already has exactly one vault-linked id; TT-only orphans under that keeper are the cleanup. Pure no-vault title clusters stay on Check orphan Leave/Delete — never Add/create, never silent Synchronize wipe. Pick-keeper remains a documented v2 option if pilot proves hide insufficient.

**Why 3A (fourth peer action):** Deduplicate must stay visibly ≠ Apply once (different candidate set; never fold into vault→TT wipe). UX-SYNC-ONE-FLOW already centers one Sync discrepancies surface; a fourth peer chip matches the drafted glossary row and discoverability without a nested “wipe-ish” confirm. Show only when eligible clusters exist so the row does not advertise a no-op. Dedicated confirm still lists title, parent key, keeper id, delete ids.

## When Deduplicate is offered

All of the following:

1. **Surface (**3A**):** manual **Synchronize** Sync discrepancies (held and/or Confirm residual) and/or **Check sync cache** residual that uses the **same enumerator** — **not** the open-note 5s path, **not** editor Delete/Backspace. Button = fourth peer: Don’t delete / Rebind / **Deduplicate unlinked TT** / Apply once.
2. **Cluster (**1A**):** two or more **live** (status open / not soft-deleted) TickTick tasks in **synced lists**, sharing:
   - same **normalized title** (reuse rebind title normalize: trim, collapse whitespace, strip checkbox/marker noise — same helper as `normalizeRebindTitle` unless tests prove a safer shared normalizer);
   - same **parent key**: `parentId` if both have the same non-empty parent; else same project/list id when both are roots (`parentId` empty). Mixed parent vs root → **not** one cluster.
3. **Unlinked extras:** at least one task id in the cluster is **absent** from vault markers (`presentIds` / line `ticktick_id` scan) **and** is not the chosen keeper.
4. **Vault does not propose Add** for those extras (owner fixture): detection must not invent InsertLine/Add to “heal” TT-only dups.
5. **Vault keeper present (**2A**):** exactly one vault marker id in the cluster — otherwise **hide** Deduplicate for that cluster.

### Keeper rules (fail-closed) — locked

| Situation | Keeper | Deduplicate offered? | Deletes |
|-----------|--------|----------------------|---------|
| Exactly one vault marker id belongs to the cluster (same title+**1A** parent key) | that vault-linked id | **Yes** (**3A** button + confirm) | all other **live** cluster members **not** in vault markers |
| Vault has a same-title line but its marker id is **outside** this parent cluster | none for this cluster | **No** | — |
| Two+ vault lines / markers with same title bound to **different** ids in the cluster | ambiguous | **No** — fail-closed; report only | never pick |
| Vault has **no** marker for this title (TT-only cluster) | none | **No (**2A**)** — hide Deduplicate; no silent delete; pick-keeper **not** in v1 | — |
| Cluster size 1 | n/a | No | — |
| Id is Notebook / `kind: NOTE` / protected | n/a | Never include (`BUG-NOTEBOOK-NO-DELETE` / `ID-NOTEBOOK-RESTORE-SAFE`) | — |
| Empty Dexie / checkPoint 0 / incomplete vault index | n/a | Fail-closed — do not offer | — |
| Completed / abandoned / recurrence instance | n/a | Skip (same spirit as `UX-ORPHAN-SKIP-DONE`) | — |

**Invariants:**

- Never delete a vault-linked id.
- Never silent delete.
- Never treat TT-only unlinked siblings as vault Confirm `PushDeleteTT` “tasks were removed from the file”.
- Never use Deduplicate to wipe a whole list or held vault→TT plan.
- Never offer Add/InsertLine to “fix” TT-only duplicates.
- Never show Deduplicate for a no-keeper cluster in v1 (**2A**).

## Confirm UI copy (draft — glossary + modal)

| EN | RU (gloss) |
|----|------------|
| Sync discrepancies | окно расхождений |
| Delete unlinked TT duplicates | Удалить несвязанные дубликаты в TickTick |
| Keep vault-linked task; delete other same-title TickTick copies under the same parent. | Оставить задачу, привязанную в vault; удалить другие копии с тем же названием в TickTick под тем же родителем. |
| No vault link for this title — Deduplicate not offered (v1). | Нет привязки в vault для этого названия — «Deduplicate» в v1 не предлагается. |
| Don’t delete | Не удалять |
| This is not Apply once (vault→TT wipe). | Это не «Apply once» (wipe vault→TT). |

Glossary row addition (when code lands): fourth chip/row must stay ≤ owner 30s rule — prefer extending the Sync discrepancies row text rather than a fifth jargon term. Locked (**3A**):

> Sync discrepancies → Don’t delete / Rebind / **Deduplicate unlinked TT** / Apply once — Deduplicate = delete TT-only same-title extras under one parent key; keep vault-linked id; hide when no vault keeper; never silent.

## Safety

- Confirm required; list title, parent/list, keeper id, delete ids (truncate with count).
- Fail-closed on ambiguity, empty Dexie, incomplete index, Notebook, **no vault keeper (**2A**)**.
- Not on open-note identifiedOnly / 5s path; not on editor keyup.
- Only Synchronize / Check Sync discrepancies surfaces sharing the intent enumerator.
- Deduplicate deletes go through the same TT delete API as authorized deletes, but **candidate set ≠** held `PushDeleteTT` plan unless the owner also chose Apply once (separate buttons — **3A**).
- After success: refresh Dexie; do not advance destructive checkpoint for skipped Don’t delete; journal/trace should record dedupe authorize distinctly if write-trace exists.

## Acceptance (engineering — after DoR green)

1. AF cases below have **failing then green** unit tests named by case id.
2. Detection finds TT-only same-title+**1A** parent clusters; does not InsertLine/Add.
3. With vault keeper → **3A** Deduplicate → confirm → non-keeper TT ids deleted; keeper + vault marker unchanged.
4. No vault keeper → Deduplicate **hidden** (**2A**); no delete.
5. Two vault markers different ids same title → no offer / no delete.
6. Notebook ids never in delete set.
7. Open-note Delete does not trigger Deduplicate or Confirm wipe.
8. Glossary / modal copy match this doc (including locked 1A/2A/3A).
9. `TEST_PLAN.md` updated in the **same** code PR; pilot status stays **not run** until prove ×2.

## Pilot prove ×2 plan (after code merge — not this docs PR)

Prefer two independent fixtures on `<pilot-vault>` (`bug-prove-twice.mdc`):

| Prove | Fixture idea | Steps | Expected |
|-------|--------------|-------|----------|
| 1 | Title A with vault marker id K + two TT orphans same title+**1A** parent | Synchronize → Sync discrepancies shows Deduplicate (**3A**) → confirm | Orphans gone in TT; K alive; vault line still K; no Add |
| 2 | Different title B (or second parent/list); same shape | Same | Same class of outcome; evidence in this folder |

Also dry-run / unit: no-keeper cluster → Deduplicate **absent** (**2A**).

Do **not** mark live **pass** after a single run. Unit green ≠ second live proof.

Dry-run scenarios for analyst testing (no invented live pass):

| # | Scenario | Expected outcome (dry-run) |
|---|----------|----------------------------|
| S1 | TT ids T1,T2,T3 same title+**1A** parent; vault marker = T1 only | Offer Deduplicate (**3A**); keeper T1; delete T2,T3 after confirm |
| S2 | TT T1,T2 same title+parent; **no** vault marker for title | Deduplicate **hidden** (**2A**); no delete |
| S3 | Vault lines mark T1 and T2 (same title, different ids) | No Deduplicate offer |
| S4 | T2 is Notebook NOTE | T2 excluded; if only one deletable left and keeper exists, offer only for deletable non-keepers |
| S5 | Empty Dexie | No offer |
| S6 | Same title, **different** parents | Two clusters or none; never cross-parent delete (**1A**) |
| S7 | Editor Delete marked line | No Deduplicate; no PushDeleteTT Confirm (`BUG-OPENNOTE-DELETE-CONFIRM`) |
| S8 | Held Apply once plan for unrelated vault-absent markers | Deduplicate button ≠ Apply once (**3A**); plans stay separate |
| S9 | Check sync cache | Same detection rules if enumerator shared; still confirm; Leave alone remains safe default for classic orphans |
| S10 | Completed TT duplicate | Skipped from cluster |

## Analyst self-review (adversarial)

Reviewer: single thorough pass (Analyst A catalog + B safety), 2026-11-04. Scenarios above = **dry-run expected outcomes only** — live **not run**. Follow-up lock pass same day (1A/2A/3A).

| Check | Result |
|-------|--------|
| Owner fixture is TT-only extras (no vault lines / no Add proposal) | **Incorporated** — class ≠ Rebind, ≠ InsertLine, ≠ vault Confirm PushDeleteTT |
| Keeper when vault has one linked id | **Defined** — keep vault id; delete other live same-title+**1A** parent |
| No vault keeper | **Locked 2A** — hide Deduplicate; pick-keeper deferred |
| Two vault ids same title | **Fail-closed** — no offer |
| Notebook / empty Dexie / completed | **Excluded** |
| Not open-note 5s / editor Delete | **Stated** |
| Distinct from Apply once / orphan Delete | **Locked 3A** — fourth peer + dedicated confirm |
| Parent key | **Locked 1A** |
| Gloss RU/EN | **Drafted** (no-keeper copy updated for hide) |
| AF + TEST_PLAN stub + INDEX | **Updated for lock** |
| Open DoR choices 1–3 | **Closed** — analyst decision log above |

### DoR gate (must be green before code)

- [x] Conflict class mapped in this phase doc
- [x] Keeper / fail-closed rules written
- [x] Safety surfaces written
- [x] AF case IDs filed
- [x] TEST_PLAN stubs (pilot **not run**)
- [x] INDEX updated
- [x] **Analyst sign-off** locked: **(1A)** parent key = `parentId` else list id for roots; **(2A)** no vault keeper → **hide Deduplicate** (v1); **(3A)** button = **fourth** Sync discrepancies peer action
- [ ] GitHub issue DoR checklist ticked (comment + boxes on [#276](https://github.com/semyon-alekseev-noveo/tt-sync/issues/276))
- [ ] Code only after this docs lock merges — **DEV_FLOW:** case → failing test → fix

**Verdict:** DoR choices **1A / 2A / 3A** are **locked**. Docs follow-up PR after #277. **Code still blocked** until failing tests land in a later PR. Live prove ×2 after code.

## Checklist

- [x] Phase doc written with owner TT-only clarification
- [x] AF cases added
- [x] INDEX row
- [x] TEST_PLAN stubs (**not run**)
- [x] Analyst adversarial table (dry-run)
- [x] Analyst lock **1A / 2A / 3A** + decision log
- [ ] GitHub #276 DoR boxes ticked after this PR push
- [ ] Code + prove ×2 (later PR)

## References

- `37-sync-intent-identity-debate.md`, `38-sync-intent-identity-plan.md`
- `40-confirm-rebind-gap.md`, `41-confirm-rebind-dup-fail.md`, `42-opennote-delete-confirm.md`
- `ABYSS_FIRST_CASES.md` → `UX-SYNC-TT-DEDUPE*`, `ARCH-SYNC-CONFLICT-CATALOG`
- `UX-SYNC-ONE-FLOW`, `ARCH-SYNC-INTENT-IDENTITY`, `BUG-NOTEBOOK-NO-DELETE`
- `src/ui/settings/settingsUxCopy.ts`
- `DEV_FLOW.md`, `AGENTS.md`, `.cursor/rules/bug-prove-twice.mdc`
- Issue [#276](https://github.com/semyon-alekseev-noveo/tt-sync/issues/276); docs [#277](https://github.com/semyon-alekseev-noveo/tt-sync/pull/277)
