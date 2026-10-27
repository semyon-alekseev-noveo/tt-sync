# 04 — Fool's test (тест дураков)

## Meta

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Role | Fool (almost no prior SyncTag / membershipQuery / AF knowledge) |
| Vault | Thinkpad-tts-test (pilot) |
| Plugin | tickticksync-abyss **2.0.94** (confirmed `.obsidian/plugins/tickticksync-abyss/manifest.json`) |
| Abyss Tasks | **2.2.3** |
| When | 2026-10-27 ~08:05–08:08 UTC |
| Focus | Common new-user actions; log failures, surprises, wrong assumptions |
| Tools | vault write; Obsidian CLI `commands` / `command id=…`; TickTick MCP; settings peek (keys only, no secrets); hybrid-search skim of `10 Projects/` |
| Priors before attempts | `00-brief.md` (vault path + landmine *names* only — did **not** study SyncTag / AF cases). Prior phase files **01a/01b/02/03 read after attempts** for delta only. |

Fixtures: `UX-FOOL-*` only. No plugin code changes. No push/merge/release.

## Naive plan

1. Find something called “New Project” (Abyss? Templater? TickTick list?).
2. Put a task called `task-1` inside it (checkbox or UI — whichever is obvious).
3. Look for “Synchronize” / sync and expect the task on TickTick + in Abyss.
4. Tick complete or rename; sync again; expect phone/TT to match.
5. Dump something in Inbox if I can find where “capture” goes.

Guess once when stuck, then write down the stuck point. Do not become an AF expert mid-test.

## Attempt log

### 1. Create project `UX-FOOL-project <timestamp>`

| Path tried | Result |
|------------|--------|
| Command palette / CLI `filter=abyss` | Only `abyss-tasks:open-panel`, `toggle-time-tracking`. **No “New Project” / “Abyss New Project”.** |
| CLI `filter=project` / `filter=New` / `filter=create` | Empty or Templater-only. Stuck: “where is New Project?” |
| Guess: new markdown under `10 Projects/` | **Ran.** Created lean note `10 Projects/UX-FOOL-project 080600.md` with `tags: [system/project]`, heading, `## Active Zone`, one checkbox. Copied the folder + “Active Zone” + `system/project` vibe from glancing at nearby notes / search — **not** from a runbook. |
| TickTick: create list `UX-FOOL-tt-list 080700` | **Ran** (MCP). Alternate guess after Obsidian felt opaque. |

**Verdict:** Obsidian path **pass** (file exists). Discoverable Abyss create **fail / confused**. TT list create **pass** as TT action, **fail** as “project in this sync system” (see attempt 3).

### 2. Add `task-1` inside the project

| Path | Result |
|------|--------|
| Markdown checkbox under Active Zone | `- [ ] task-1 do the thing` — **ran** at create time. |
| Abyss UI add-task | Opened panel via CLI; **no** way in this lane to drive Abyss “add into project.” **Not run** as UI proof. |

**Verdict:** Markdown path **pass**. Abyss UI path **not run / stuck**.

### 3. Expect Abyss + TickTick after Synchronize

| Path | Result |
|------|--------|
| Find sync | CLI `filter=ticktick` → `tickticksync-abyss:tts-sync`. Id does **not** say “Synchronize”; I would not have found it without filtering by plugin id. |
| Run sync | `Executed: tickticksync-abyss:tts-sync` — **ran**. |
| Vault after sync | Note gained `ticktick_id`, tag `obsidian`; line became `- [ ] task-1 do the thing #obsidian #note/ux-fool-project-080600 #inbox %%[ticktick_id:: 6ae05b68…]%%`. |
| TickTick verify | `search_task` / `search` for `UX-FOOL` → **empty** (**confused**). `get_task_by_id` → parent `UX-FOOL-project 080600` on **TTS-Projects**, child under `parentId`. **Pass** once I stopped trusting search. |
| Abyss Projects visibility | Membership *probably* matches (`#system/project` + `10 Projects/`); panel open only — **not run** as visual confirm. |
| TT-origin list `UX-FOOL-tt-list` + task `task-from-tt-list fool` + sync | **Fail.** Vault grep: **NOT_IN_VAULT**. Settings peek later: only `TTS-*` lists in `syncedLists`. Fool expectation (“any TT list I make will show up”) **wrong**. |

**Verdict:** Obs→TT for lean project note **pass** (with tag/id chrome surprise). Discoverability of sync **confused**. TT-list-as-project **fail**. Abyss see-it **not run**.

### 4. Complete or rename; sync again

| Path | Result |
|------|--------|
| Edit line to `- [x] task-1 renamed-and-done` + sync | **Ran.** |
| TickTick after | Child title `task-1 renamed-and-done`, `status: 2`, `completedTime` set — **pass**. |
| Vault chrome | Still no `✅` date like many other vault lines; checkbox stayed `[x]` — **mild confuse** vs peers. |

**Verdict:** **pass** for rename+complete Obs→TT.

### 5. Inbox capture if obvious

| Path | Result |
|------|--------|
| `00 Inbox/` new note `UX-FOOL-capture 080640.md` with `- [ ] buy milk for fools test` + sync | Line gained id; TT task on **TTS-Inbox** — **pass**. |
| Abyss “global capture” | Found note `00 Inbox/abyss-active.md` explaining capture lands there; **no** abyss capture command in palette (`filter=capture` empty for abyss). File is an AF/REG wall — scary place to type. **Confused / partial.** |
| QuickAdd commands exist | Opaque choice ids; did not guess which is “inbox.” **Not run.** |

**Verdict:** Dumb file-in-Inbox checkbox **pass**. “Proper” Abyss capture **fail / confused**.

## Where I failed

| # | Failure | Severity |
|---|---------|----------|
| F1 | **No discoverable “New Project”** in command palette (only Abyss open-panel). Brief/product talk of Abyss New Project is invisible to CLI/new user. | **High** |
| F2 | **Any new TickTick list ≠ synced project.** Created `UX-FOOL-tt-list`; sync; nothing in vault. Must use mysterious `TTS-*` lists / scheme. | **High** |
| F3 | **Sync command is `tts-sync`**, not labeled “Synchronize” in CLI listing. Manual sync only (`automaticSynchronizationInterval: 0`). | **Medium** |
| F4 | **After sync, tasks become tag+id walls** (`#obsidian` `#note/…` `#inbox` `%%[ticktick_id::]%%`). Reading the project got worse the moment sync “succeeded.” | **High** (UX) |
| F5 | **TickTick search tools return empty** for titles that exist by id — fool thinks “it didn’t sync.” | **Medium** (verify path) |
| F6 | **Abyss capture / Projects UI** not operable from obvious commands; inbox file is a landfill. | **Medium** |
| F7 | **Settings SyncTag = `tts-test`** but my lines synced **without** `#tts-test`. Experts in later-read reports insist on SyncTag. Fool neither knew nor needed it this run — **docs/ritual vs live behavior mismatch.** | **High** (logic) |
| F8 | Skim of `60 templates/MOC.md` is a Templater wall (prompts, Russian labels, emoji status). Default “make a project” path looks like a PhD. Avoided by writing a bare note. | **High** if default |

Honest **not run:** Abyss Projects panel visual membership; Abyss New Project button; live Notice/toast text; phone app UI.

## Axis feedback

### 1. Template noise — **high (default); low (my lean escape)**

- MOC Templater + empty Overview / `1/2/3` / Metadata callouts = noise factory (seen in neighbors; confirmed in prior reports after).
- My lean note stayed readable **until** sync injected tags/ids.
- `10 Projects/` folder itself is noise: life MOCs + AF/BUG/FEAT + UX soak debris side by side.

### 2. Excess information — **high**

- Dual ids (frontmatter `ticktick_id` + line `%%…%%`).
- Auto tags `#obsidian`, `#note/<slug>`, `#inbox` I did not ask for.
- TickTick `list_projects` returns many lists named `"2"`, `"5"`, `"10"`… alongside `TTS-Projects` — terrifying for a fool picking a home list.
- Abyss `taskIgnoreQuery: #ticktick` vs TTS `syncMarkerTag: ticktick` — two plugins fighting over the same word; I only noticed when peeking settings after being stuck.

### 3. Usability for a fool — **low–medium**

- **What accidentally worked:** note in `10 Projects/` + `#system/project` + Active Zone checkbox + `tts-sync` → TT parent/child. Inbox file checkbox → TTS-Inbox.
- **What a fool cannot find:** New Project, SyncTag rules, which TT lists are “real,” Abyss create/capture, why search is empty.
- **Lucky guess tax:** I guessed Active Zone + system/project from nearby notes. Without that guess, I would have made `test01`-style empty notes forever.

### 4. Logic (did the system match guesses?) — **low**

| My guess | Reality |
|----------|---------|
| “New Project” command exists | Not in palette |
| Folder `10 Projects/` = synced projects | Only if tags/scheme cooperate; many files are decoys |
| Any TickTick list I create will sync | Only allow-listed `TTS-*` |
| SyncTag must matter (settings say `tts-test`) | This Obs→TT run worked **without** it |
| Search by title proves sync | MCP search empty; ids work |
| Complete in markdown = same chrome as other tasks | Complete synced; ✅ date style inconsistent |

**Scores (1–5, 5 = excellent):** noise 2 · excess info 1 · usability 2 · logic 2.

## Wrong assumptions I made

1. Abyss exposes “New Project” as a first-class command.
2. Creating a TickTick list named like my project is the TT-side of the same object.
3. “Synchronize” will be an obvious palette string.
4. Title search in TickTick is a valid smoke check.
5. SyncTag is either required (experts) or irrelevant (my run) — I assumed there would be **one** clear rule; there isn’t from a fool’s seat.
6. Inbox = empty capture pad; instead `abyss-active.md` is a history dump.

## What docs/UI should have said (one screen)

1. **To make a project:** put a note in `10 Projects/` with tag `#system/project`, put next actions under `## Active Zone`, run **TickTickSync → Synchronize** (`tts-sync`). Or use Abyss Projects → New (show the button path).
2. **Do not** create a random TickTick list — use **TTS-Projects** / scheme, or expect silence.
3. After sync, tags/`%%id%%` are normal; hide ids in reading mode if possible.
4. SyncTag: state the **actual** rule in one sentence (when required vs optional). Today settings say `tts-test` while lean Obs→TT can succeed without it — that must be clarified or enforced consistently.
5. Abyss vs `#ticktick` ignore: “TT-pulled project notes may not accept Abyss edits.”

## After reading prior reports (short delta)

| Prior said | Fool lived |
|------------|------------|
| Always add `#tts-test` | I didn’t; Obs→TT still worked — **biggest delta** vs 01a/02/03 ritual |
| TT→Obs MOC dump / `#ticktick` Abyss poison | Avoided by Obs-first lean note; confirmed risk when I made a **standalone TT list** (never pulled) |
| `search_task` empty | Reproduced |
| Lean note > MOC template | Agree; fool who opens MOC first is lost |
| Triple surface Obs / Abyss / TT | Felt as “I don’t know which app is source of truth” |

## Recommendations for fool-proofing

1. **One command:** “New synced project” → creates note + opens Active Zone + optional first task; no Templater PhD.
2. **Ribbon label Synchronize** + first-run toast: “Synced N tasks to TTS-Projects.”
3. **Block or warn** when user creates tasks in non-`syncedLists` TT projects if Obs sync is expected.
4. **Reading mode / display** that hides `%%ticktick_id%%` and collapses sync tags unless editing.
5. **Align SyncTag behavior with settings text** (enforce or stop advertising).
6. Separate pilot/AF debris from “my projects” view (query or folder), or fools think the system is broken landfill.

## Top 5 fool-failures

1. No findable **New Project** (Abyss/command).
2. **New TickTick list never appears** in the vault after sync.
3. Sync success **destroys readability** (tag + id chrome).
4. **SyncTag story incoherent** (settings / expert ritual vs live Obs→TT without `#tts-test`).
5. **Verify by title search fails** → false “didn’t sync” conclusion.

## Checklist

- [x] Attempted create project (vault lean note + TT list alternate)
- [x] Attempted add task-1
- [x] Attempted Synchronize (`tts-sync`)
- [x] Attempted complete/rename + re-sync
- [x] Attempted inbox capture
- [x] Recorded pass/fail/confused per attempt
- [x] Axis feedback (noise / excess / usability / logic)
- [x] Wrong assumptions + what UI should say + severities
- [x] After-prior delta
- [x] Recommendations + top 5
- [x] Fixtures `UX-FOOL-*` only; no secrets/absolute paths; no code change; no push
- [x] INDEX row 4 → done
