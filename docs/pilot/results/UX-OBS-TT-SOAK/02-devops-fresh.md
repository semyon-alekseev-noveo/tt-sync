# 02 — DevOps (fresh eyes / ops capture)

## Meta

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Role | DevOps (fresh eyes; not plugin fix) |
| Vault | Thinkpad-tts-test (pilot) |
| Plugin | tickticksync-abyss **2.0.94** (confirmed `.obsidian/plugins/tickticksync-abyss/manifest.json`) |
| When | 2026-10-27 ~07:58–08:02 UTC |
| Focus | Mid-incident style: create short-lived project + next actions + inbox page; sync; verify TT |
| Tools | vault write; Obsidian CLI `append` + `command id=tickticksync-abyss:tts-sync`; TickTick MCP `get_task_by_id` / `get_project_with_undone_tasks` / `list_projects` |
| Priors read | `00-brief.md`, `01a-analyst-vault-tt.md`, `01b-analyst-tt-vault.md` |

## Scenario I tried

Act as on-call doing a fake canary rollout:

1. **Create lean project note** (not MOC Templater) under `10 Projects/`: `UX-DEVOPS-rollout 075847.md` with `status: wip`, tags `#system/moc` `#system/project` `#obsidian`, short Overview, three Active Zone checkboxes each with SyncTag `#tts-test`.
2. **Inbox dump** (natural when I refuse to open a MOC mid-page): append to `00 Inbox/abyss-active.md` — `UX-DEVOPS-inbox 075847 page on-call if canary red #tts-test #inbox`.
3. **Synchronize:** `obsidian vault=Thinkpad-tts-test command id=tickticksync-abyss:tts-sync` → **ran** (`Executed: tickticksync-abyss:tts-sync`).
4. **Verify TickTick** via MCP (no Abyss UI session; toasts **not** live-captured).

Deliberately skipped full `60 templates/MOC.md` — mid-incident I want a card, not a Russian MOC scaffold. Knew SyncTag / ignore landmines from priors (honest: without that, step 1 would fail silently).

## What happened

| Step | Result |
|------|--------|
| Project note create | OK — lean file, no empty `1/2/3` placeholders |
| Inbox append via CLI | OK |
| Sync CLI | **Ran** successfully |
| Vault after sync | Note gained `ticktick_id: 6ae059f5ae70021f88867377`; each AZ line gained `#obsidian` + `#note/ux-devops-rollout-075847` + `%%[ticktick_id:: …]%%` |
| TT parent | Title `UX-DEVOPS-rollout 075847`, list **TTS-Projects** (`6ad1abff…`), tags `obsidian` + `project`, no `parentId` (top-level) |
| TT children (3) | All in **TTS-Projects**, each `parentId` = rollout parent; titles match AZ; tags include `tts-test` + `note/ux-devops-rollout-075847` |
| TT inbox capture | Title `UX-DEVOPS-inbox 075847…`, list **TTS-Inbox** (`6ad1abfe…`), tags `inbox` + `tts-test` + `note/abyss-active` — **not** nested under rollout (expected for inbox dump) |
| Parent `childIds` via MCP | Empty array on parent get, while children correctly set `parentId` — nesting works from child side; parent payload looks incomplete |

Sync latency: vault lines + TT ids present within ~15s of CLI sync. Journal shows dense create/update storm (per-child obs→tt create then tt→obs line rewrite).

### Landmines this run

| Landmine | Bit me? |
|----------|---------|
| Abyss `#ticktick` ignore | **Avoided** — Obs-origin note has no `#ticktick` (unlike TT-pulled tips in 01b). Would have locked Abyss edit if I had used TT-first create. |
| Quoted membership `"10 Projects/"` | Not reconfigured; assumed prior settings. Easy to break if I “fixed” quotes. |
| Parent toast #404 `none`→`none` | **Not observed** (no UI session). |
| Empty MOC `1/2/3` | **Avoided** by skipping MOC template; still litter TTS-Projects from older notes (`test03`, Dishwasher titles `"1"`/`"2"`). |
| Status emoji vs Abyss | Used `wip` (Abyss dialect). Folder still full of `🟢 In Progress` peers — kanban would look split. |

## Axis feedback

### 1. Шум в Obsidian-шаблонах — **medium for my path; high for default path**

- **My path:** lean note stayed readable. Sync did not inject Overview placeholders or Metadata callouts. Good.
- **Default path (observed around me):** `10 Projects/` is a landfill — life MOCs, AF/FOOL fixtures, BUG/FEAT notebooks, empty TT-origin scaffolds (`UX-B tip…`, AF tips). Mid-incident I cannot tell which notes are “real ops” vs soak debris.
- **Inbox:** `00 Inbox/abyss-active.md` is a long AF/REG wall; my page line is easy to miss. Quick capture surface is **not** quick to scan.
- **Template temptation:** if I had used Templater MOC (as docs/power users would), I’d inherit empty callouts + syncable `1/2/3` (confirmed still live on TT for other parents).

### 2. Избыточная информация — **high after first sync**

- One sync turned clean checkboxes into:

  `- [ ] … check canary health #obsidian #tts-test #note/ux-devops-rollout-075847 %%[ticktick_id:: 6ae059f5…]%%`

- `#note/<slug>` repeats the note name on every line — useless noise while paging an incident.
- Dual identity: note `ticktick_id` + three line ids. Fine for machines; hostile in edit mode during on-call.
- TTS-Projects list itself is noisy: placeholder titles `"1"`/`"2"`/`"3"`, duplicate Phase C titles, many life projects mixed with pilot tips — hard to trust as an ops board.
- Notices: **not run** / not captured via CLI; journal volume implies many micro-ops per child.

### 3. Удобство пользования (DevOps mid-incident) — **medium if primed; low if cold**

What worked well:

- Lean Obs note + `#tts-test` + Synchronize → correct TTS-Projects parent + nested children. **Scheme parenting works.**
- Inbox one-liner → TTS-Inbox without inventing a project. Good “page if red” reflex.
- CLI command id is discoverable (`commands filter=tickticksync` → `tts-sync`).

Friction:

- Must remember SyncTag `#tts-test` or the line never leaves the vault (interval sync = `0` / manual).
- Must remember `#system/project` + folder for Abyss membership; wrong tag → invisible in Projects panel.
- Three UIs (markdown / Abyss / TickTick) for one rollout — I used markdown + TT verify; Abyss **not run** this lane.
- Inbox as capture works, but the file is polluted; I would not want this as my SEV pager inbox.
- Without priors I would not know `#ticktick` on the **note** hides it from Abyss — TT-first create (natural for phone on-call) is the wrong door for Abyss editing (01b).

### 4. Логичность — **would I trust this in a real on-call week?** — **low–medium**

| Layer | This fixture |
|-------|----------------|
| Obsidian | Lean project note under `10 Projects/` with `wip` |
| TickTick | Parent in TTS-Projects + 3 children; separate inbox task in TTS-Inbox |
| Abyss Projects | Membership tags present, no `#ticktick` → **should** be editable; Abyss UI **not exercised** this run |

Coherence issue for ops week:

- “Project” means three different things; folder mixes synced scheme parents with non-synced life notes.
- Inbox capture does **not** auto-link to the rollout parent — correct for GTD inbox, but mid-incident I now have a dangling page task unrelated to the project tree unless I manually refile.
- Parent MCP `childIds: []` while children parent correctly — small trust ding when verifying via API/automation.
- Status dialects (`wip` vs `🟢 In Progress`) still split the Projects mental model across the folder.

**Scores (1–5, 5 = excellent UX):** noise 3 (lean path) / 2 (folder default) · excess info 2 · usability 3 · logic 2.

## Would I use this weekly?

**Not as primary on-call system today.** The Obs→TT pipe for a *known* project note is fast and correct enough for a personal pilot. I would **not** trust the vault folder + inbox + TTS-Projects list as a clean ops board without (a) SyncTag muscle memory, (b) a lean project template, (c) Abyss ignore / `#ticktick` fixed for TT-origin, (d) inbox hygiene. For a real SEV week I would still page in TickTick mobile alone unless Obs were the source of truth for runbooks — and then I want less chrome on every line.

## Recommendations

1. **Ops preset:** “incident project” template = title + `## Active Zone` + empty checkboxes only; no MOC `1/2/3`, no empty Metadata callout.
2. **Hide or trim edit-mode tags** (`#note/…`, maybe `#obsidian`) in Active Zone reading/editing defaults; keep ids for power users only.
3. **Document SyncTag + manual sync** in a one-pager aimed at on-call (“checkbox + `#tts-test` + Synchronize”).
4. **Inbox capture file** needs archive/complete sweep or a separate `abyss-active-live.md` — current file is unusable under stress.
5. **TT-origin vs Abyss:** stop writing note-level `#ticktick` when `taskIgnoreQuery` is `#ticktick` (reaffirm 01b) — phone-first create is the DevOps default path.
6. **Optional:** soft-link inbox tasks into a project when a same-prefix title exists (or teach refile); today the page task is orphaned from the rollout tree.

## Checklist

- [x] Plugin version confirmed **2.0.94**
- [x] Priors 01a / 01b read
- [x] Created `10 Projects/UX-DEVOPS-rollout 075847.md` with 3 AZ actions + SyncTag
- [x] Inbox capture appended to `00 Inbox/abyss-active.md`
- [x] Synchronize via Obsidian CLI **ran**
- [x] TT verify: parent + 3 children on TTS-Projects; inbox on TTS-Inbox
- [x] Four axes scored; landmines called out
- [x] No plugin source changes; no push/merge/release
- [x] No secrets / no absolute personal paths in this file
- [x] INDEX row 2 → **done**
