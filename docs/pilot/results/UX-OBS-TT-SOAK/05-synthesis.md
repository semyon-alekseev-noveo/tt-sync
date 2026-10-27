# Synthesis — UX Obs ↔ TT soak

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Plugin | **2.0.94** (all phases) |
| Vault | Thinkpad-tts-test |
| Inputs | `01a`, `01b`, `02`, `03`, `04` + `00-brief` |
| Status | **done** (qualitative; not an AF pass/fail gate) |

## Verdict (one paragraph)

Sync **mechanics work** on the lean path: a `10 Projects/` note with `system/project` + Active Zone checkboxes + Synchronize reliably creates TTS-Projects parents and nested children (Analyst A, DevOps, Researcher, Fool accidental win). Day-to-day **product feel does not**: default MOC dump, post-sync tag/`%%id%%` chrome, SyncTag/Abyss-ignore landmines, and three overlapping “Projects” surfaces make cold-start and phone-first use feel flee-worthy. Adopt today = **partial** (Obs notes + careful TT nexts) — not a primary weekly board.

## Axis rollup

| Axis | Consensus severity | What all roles saw |
|------|--------------------|--------------------|
| Template noise | **high** (default) / medium (lean) | Full MOC empty Overview/Metadata; placeholder `1/2/3` become real TT tasks; TT→Obs pulls the same empty MOC |
| Excess information | **high** after first sync | `#obsidian` `#note/…` `#tts-test` + `%%[ticktick_id::]%%`; notices (`none`→`none` #404); AF landfill in `abyss-active.md` |
| Usability | **medium if primed / low if cold** | Works with runbook; Fool cannot find New Project; SyncTag story confusing; manual sync easy to miss |
| Logic | **low–medium** | Obs folder ≠ Abyss query ≠ TTS-Projects list; `#ticktick` tag vs Abyss `taskIgnoreQuery` hides the projects you just synced |

## Cross-role agreement (do these first)

1. **Lean project template for sync** — stop shipping empty MOC + placeholder `1/2/3` into TTS-Projects; TT→Obs parents should not dump full MOC chrome.
2. **Quiet post-sync lines** — hide or minimize `#obsidian` / `#note/…` / raw `%%ticktick_id%%` in the reading surface (or fold into non-visible metadata).
3. **Abyss ↔ TickTickSync config pack** — document/fix: membership `"10 Projects/"`, create folder `10 Projects` (no quotes), and **do not** ignore `#ticktick` if TT-origin projects must be editable in Abyss (or stop stamping `#ticktick` on project notes).
4. **One-screen cold-start** — what is a project, where to create it, SyncTag (or remove the ritual), how to Synchronize, which TT list is TTS-Projects.
5. **Notice hygiene** — #404 parent toast; reduce stub recreation noise (`zz-parked-17` / TTS-* stubs) from looking like user content.

## Split opinions / nuance

| Topic | Nuance |
|-------|--------|
| SyncTag `#tts-test` | Analysts/DevOps/Researcher treated it as required ritual; Fool lean Obs→TT appeared to work without it — **settings vs reality** needs one true story |
| Inbox | Capture lands on TTS-Inbox, but `abyss-active.md` is unusable landfill; page tasks stay outside project tree |
| Parent/child pull | Analyst B: not atomic / child slow or missing; others: Obs→TT nesting fine when pushed from vault |
| Adopt weekly | DevOps/Researcher: no as primary; Fool: accidental success path exists if you guess lean markdown |

## Role snapshot

| Role | Would use? | One-line |
|------|------------|----------|
| Analyst A | n/a (audit) | Obs→TT OK; Abyss hide + line chrome + triple Projects |
| Analyst B | n/a | TT→Obs = MOC dump; Abyss blocked; status dialect clash |
| DevOps | **No** as primary on-call board | Nesting works; chrome + SyncTag + inbox hygiene block trust |
| Researcher | **Partial** | Obs for notes, TT for phone — only if chrome/SyncTag drop |
| Fool | Accidental path | No New Project UI; new TT list ignored; sync success looks like failure (wall of tags) |

## Suggested backlog (product / docs — not this PR)

| Priority | Item | Evidence |
|----------|------|----------|
| P0 | Lean sync project template; no `1/2/3` placeholders | 01a, 01b, 02, 04 |
| P0 | Resolve `#ticktick` vs Abyss `taskIgnoreQuery` | 01a, 01b, 02, 03 |
| P1 | Reduce visible sync chrome on task lines | all |
| P1 | Cold-start / fool-proof one-pager (or settings wizard) | 04, 02, 03 |
| P1 | Clarify SyncTag: required or not; fail loudly if required | 01a, 02, 03, 04 |
| P2 | Fix parent-change toast (#404) | 01b, owner |
| P2 | Inbox hygiene / separate pilot capture note from AF archive | 02, 03, 04 |
| P2 | Status mapping MOC emoji ↔ Abyss inbox/todo/wip/done | 01a, 01b |

## Checklist

- [x] All phase files present
- [x] Axes rolled up
- [x] Shared P0/P1 backlog
- [x] No AF case marked pass from this soak
- [x] INDEX row 5 → done
