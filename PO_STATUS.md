# Product owner brief — TickTickSync Abyss fork (project scheme)

**Date:** 2026-10-16  
**Audience:** Product owner / decision maker  
**Repo:** `tickticksync` branch `abyss-mapping`  
**Test vault:** `/home/sam/obsidian/Thinkpad-tts-test` (copy only; live vault untouched)  
**Install:** BRAT → `https://github.com/semyon-alekseev-noveo/tt-sync` track **latest release** (**2.0.23**+); plugin id **`tickticksync-abyss`** — `docs/BRAT_INSTALL.md`. GTD wipe on upgrade: **2.0.23** (`buildPersistedSettings`, no store auto-save). Preset: `00 Inbox/TTS-data-preset.json`.

---

## 1. What we wanted to learn

Can TickTickSync (Abyss fork) safely bidirectional-sync with Obsidian for a GTD/Abyss workflow, specifically:

| Direction | Desired behavior |
|-----------|------------------|
| **TickTick → Obsidian** | Parent tasks in TT list **Projects** become Obsidian project notes via **project scheme template** (`system/project`, `## Active Zone`, frontmatter `ticktick_id`) under `10 Projects/` |
| **Obsidian → TickTick** | Obsidian project notes (same scheme) create/update parent tasks in TT list **Projects**; inline/Active Zone tasks stay as children |

---

## 2. What actually happened (first sync)

| Area | Result |
|------|--------|
| Login | OK (session cookie; **not** Open API `tp_…` token) |
| Defaults | **Unlimited sync** (empty Sync Tag / Sync Project) → mirrored **all** TT lists into vault root (`Inbox.md`, `Projects.md`, …) |
| Obsidian (test) | ~123 tasks written with `ticktick_id`; Abyss format was off on first pull |
| TickTick (live) | ~123 titles got Obsidian file links; tag `ticktick` injected; 2 test tasks created |
| Real vault `Thinkpad` | Not modified |
| Limited soak | Failed — limits were wiped on login |

**Cleanup (2026-10-16):** TickTick restored via official MCP (`batch_update_tasks` + `delete_task`): stripped Obsidian links from titles, removed `ticktick` tags (~120 tasks), deleted TTS samples A/B. Verified: filter `tag=ticktick` → empty; probe titles clean.

Test-vault plugin settings hardened (do not re-enable full sync): Sync Tag `tts-test`, interval 86400s, `fileLinksInTickTick=noLink`, `stopInjectingTickTickTag=true`, `projectSchemeEnabled=true`.

---

## 3. Desired product behavior (for PO analysis)

### Project scheme (already in fork code — pilot)

Source: `src/projectScheme.ts`, `src/services/ProjectSchemeService.ts`

- Obsidian note with tag `system/project` in folder `10 Projects/` ↔ TT **parent** task in list `Projects` (tags `project` + `obsidian`).
- Template includes: frontmatter (`status`, `ticktick_id`, …), `# Title`, `## Overview`, `## Active Zone`.
- Subtasks live in Active Zone (and notes linked via `project:`); parents are not written as checkbox lines.
- Status sync: note `status` done-like ↔ parent completed (3-way via `projectSnapshot`).

### Gaps / decisions needed from PO

1. **Default safety:** Should empty Sync Tag/Project stay “sync everything”, or should a fresh install default to “pull nothing until configured”?
2. **Link injection:** Default `fileLinksInTickTick=taskLink` polluted live TT titles — should default be `noLink` for Abyss builds?
3. **Tag injection:** Default injects `#ticktick` into TT — keep, or default `stopInjectingTickTickTag=true`?
4. **Project scheme scope:** Sync **only** list `Projects` + project notes (ignore Inbox / nextAction / …), or full account + scheme as overlay?
5. **Single-file vs per-list files:** Abyss GTD often wants `newTasksFile` + tag→list mapping; project scheme wants `10 Projects/*.md`. Confirm preferred topology.
6. **Publish fork?** Still open (`TODO.md`).

---

## 4. Recommended next experiment (after PO OK)

1. Keep plugin **disabled** or Sync Tag limited until settings confirmed in UI.  
2. Enable **only** project scheme path: Sync Project = `Projects` (or Sync Tag reserved for projects).  
3. `fileLinksInTickTick=noLink`, stop injecting `ticktick` tag.  
4. Sync one TT Projects parent → expect one note under `10 Projects/` from template.  
5. Create one Obsidian `system/project` note → expect parent in TT Projects.  
6. Do **not** touch live vault until this passes.

---

## 5. Ask for PO

**§1 target scheme:** approved by owner 2026-10-16 (TT Projects ↔ Obsidian project notes both ways).

Still open for later (not blocking): defaults in §3 (items 1–5).

**Next:** limited soak — sync **only** list `Projects`, one parent task / one note.

## 6. PO decision (proposed 2026-10-16, pending owner confirmation)

Full analysis: `GTD_SYNC_RESEARCH.md` (hypotheses A/B, recommended R, test plans, open questions §9).

**Answers to §3 open points**

| §3 item | Proposed decision |
|---|---|
| 1 Default scope | A fresh install syncs **nothing** until lists are chosen (new `syncedLists`; empty = no sync + notice). |
| 2 Link injection | Fork default `fileLinksInTickTick=noLink`, `taskLinksInObsidian=noLink`. |
| 3 Tag injection | Fork default `stopInjectingTickTickTag=true`. |
| 4 Project scheme scope | Scheme is an **overlay** on an allow-listed account: list `Projects` + project notes in `10 Projects/`; other lists only if allow-listed. |
| 5 Topology | **R:** one file per GTD list in `30 Tasks/TickTick/` (no root files), GTD state by tag (`type/*` ↔ list), context by tag, projects by scheme. Hub file (`newTasksFile`) stays a fallback. |
| 6 Publish fork | Still open. |

**Why R:** the owner named `NextAction.md`, `Planned.md`… as the target, so list files stay; tags decide the list on push so inline tasks work anywhere; projects stay the only parent/child object.

**Test vault hardened (2026-10-16 follow-up):** `SyncTag=tts-test`, `projectSchemeEnabled=true`, `TickTickTasksFilePath=30 Tasks/TickTick`, `tagListMappings` for `type/*`, Abyss `membershipQuery=10 Projects/`. Sync still creates stub files for every TT list (under `30 Tasks/TickTick/`) until plugin fix G1 — see `GTD_SYNC_RESEARCH.md` §3.7.

**Owner confirmed (2026-10-16):** Topology **R + hub** (`30 Tasks/TickTick/` list files + capture hub). Sync lists: Inbox, nextAction, Planned, waitingFor, someDay, Projects, KB. GTD pilot: **Hypothesis A** tag table `type/next|planned|waiting|someday` (vault note `type/*` is mostly **document** taxonomy in frontmatter — not task routing; see `GTD_SYNC_RESEARCH.md` §2.4). Project template: **`60 templates/MOC.md`**. TTS-* test lists: **yes** (MCP). Still: rotate exposed `tp_…` token if not done.

**Install (2026-10-16):** Community id `tickticksync` replaced by **`tickticksync-abyss`** — TickTickSync (Abyss fork) via BRAT ([Review](0a91bc4d-6305-4611-b72b-1b50e114e0f3#changes)); see `docs/BRAT_INSTALL.md`. **Push `abyss-mapping` to GitHub** before BRAT can pull (branch not on remote yet). Test vault: only `tickticksync-abyss` enabled; latest `dist/` deployed.

**MVP behaviour:** GTD sync, login/settings fixes, auto-login, re-enable persistence, settings tab — see prior reviews in `CHANGELOG.md`. Settings: **Community plugins → TickTickSync (Abyss fork) → gear**. Preset: `00 Inbox/TTS-data-preset.json`.

**GTD settings wipe (2026-10-16):** Fixed in **2.0.20** — login no longer saves empty GTD defaults when `loadSettings` is still running; use **Import GTD from clipboard** (or re-merge preset) if `data.json` was already wiped. Test vault preset re-merged same day.

**Pilot sync checklist**

| Step | Status | Owner action |
|------|--------|----------------|
| 1 | **Ready** — preset + six `TTS-*` lists; deploy plugin **2.0.20** (`dist/` → test vault) | GTD settings → confirm lists; `projectsListName=TTS-Projects` (name wins over stale `projectsListId`) |
| 2 | **Retest (2.0.18)** — Phase B core passed on 2.0.17 but **FAIL** scoped pull (16 legacy project notes + wrong list id); fix in 2.0.18 | **Synchronize** → only `#tts-test` parent creates/updates; other `10 Projects/` notes untouched; `TTS-Projects.md` stub under `30 Tasks/TickTick/` |
| 3 | Pending user | New `system/project` in `10 Projects/` → **Synchronize** → parent in `TTS-Projects` |
| 4 | Pending user | Inline in `30 Tasks/`: `#ticktick` `#type/next` `#tts-test` → **Synchronize** → `30 Tasks/TickTick/TTS-nextAction.md` + TT list |
| 5 | Pending user | Untick all lists → **Synchronize** → notice, no pull |

**Phase B validation (2026-10-16, subagent):** pilot parent + MOC note — pass; five list stubs — pass; missing `TTS-Projects.md` — fixed in 2.0.18; 16 unrelated project notes updated — **fail** (fixed in 2.0.18 via scheme scope + `resolveProjectsList`).

Runbook: test vault `00 Inbox/TTS-PILOT-RUN.md`.

**Still open:** reverse `projectMappings`; dual hub + per-list files; existing installs that relied on `SyncTag` only need `syncedLists` set.

### References

- `GTD_SYNC_RESEARCH.md` (GTD research and recommendation)  
- `ABYSS_MAPPING.md` (step 7 project scheme)  
- `TODO.md`  
- `CHANGELOG.md`  
- `docs/BRAT_INSTALL.md`  
- `PROJECT_STATE.md`  
- Docs: https://thesamim.github.io/TickTickSync/ (upstream UX)  
