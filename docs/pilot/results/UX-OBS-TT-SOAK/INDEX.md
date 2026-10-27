# UX Obs ↔ TickTick soak (pilot)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Vault | Thinkpad-tts-test (pilot only) |
| Plugin | tickticksync-abyss **2.0.94** (confirm in evidence) |
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

## Rules

- Pilot vault only. No secrets, no personal absolute paths in committed evidence (use vault-relative paths).
- Do not invent live results. Mark **not run** if blocked.
- Do not change product code in this gate unless owner asks; config notes OK in evidence.
- After all phases: synthesis only — no silent “pass” on AF cases.
