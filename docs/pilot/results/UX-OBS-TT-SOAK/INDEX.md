# UX Obs ↔ TickTick soak (pilot)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Vault | Thinkpad-tts-test (pilot only) |
| Plugin | tickticksync-abyss **2.0.94** label; Settings UX tip = `abyss-mapping` after [#199](https://github.com/semyon-alekseev-noveo/tt-sync/pull/199) (`6038e8d`); older tip after #187 = `bc89f31` (see `25-reset-cache-delete-prove.md`) |
| Goal | Qualitative feedback on day-to-day use — not a green/red AF gate |

## Feedback axes (all roles)

1. **Шум в Obsidian-шаблонах** — MOC / Active Zone / tags / frontmatter / TickTick markers clutter
2. **Избыточная информация** — notices, tags on lines, ids, status noise, Abyss vs vault duplication
3. **Удобство пользования** — can a person add a project/task and sync without hunting docs
4. **Логичность использования** — does Obs↔TT↔Abyss mental model hold; surprises

## Phases

| # | Role | File | Status |
|---|------|------|--------|
| 1a | Analyst A (vault→TT / projects) | `01a-analyst-vault-tt.md` | done |
| 1b | Analyst B (TT→vault / Abyss view) | `01b-analyst-tt-vault.md` | done |
| 2 | DevOps (own workflow, fresh eyes) | `02-devops-fresh.md` | done |
| 3 | Researcher (try to use) | `03-researcher-try.md` | done |
| 4 | Fool's test | `04-fools-test.md` | done |
| 5 | Synthesis | `05-synthesis.md` | done |
| 6 | Decision #1: Abyss vs `#ticktick` | `06-decision-ticktick-vs-abyss.md` | done |
| 7 | Owner Q: `30 Tasks/TickTick` stubs / duplicates | `07-ticktick-folder-stubs.md` | done |
| 8 | Post-#179 stub cleanup prove ×2 | `08-stub-cleanup-prove.md` | **pass** ×2 |
| 14 | Task status → TT list map (spec) | `14-task-status-to-list-map.md` | done (code #182) |
| 15 | Release notes mapping (tag **2.0.94**) | `15-release-notes-mapping.md` | done (tag zip still tags→lists) |
| 16 | Post-#182 status map prove ×2 | `16-status-map-prove.md` | **pass** ×2 (tip; version still 2.0.94) |
| 24 | Post-Reset orphan vault-line modal | `24-post-reset-delete-modal.md` | **fail** observed; fixed in #187 |
| 25 | Post-#187 Reset cache-delete prove | `25-reset-cache-delete-prove.md` | **install pass**; Reset-path prove **blocked** (owner Reset → Sync ×2) |
| 26 | Held deletions after Reset (owner screenshot) | `26-held-deletions-after-reset.md` | **DO NOT APPLY** — Skip; false vault-absent |
| 27 | Settings UX redesign plan (epic #189) | `27-settings-ux-redesign-plan.md` | **plan / DoR** — Phase 0 #190 merged (#195) |
| 28 | Settings UX Phase 1 (#191) | `28-settings-ux-phase1.md` | **unit pass**; eng closed #191; pilot → checklist 32 |
| 29 | Settings UX Phase 2 (#192) | `29-settings-ux-phase2.md` | **unit pass**; eng closed #192; pilot → checklist 32 |
| 30 | Settings UX Phase 3 (#193) | `30-settings-ux-phase3.md` | **unit pass**; eng closed #193; pilot → checklist 32 |
| 31 | Settings UX Phase 4 (#194) | `31-settings-ux-phase4.md` | **unit pass**; eng closed #194; code #199; pilot → checklist 32 |
| 32 | Settings UX smoke (эпик #189) | `32-settings-ux-smoke-checklist.md` | **agent smoke 2026-11-04** tip `5be067d` / 2.0.96 — A–C ☑ (C2 banner+unit; live modal not automated); epic #189 open for owner accept |
| 33 | #205 smoke feedback impl | `33-settings-ux-205-smoke-feedback.md` | **unit pass** (#206); checklist 32 **agent re-smoke** 2026-11-04 |
| 36 | Modal/notice copy review | `36-modal-notice-copy-review.md` | orphan iter 2 owner OK; skip-completed import unit |
| 37 | Sync conflict refactor debate (A×B → agree) | `37-sync-intent-identity-debate.md` | **agreed** — identity-before-plan + typed intents; no code yet |
| 38 | Sync intent × identity plan (epic [#255](https://github.com/semyon-alekseev-noveo/tt-sync/issues/255)) | `38-sync-intent-identity-plan.md` | **plan / DoR** — #256–#260 unit landed; #261 prove ×2 **live pass** |
| 39 | ARCH-SYNC #261 pilot prove ×2 | `39-arch-sync-261-prove.md` | **live pass** ×2 @`3729c0b` (after #267); fixtures PKM+Годовые |
| 40 | Confirm Rebind gap (#259 / plan #38 step 4) | `40-confirm-rebind-gap.md` | **documented**; fix `UX-SYNC-CONFIRM-REBIND` (unit; live **not run**) |
| 41 | Confirm Rebind InsertLine dups after #273 | `41-confirm-rebind-dup-fail.md` | **live fail**; unit fix `BUG-CONFIRM-REBIND-DUP`; pilot re-prove **not run** |
| 42 | Open-note Delete/Backspace Confirm PushDeleteTT | `42-opennote-delete-confirm.md` | **live fail** post-#274; unit fix `BUG-OPENNOTE-DELETE-CONFIRM`; re-prove **not run** |
| 43 | Conflict resolution: TT-only same-title dedupe DoR | `43-conflict-resolution-tt-dedupe.md` | **won't-fix / cancelled** — DoR **1A/2A/3A** historical; [#276](https://github.com/semyon-alekseev-noveo/tt-sync/issues/276) closed after prevention; no Deduplicate UI |
| 44 | Same-title TT duplicate **creation** prevention | `44-tt-dup-create-prevention.md` | **live pass** ×2 (after parent-bypass fix); tip@`8528baa` first prove **fail** (inbox); Deduplicate **won't-fix** |
| 45 | TT orphan cleanup + create-path audit | `45-create-path-audit.md` | Cleanup **done**; units **pass**; ProjectScheme prove **not run**; #276 **closed** won't-fix |
| 47 | List-root `note/*` must not createNote ([#284](https://github.com/semyon-alekseev-noveo/tt-sync/issues/284)) | `47-listroot-note-promote.md` | **live pass** ×2 @`358690e` / 2.0.96; prevention `BUG-LISTROOT-NOTE-PROMOTE` |
| 48 | Dishwasher / workplace hierarchy recovery (post-#285) | `48-dishwasher-workplace-hierarchy-recovery.md` | **recovery pass** ×2 (TT reparent + vault park + sync); tip 2.0.96 |
| 49 | Sync master off (`UX-SET-SYNC-MASTER-OFF` / [#287](https://github.com/semyon-alekseev-noveo/tt-sync/issues/287)) | `49-ux-set-sync-master-off.md` | **not run** (unit in PR; live prove deferred) |
| 50 | DON-253 Reset→Sync ghost markers + create `.match` | `50-don253-reset-ghost-match.md` | **fail** — #290 / #291; no Apply once |
| 34 | #208 held post-restore + AZ wipe root cause | `34-held-post-restore-az-wipe.md` | **root cause**; rematch fix shipped |
| 35 | #208 Rematch prove ×2 | `35-bug-208-rematch-prove.md` | **pass** prove 1+2; issue closed |
| — | Identity chain follow-up (rebind epic) | [`../ID-CHAIN-REBIND/`](../ID-CHAIN-REBIND/) | **DoR** epic [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214); Rematch insert ≠ vault-wide rebind |
| 185 | #185 status source (analyst spec) | [`../../UX-ABYSS-STATUS-SRC.md`](../../UX-ABYSS-STATUS-SRC.md) | **spec only (not run)**; not DoR |

## Rules

- Pilot vault only. No secrets, no personal absolute paths in committed evidence (use vault-relative paths).
- Do not invent live results. Mark **not run** if blocked.
- Do not change product code in this gate unless owner asks; config notes OK in evidence.
- After all phases: synthesis only — no silent “pass” on AF cases.
