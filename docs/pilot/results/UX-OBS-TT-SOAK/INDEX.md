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
| 28 | Settings UX Phase 1 (#191) | `28-settings-ux-phase1.md` | **unit pass**; pilot Settings **not run** |
| 29 | Settings UX Phase 2 (#192) | `29-settings-ux-phase2.md` | **unit pass**; pilot Settings **not run** |
| 30 | Settings UX Phase 3 (#193) | `30-settings-ux-phase3.md` | **unit pass**; pilot Settings **not run** |
| 31 | Settings UX Phase 4 (#194) | `31-settings-ux-phase4.md` | **unit pass**; pilot Settings **not run**; code merged #199 |
| 32 | Settings UX smoke (эпик #189) | `32-settings-ux-smoke-checklist.md` | **частично** — owner ✗ §3–9 → #205 |
| 33 | #205 smoke feedback impl | `33-settings-ux-205-smoke-feedback.md` | **unit pass**; pilot re-smoke not run |
| 34 | #208 held post-restore + AZ wipe root cause | `34-held-post-restore-az-wipe.md` | **root cause**; rematch fix shipped |
| 35 | #208 Rematch prove ×1 | `35-bug-208-rematch-prove.md` | **pass** prove 1 @ 15:10Z; prove 2 **not run** |
| 185 | #185 status source (analyst spec) | [`../../UX-ABYSS-STATUS-SRC.md`](../../UX-ABYSS-STATUS-SRC.md) | **spec only (not run)**; not DoR |

## Rules

- Pilot vault only. No secrets, no personal absolute paths in committed evidence (use vault-relative paths).
- Do not invent live results. Mark **not run** if blocked.
- Do not change product code in this gate unless owner asks; config notes OK in evidence.
- After all phases: synthesis only — no silent “pass” on AF cases.
