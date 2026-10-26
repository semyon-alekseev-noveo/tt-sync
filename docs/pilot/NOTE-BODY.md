# NOTE-BODY — analyst brief (upstream task notes)

**Audience:** analysts / PO. **Not a code PR.** Catalog IDs in `ABYSS_FIRST_CASES.md` first (`DEV_FLOW.md`).

**Recorded:** 2026-10-25. **Trigger:** after 2.0.91 regression — GTD + Comments are covered; classic TickTickSync **note body** under a task is still unowned product scope.

---

## 1. Three different “text under a task” axes

Do **not** mix these in one case or one fix.

| Axis | Vault shape | TickTick surface | Status in fork |
|------|-------------|------------------|----------------|
| **A. Description** | Child `- > …` | Task **description / body** (`content` / `desc`) | Partially used; smoke NOTE-L1/L2 |
| **B. Abyss comments** | Child `- YYYY-MM-DD HH:MM: text` (or stamp) | **Comments** panel (API) | **NOTE-L3b** + BUG-COMMENT-* — live pass on 2.0.91 |
| **C. Upstream note block** | Indented block between optional `noteDelimiter` lines | Same task body field as A (upstream “Notes”) | **NOTE-BODY** — this brief; pilot **not run** as acceptance |

Upstream docs: `docs-src/configuration/notes.md` (`syncNotes`, delimiter). Setting exists in fork (`syncNotes` default true).

**GTD stage tags / lists** are a fourth axis — unrelated to note body.

---

## 2. Owner intent (proposed)

Users who come from **thesamim/TickTickSync** expect: write a note under a checkbox → it appears in TickTick as the task note/body; edit in TickTick → vault note updates. That path should work **without** Abyss comment stamps and **without** putting prose into Comments.

Abyss-first vaults may prefer B (Comments) for chatter and A (`- >`) for short description. Product must say which of A/C is canonical when both appear.

---

## 3. Cases (catalog)

| ID | Preconditions | Expected |
|----|---------------|----------|
| **NOTE-BODY-1** | Synced task; `syncNotes` on; in-scope note. Add upstream-style note under the line (delimiter optional per settings). Synchronize. | TT task `content` (or `desc`) contains the note text. Comments panel **unchanged** (no new Comments API rows for this text). Checkbox title unchanged. |
| **NOTE-BODY-2** | Same task. Edit the note text in TickTick (body). Synchronize / full pull. | Vault note block under the checkbox updates to match. Abyss comment bullets (if any) stay comments, not merged into the note block. |
| **NOTE-BODY-3** *(optional conflict)* | Vault has both `- >` description and a delimiter note block, or note + Abyss comments. Synchronize. | Documented merge rule (analyst pick before code): e.g. note block ↔ `content`, `- >` ↔ `desc`, comments ↔ Comments API — **no** silent drop of Comments when note sync runs. |

Map from smoke: NOTE-L1 ≈ BODY-1 (description-shaped); upstream delimiter form is the distinct BODY-1 shape to prove.

---

## 4. Non-goals

- Do not change Option A GTD exclusivity.
- Do not re-route Abyss comment bullets into task body (that regressed NOTE-L3 historically).
- Do not require Abyss View for NOTE-BODY (Tasks / plain markdown enough).
- Topology R / list files still out of scope.

---

## 5. Open questions for PO / analysts

1. **Canonical body:** delimiter note block (upstream), `- >` only, or both with a written merge rule?
2. **Default `syncNotes`:** keep on for Abyss-first pilots, or recommend off when Comments-only is desired?
3. **Priority vs Comments backlog:** schedule NOTE-BODY after DEL-1/3 modal regression, or before Step 8?

**Recommendation:** Keep Comments as the Abyss chatter path (B). Treat **NOTE-BODY** as compatibility with upstream / Tasks users: prove BODY-1/2 with delimiter form on pilot before any code change; if code already works, record **pass** and close; if not, open implement issue from failing BODY-1.

### Working answers (2026-10-26 — unblock discovery; owner may override)

| # | Decision |
|---|----------|
| 1 | **Both with axes:** upstream delimiter note ↔ `content` (no items) / `desc` (with checklist items); Abyss `- >` ↔ description when `abyssTasksFormat`; Abyss stamps ↔ Comments API when `syncAbyssCommentsViaApi`. No silent drop of Comments when note sync runs. |
| 2 | Keep **`syncNotes` default on**; Abyss-first Comments-only vaults may turn it off. |
| 3 | Discovery **now** (post-#66); DEL modal optional; not blocking Step 8. |

---

## 6. Hand-off

| Role | Next |
|------|------|
| Analyst | §5 working answers recorded (2026-10-26); owner may override |
| Tester | **Live** BODY-1 then BODY-2 on `<pilot-vault>` (prove×2 if bug found) |
| Developer | Unit path green (`noteBody.upstream.test.ts`); code only if live BODY-1 **fails** |

**References:** `docs-src/configuration/notes.md`, `SMOKE_TESTS.md` NOTE-L1–L5, `ABYSS_FIRST_CASES.md` NOTE-L3b, `REGRESSION-2.0.91/01-…`
