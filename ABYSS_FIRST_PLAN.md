# Plan — align TickTick sync with Abyss Tasks logic

**Date:** 2026-10-16  
**Status:** P1–P6 **confirmed by owner** 2026-10-16; Steps 1–2 done. **Step 3 = Option B** (owner 2026-10-16).  
**Audience:** you (PO), implementers  
**Replaces as north star:** topology **R** (“canonical line must live in `30 Tasks/TickTick/<List>.md`”) — **parked**, not deleted from history (`GTD_SYNC_RESEARCH.md`, `GTD_SYNC_CASES.md` CASE-T4).

---

## 0. One-line goal

**Obsidian structure stays where Abyss puts it.** TickTick mirrors **lists** (from line tags), **parents** (from Abyss project notes), and **task lines** (checkboxes + Abyss child block). Sync does **not** move tasks into per-list markdown files for correctness.

---

## 1. Principles (non‑negotiable for this plan)

| # | Principle |
|---|-----------|
| P1 | **Abyss defines “task” and “project”** in the vault; the plugin maps to TickTick, it does not redefine filing. |
| P2 | **Line location is stable** — capture in a meeting note, project Active Zone, or task note; sync updates that line in place. |
| P3 | **TickTick list** = GTD stage on the phone, driven by **tags on the line** (`tagListMappings`), not by which `.md` file basename matches a list name. |
| P4 | **TickTick project parent** = one task per **Abyss project note**; children = checkboxes in that note (and lines in notes linked via frontmatter `project:` if you use task notes). |
| P5 | **Safety unchanged** — `syncedLists`, `syncScopeFolders`, manual sync, `noLink` / no `ticktick` tag injection on TT. |
| P6 | **Topology R list files** are optional **views or pull targets**, not the source of truth for where a vault-born task lives. |

---

## 2. Roadmap overview

```text
Step 1  Decide + document rules (PO, vault)
Step 2  Align Abyss settings with sync settings (vault only)
Step 3  Pick inbox / sync-marker strategy (PO)
Step 4  Code: “no relocate” policy + pull into list files optional
Step 5  Code: single project definition (query = folder/tags)
Step 6  Shrink tests → Abyss-first case set
Step 7  Pilot on Thinkpad-tts-test (TTS-*)
Step 8  Production lists + live vault gate
```

Dependencies: **1 → 2 → 3** can run in parallel with **4** design; **6** after **4–5**; **7** after **2–6**; **8** last.

---

## Step 1 — Decide and write the rules (PO, ~1 session)

**Goal:** One short spec everyone tests against; stop re-reading three docs.

| Action | Detail |
|--------|--------|
| 1.1 | Confirm **P1–P6** above or edit in this file. |
| 1.2 | Mark **CASE-T4 / topology R canonical file** as **out of scope** for v1 (note in `PO_STATUS.md`). |
| 1.3 | List **what never syncs**: dashboards, KB notes, archive folders, task-note *bodies* (only checkbox lines inside). |
| 1.4 | List **TickTick lists** for production (Inbox, nextAction, …, Projects) vs pilot (`TTS-*`). |

**Done when:** This file §1–§3 accepted; `PO_STATUS.md` points here as current direction.

**Step 1 status:** **Done** — owner confirmed P1–P6 on 2026-10-16. Topology R / CASE-T4 remain **out of scope** for v1.

---

## Step 2 — Align Abyss vault config (no plugin code)

**Goal:** Abyss “project” and “where new tasks go” match what TickTickSync already expects.

| Action | Abyss setting | Target (test vault, then Thinkpad) |
|--------|----------------|-------------------------------------|
| 2.1 | `projects.membershipQuery` | `10 Projects/` **or** `#system/project` (same rule sync uses for `projectsFolder` + tags) |
| 2.2 | `projects.taskInsertionSection` | `## Active Zone` (match MOC template, not default `# Tasks`) |
| 2.3 | `projects.taskInsertionMode` | `section` (insert under Active Zone) |
| 2.4 | `taskFilePath` / capture | Keep your quick-capture path; ensure path is inside `syncScopeFolders` if it should sync |
| 2.5 | `abyssTasksFormat` | `true` in TickTickSync settings (already on pilot) |

**Done when:** Creating a task from Abyss **Projects** UI lands under **Active Zone**; project list in Abyss shows the same notes as `10 Projects/`.

**Verify:** Open Abyss Projects panel → open a pilot MOC → add task → line appears under Active Zone.

**Step 2 status (test vault `Thinkpad-tts-test`, 2026-10-16):**

| Setting | Value |
|---------|--------|
| `projects.membershipQuery` | `10 Projects/` |
| `projects.taskInsertionSection` | `## Active Zone` |
| `projects.taskInsertionMode` | `section` (unchanged) |
| `taskFilePath` | `00 Inbox/abyss-active.md` (inside `syncScopeFolders`) |
| TickTickSync `abyssTasksFormat` | already `true` in preset |

Reload Obsidian or restart Abyss if the Projects list looks stale.

---

## Step 3 — Inbox vs sync marker (PO choice)

**Goal:** Resolve Abyss **inbox = untagged** vs sync **`#ticktick`**.

### Why this matters

- **Abyss Inbox** (shortcut `I`) shows tasks that match the inbox rule — by default **lines with no tags** (`inbox.mode: "untagged"`).
- **TickTickSync** marks synced lines with **`#ticktick`** (or `#obsidian`) and `ticktick_id` in the line metadata so it knows what to push/pull.
- After the first sync, a task is **tagged**, so it **drops out** of the default Abyss Inbox even though you might still think of it as “inbox” on the phone (TickTick Inbox list).

You are choosing **where synced-but-not-yet-clarified work appears in Abyss**, not whether TickTick works.

### Option A — Tag-based inbox (recommended if you want one clear “inbox” in Abyss)

**Abyss**

```json
"inbox": {
  "mode": "tag",
  "tag": "inbox",
  "removeTagOnAssign": true
}
```

**Behavior**

- Inbox view = tasks with `#inbox` (or whatever tag you set).
- When you clarify (add `#type/next`, move to project, etc.), `removeTagOnAssign` can strip `#inbox` so the task leaves Inbox.
- Sync still adds `#ticktick` + id; you may also add `#inbox` on capture lines you want in Abyss Inbox.

**TickTick**

- Unchanged: `#ticktick` is the **sync marker**, not the GTD list. List still comes from `#type/*` or default Inbox list.
- Optional habit: new captures get `#inbox #ticktick` until you tag GTD stage.

**Pros:** Predictable Inbox in Abyss; synced and unsynced captures can both use `#inbox`.  
**Cons:** More tags on lines; you must add `#inbox` when capturing (or automate via template/snippet).

**One-liner:** “Synced tasks live in normal tag views; **Inbox = `#inbox`**.”

---

### Option B — Untagged inbox + ignore sync marker in Abyss

**Abyss**

```json
"inbox": { "mode": "untagged", "tag": "", "removeTagOnAssign": true },
"taskIgnoreQuery": "#ticktick"
```

(`taskIgnoreQuery` — set in Abyss settings **Tasks → ignore query**; syntax is Abyss query language, often tag/path filters.)

**Behavior**

- Inbox = tasks with **no tags that count**, while `#ticktick` is **ignored** for inbox/tag assignment so synced lines can still look “untagged” to Inbox **if** they have only `#ticktick`.
- **Verify in your Abyss build:** Settings UI → whether `taskIgnoreQuery` excludes tags from inbox counting only, or hides tasks entirely from some views.

**TickTick**

- Unchanged.

**Pros:** Keeps “inbox = stuff without GTD tags” mentally.  
**Cons:** Easy to misconfigure; `#obsidian` / `#type/next` still affect views; needs a quick UI test after setting ignore query.

**One-liner:** “**Inbox = untagged** (ignoring `#ticktick` for Abyss).”

---

### Option C — Folder split: local inbox vs synced work

**Abyss**

- Keep `inbox.mode: "untagged"`.
- Quick capture only in notes **outside** sync scope (e.g. old `tasks/active.md`) **or** accept that `00 Inbox/abyss-active.md` is synced when lines have `#ticktick`.

**TickTickSync**

```json
"syncScopeFolders": ["10 Projects/", "30 Tasks/"]
```

(Omit `00 Inbox/` — **not** what the pilot preset uses today; today includes `00 Inbox/`.)

**Behavior**

- Stuff in `00 Inbox/` never pushes to TickTick unless you widen scope later.
- GTD work you want on the phone: write under `30 Tasks/` or project Active Zone with `#ticktick` + `#type/*`.

**Pros:** Safest “scratch pad” in Inbox; no accidental TT push from fleeting notes.  
**Cons:** Phone mirror **does not** see quick captures until you move/tag into scoped folders; two-step habit.

**One-liner:** “**Inbox folder = local only**; phone sync only from Projects + Tasks trees.”

---

### Comparison

| | A Tag inbox | B Ignore `#ticktick` | C Folder scope |
|--|-------------|----------------------|----------------|
| Abyss Inbox shows synced captures easily | Yes, with `#inbox` | Sometimes, if ignore works | Only if in scoped folder + tagged |
| TT sees `00 Inbox/` captures (current preset) | Yes, if `#ticktick` | Yes | **No** (if you remove folder from scope) |
| Config complexity | Low | Medium (verify ignore) | Low, but behavior change |
| Fits “Abyss-first” | Strong | Strong if verified | Strong for safety, weaker for capture |

### Pilot preset note

Today `TTS-data-preset.json` includes **`00 Inbox/`** in `syncScopeFolders`. Option **C** conflicts unless you change the preset. Options **A** and **B** keep that scope.

| Action | Detail |
|--------|--------|
| 3.1 | Record chosen option in §3.1 below. |
| 3.2 | Apply JSON / settings; one paragraph in `00 Inbox/TTS-PILOT-RUN.md` when chosen. |

**Done when:** You can explain in one sentence: “Synced tasks appear in Abyss view X.”

### 3.1 Decision (fill in)

- **Chosen option:** **B** — untagged inbox + `taskIgnoreQuery: #ticktick` (owner 2026-10-16).
- **Notes:** Keep `00 Inbox/` in `syncScopeFolders` (not C). Dual inbox: Abyss Inbox + TT **TTS-Inbox**; sync marker must not evict tasks from Abyss Inbox. Pilot: merge `00 Inbox/TTS-abyss-preset.json` into `abyss-tasks/data.json`; verify Inbox view after reload.
- **One-liner:** Synced tasks appear in **Abyss Inbox** until GTD tags apply; `#ticktick` is invisible to Abyss tagging rules.

---

## Step 4 — Plugin behavior: lines stay put (engineering)

**Goal:** Remove the need for CASE-T4; align pull/push with P2.

| Action | Code / config area | Change |
|--------|-------------------|--------|
| 4.1 | Product | **Do not implement** mirror/move to `TickTickTasksFilePath/<List>.md` for vault-born tasks. |
| 4.2 | Pull routing | New/changed TT tasks → line in **list file** *or* update existing line by `ticktick_id` **without** moving unrelated captures (already mostly id-based; verify). |
| 4.3 | Push routing | `tagListMappings` sets TT `projectId`; **do not** relocate markdown file on list change unless user opts in (today: tag rewrite in place for `newTasksFile` mode — extend “in place” as default). |
| 4.4 | List stub files | Keep stubs only for **allow-listed** lists (done); stubs may stay **empty** — OK for Abyss-first. |
| 4.5 | `newTasksFile` | Document as **optional** “single review file”; not required for Abyss-first. |

**Done when:** Phase D scenario passes as: line remains in `30 Tasks/TTS-PILOT-tag-routing.md`, TT list = nextAction, **no requirement** to fill `TTS-nextAction.md`.

**Tests:** Adjust or add vitest: push from arbitrary path → no file move; pull updates line by id.

---

## Step 5 — One project definition (engineering + settings)

**Goal:** Stop maintaining two mental models (`membershipQuery` vs `system/project` + scheme).

| Action | Detail |
|--------|--------|
| 5.1 | Settings UI copy: `projectsFolder` + tags = **same** as Abyss project membership (document recommended query). |
| 5.2 | Optional: read `abyss-tasks` `data.json` `projects.membershipQuery` at runtime **(future)** — or manual parity only for v1. |
| 5.3 | Fix **P6** (parent duplicated as checkbox in MOC) — regression test. |
| 5.4 | `project:` frontmatter on task notes → keep `resolveForFile` behavior (ABYSS_MAPPING step 7). |

**Done when:** One bullet in settings: “Project notes: folder `10 Projects/`, tag `system/project`” matches Abyss Projects panel.

---

## Step 6 — Simpler acceptance cases (QA)

**Goal:** Replace overwhelm with **~8** Abyss-shaped cases (keep old catalog as archive).

| ID | Story |
|----|--------|
| AF-1 | Empty `syncedLists` → no pull |
| AF-2 | Project: TT parent → note in `10 Projects/` (Active Zone) |
| AF-3 | Project: new MOC → TT parent |
| AF-4 | Project: checkbox in Active Zone → TT subtask |
| AF-5 | Task: line in random note + `#type/next` → TT nextAction, **line unchanged in vault** |
| AF-6 | Complete checkbox ↔ complete TT task |
| AF-7 | TT moves list → tag on **same line** updates |
| AF-8 | Note outside `syncScopeFolders` → no push |

| Action | Detail |
|--------|--------|
| 6.1 | Add `ABYSS_FIRST_CASES.md` (or § in this file) when Step 1 done. |
| 6.2 | Map old CASE-* → AF-* for traceability (T4 → **cancelled**). |

**Done when:** Pilot runbook references AF-* only.

---

## Step 7 — Pilot soak (test vault)

**Goal:** Prove Abyss-first on `Thinkpad-tts-test` before live vault.

| Action | Detail |
|--------|--------|
| 7.1 | Complete Steps 2–3 on test vault. |
| 7.2 | Plugin **2.0.24+** with Step 4–5 changes (release when ready). |
| 7.3 | Run AF-1 … AF-8; log in `CHANGELOG.md`. |
| 7.4 | Optional: one week daily use — capture in non-list-file notes only. |

**Done when:** AF-1–AF-8 pass; no sync to non-`TTS-*` lists.

---

## Step 8 — Production gate (live `Thinkpad`)

**Goal:** Same behavior, real list names.

| Action | Detail |
|--------|--------|
| 8.1 | Duplicate preset with production list names + sync tag policy. |
| 8.2 | Re-run AF-* once. |
| 8.3 | CASE-M1-style cleanup only if you still want list files as **optional** reading copies. |

**Done when:** PO signs off in `PO_STATUS.md`; enable plugin on live vault.

---

## 3. What we stop doing (scope cut)

- **CASE-T4** / list-file mirror as success criterion.  
- Treating **empty** `TTS-nextAction.md` as pilot failure.  
- Expanding **22-case** matrix before AF-* pass.  
- **Hub vs R** debate as blocker — default = **neither required**; lines stay where written.

---

## 4. What we keep from current work

- `syncedLists`, `syncScopeFolders`, GTD settings UI, settings persistence (2.0.20–2.0.24).  
- `tagListMappings`, `abyssTasksFormat`, project scheme **behavior** (parent/children), `projectTemplatePath`.  
- Safety preset: `fileLinksInTickTick=noLink`, `stopInjectingTickTickTag=true`, manual sync.  
- Pilot infrastructure: `TTS-*`, `tts-test`, `TTS-PILOT-RUN.md` (rewritten to AF-* when Step 6 lands).

---

## 5. References

- `ABYSS_FIRST_PLAN.md` (this file)  
- `GTD_SYNC_RESEARCH.md` §2 (Abyss model)  
- `ABYSS_MAPPING.md` (format + scheme)  
- `GTD_SYNC_CASES.md` (legacy / TickTick-centric cases)  
- Test vault: `.obsidian/plugins/abyss-tasks/data.json`, `00 Inbox/TTS-data-preset.json`, `00 Inbox/TTS-abyss-preset.json`  
- Canvas: `canvases/gtd-sync-logic.canvas.tsx` (update labels when Step 1 confirmed)
