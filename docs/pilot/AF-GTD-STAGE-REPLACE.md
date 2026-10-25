# AF-GTD stage move — analyst brief (owner intent)

**Audience:** analysts (+ PO). **Not a code PR.** Case IDs land in `ABYSS_FIRST_CASES.md` first (`DEV_FLOW.md`).

**Recorded:** 2026-10-25. **Owner cue:** in Abyss View tag tree, moving a task from one stage branch to another means **remove the old stage tag and set the new one** — not accumulate two `#type/*` tags.

---

## 1. User mental model (source of truth for intent)

```text
Abyss View → Tags tree → type/
   ├─ next      ← task currently here  (#type/next on the line)
   └─ waiting   ← user drags task here

Intent:  stage := waiting
Vault:   drop #type/next, keep #type/waiting   (exactly one mapped stage)
TickTick (gtdStageVia=list): list := waitingFor
```

Same for any mapped pair (`inbox` ↔ `type/next` ↔ `type/waiting` ↔ …).  
**Non-stage tags** (`#obsidian`, `#tts-test`, `#context/…`, note mirrors) stay; only **list-mapped stage tags** are exclusive.

This is **not** “add another label.” It is **move between exclusive GTD stages**, expressed as tags because Abyss exposes stages as a tag tree.

---

## 2. What Abyss actually does today

Observed (pilot / owner): tag-tree DnD often **adds** the destination tag and **leaves** the source tag on the markdown line → dual `#type/next #type/waiting` (order may be sorted by Abyss).

So there is a **gap**:

| Layer | Behavior |
|-------|----------|
| User intent | Replace stage (one branch → another) |
| Abyss write | Add tag (multi-tag line) |
| TTS before Option A | First/last mismatch; list often stuck; dual tags remain |
| TTS Option A (#137/#140/#144) | Infer destination (mover ≠ Dexie list), move TT list, rewrite vault to one stage |

Option A is a **sync compensation** for Abyss’s add semantics. It is not the same as Abyss doing a true replace.

---

## 3. Case split (catalog)

| ID | What it tests | Status |
|----|----------------|--------|
| **AF-GTD-TAG-ADD** | Abyss (or sim) **adds** a second stage tag without removing the first. Plugin still ends with **one** stage + correct list (Option A / mover-wins). | Implemented; tip prove×2 |
| **AF-GTD-STAGE-MOVE** *(new)* | **Owner intent case:** user moves task from stage branch A → B in Abyss tag tree. Expected outcome = replace. Preconditions may still see a dual-tag intermediate write from Abyss. | Spec only — this brief |

Do **not** delete AF-GTD-TAG-ADD: it remains the regression for the dual-tag intermediate that Abyss still emits.  
AF-GTD-STAGE-MOVE is the **acceptance story** analysts use with PO (“did we deliver move?”), not a second algorithm.

---

## 4. Options for analysts / PO (pick direction)

### Option A — keep sync exclusive rewrite *(shipped)*

- **Pros:** Works with current Abyss; no Abyss fork required; open-note path usable.
- **Cons:** Dual tags flash; inference (mover-wins) can surprise if user *intentionally* wants two stage tags (we treat mapped stages as exclusive); Notice must stay quiet for stages (#146).
- **When:** Default while Abyss cannot exclusive-replace.

### Option B — Abyss exclusive stage group *(ideal UX)*

- Ask Abyss (or config): tags under `type/` (or mapped set) are **mutually exclusive** — DnD to another branch **removes** siblings in that set.
- **Pros:** Line never has dual stages; TTS only sees one tag (AF-5 / AF-7 stay simple).
- **Cons:** Depends on Abyss product; TTS cannot ship this alone.
- **When:** Preferred long-term; track as external dependency.

### Option C — TTS “Set GTD stage” command / gesture

- Explicit replace in Obsidian (command / modal / hotkey): strip other mapped stages, set chosen tag, push.
- **Pros:** Clear intent; no Abyss dependency.
- **Cons:** Extra UI; Abyss tree DnD still wrong unless users abandon it.
- **When:** If PO wants TTS-owned stage UX.

### Option D — TickTick list as stage UI

- Change list in TT; AF-7 rewrites vault tag.
- **Pros:** Already works.
- **Cons:** Leaves Abyss tag-tree stage DnD broken as a primary habit.

### Option E — checkbox / status axis for GTD *(parked)*

- See `docs/pilot/AF-CHECKBOX-STATUS-GTD.md`. Not active while tag-tree remains the owner’s stage control.

**Analyst recommendation to record for PO:**  
Intent = **replace** (AF-GTD-STAGE-MOVE). Stay on **Option A** until Abyss exclusive groups (B) exist; do not invent a second sync policy. Document that dual tags are an Abyss artifact, not a supported “two stages at once” model.

---

## 5. Expected behavior (AF-GTD-STAGE-MOVE) — checkable

**Given:** synced task on TTS-nextAction with only `#type/next` (plus non-stage tags).  
**When:** user moves it in Abyss tag tree from `type/next` → `type/waiting` (whatever Abyss writes mid-flight).  
**Then (after open-note push ~1.2s or Synchronize):**

1. Vault line has **exactly one** list-mapped stage tag: `#type/waiting`.
2. TickTick `projectId` = waitingFor (mapped list).
3. Non-stage tags unchanged in spirit (order may vary slightly; surgical rewrite preferred).
4. No user-facing “conflict / will be dropped” toast for the removed `#type/next` (expected exclusivity).

**Out of scope:** true multi-stage tasks (two mapped stages on purpose) — product says stages are exclusive.

---

## 6. Open questions for analyst meet

1. Confirm exclusive set = all `tagListMappings` left-hand tags (including `#inbox` if mapped), not only `type/*`.
2. Confirm Option B chase: file Abyss feature request / wait, or accept A indefinitely.
3. Whether Option C (TTS command) is worth a thin slice for power users who refuse dual-tag flash.
4. Reverse AF-7: TT list move already rewrites stage — keep as parallel path; no change.

---

## 7. Hand-off

| Role | Next |
|------|------|
| Analyst | PO sign-off on §4 recommendation; keep AF-GTD-STAGE-MOVE in catalog; link this brief from `PO_STATUS` / results INDEX |
| Developer | No new algorithm unless PO picks C or Abyss gains B; Option A + quiet Notice are the compensation layer |
| Tester | Smoke AF-GTD-STAGE-MOVE on tip = same steps as AF-GTD-TAG-ADD prove, framed as “move”, not “add” |

**References:** `ABYSS_FIRST_CASES.md` (AF-GTD-TAG-ADD, AF-GTD-STAGE-MOVE), `docs/pilot/results/ABYSS-NEST-GTD/137-…` options A–D, `#137` / `#144` / `#146`, `docs/pilot/AF-CHECKBOX-STATUS-GTD.md` (parked).
