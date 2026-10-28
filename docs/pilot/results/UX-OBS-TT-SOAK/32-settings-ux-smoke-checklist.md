# 32 — Settings UX smoke checklist (epic #189 code-complete)

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 32 (pilot smoke — **not run**) |
| Epic | [#189](https://github.com/semyon-alekseev-noveo/tt-sync/issues/189) |
| Phase issues | [#191](https://github.com/semyon-alekseev-noveo/tt-sync/issues/191)–[#194](https://github.com/semyon-alekseev-noveo/tt-sync/issues/194) (PRs #196–#199) |
| Catalog | `ABYSS_FIRST_CASES.md` `UX-SET-*`; plan `27-settings-ux-redesign-plan.md` |
| Vault | Thinkpad-tts-test (pilot only) |
| Build | Tip of `abyss-mapping` after merge [#199](https://github.com/semyon-alekseev-noveo/tt-sync/pull/199) (`6038e8d`); or BRAT when tagged |
| Status | **not run** — do not mark live **pass** / close epic until owner records results |

## Inputs

- Phase 0 plan: `27-settings-ux-redesign-plan.md`
- Implement evidence: `28`–`31` (unit pass; Settings UI pilot deferred)
- TEST_PLAN § UX-SET

## Tip / install (no GitHub release required)

1. Pull / checkout `abyss-mapping` tip that includes #199.
2. `npm run build` → copy `dist/{main.js,manifest.json,styles.css}` → `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/` **or** BRAT from `abyss-mapping` when you prefer a release.
3. Reload plugin `tickticksync-abyss`. Keep `data.json` remapping intact (do not wipe).
4. Open **Settings → TickTickSync (Abyss)** and walk the table below. Glance only — no sync-engine prove unless a row says Synchronize.

## Smoke checklist (all **not run**)

Mark each row after you look; leave **not run** if skipped. Do not invent pass.

### Phase 1 — copy / layout

| Case | Steps (≤30–60s) | Expected | Status |
|------|-----------------|----------|--------|
| UX-SET-GLOSSARY | Maintenance glossary + Sync Control **Deletion guard** chips. State Skip vs Cancel vs Purge trash (DB). | Correct distinctions aloud. | **not run** |
| UX-SET-SYNCTAG-EMPTY | GTD: clear **Pull filter tag**; read badge/tooltip. | Empty = `pull ALL` allow-listed lists. | **not run** |
| UX-SET-MANAGE-DELETED | Maintenance: **Purge trash (DB)** vs held-deletions modal. | ≠ held / Apply once. | **not run** |
| UX-SET-RESET-ONE | Maintenance **Danger zone** only; Tasks/Notes have no Reset. | One Reset control; vault+TT intact (copy). | **not run** |
| UX-SET-SYNCED-LISTS-HELP | Synced lists help under GTD. | Allow-list; empty → nothing; new list needs tick. | **not run** |
| UX-SET-MAINT-SYNC-PRIMARY | Open Maintenance. | **Synchronize** sole primary CTA. | **not run** |

### Phase 2 — visibility (Abyss/GTD path on)

| Case | Steps | Expected | Status |
|------|-------|----------|--------|
| UX-SET-HIDE-DEFAULTS | Sync Control → Defaults (GTD stack on). | Default folder twin hidden; note → GTD Tasks folder. | **not run** |
| UX-SET-EXTRA-FILTERS | Non-empty `syncedLists`; Sync Control. | Extra filters / Limit sync omitted. | **not run** |
| UX-SET-STATUS-VS-STAGE | Non-empty `statusListMappings`; GTD. | Stage→list inactive banner; Status→list under Notes remains. | **not run** |

### Phase 3 — names / warnings / safer defaults

| Case | Steps | Expected | Status |
|------|-------|----------|--------|
| UX-SET-SYNC-NOTES | Notes: **Sync task descriptions**. | ≠ Notebook; help mentions descriptions / NOTE-BODY. | **not run** |
| UX-SET-NOTEBOOK-WARN | Notebook folder → Inbox/capture-like path. | Warn; no forced path rewrite. | **not run** |
| UX-SET-BKUP-DEFAULT | Maintenance → Backup folder (if value `/`). | Warn on vault root; new default `TickTickSync/backups`. | **not run** |
| UX-SET-LEAN-WARN | Project note template → `…/MOC.md`. | Lean/MOC warn; lean/empty path quiet. | **not run** |

### Phase 4 — cold-start & polish

| Case | Steps | Expected | Status |
|------|-------|----------|--------|
| UX-SET-COLD-START | Sync Control top strip. | Projects note + `#system/project` + Active Zone + Synchronize; new TT list must be ticked. | **not run** |
| UX-SET-DEVICE-PRUNE | Device Identity → Known devices. | Clear labels; Remove = non-current only. | **not run** |
| UX-SET-INTERVAL-ZERO | Automatic sync interval = 0. | Progress-on-scheduled grey/disabled + hint. | **not run** |
| UX-SET-PW-CONFIRM | Access Control → set/change password. | Explicit plaintext confirm; cancel does not save. | **not run** |

## Evidence (fill after smoke)

- Tip SHA / BRAT version: `6038e8d` (abyss-mapping after #199); local tip copy → `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/` (manifest still **2.0.94**; bundle contains cold-start / `#system/project` cues); `plugin:reload` attempted 2026-10-28 ~07:43 UTC
- Date (UTC): install only; Settings glance **not run**
- Notes / screenshots (vault-relative only):
- Rows still **not run:** all `UX-SET-*` in tables above

## Conclusion

Epic #189 is **code-complete** (phases 0–4 merged). This file is the owner pilot Settings smoke for all `UX-SET-*`. Tip may be on disk; Settings glance status remains **not run** until the table is exercised. Do **not** close #189/#194 or mark TEST_PLAN / AF live **pass** from this checklist alone.

## Checklist

- [x] Tip from `abyss-mapping` (post-#199) installed on Thinkpad-tts-test (agent copy; no release/tag)
- [ ] Phase 1 rows glanced
- [ ] Phase 2 rows glanced (GTD path)
- [ ] Phase 3 rows glanced
- [ ] Phase 4 rows glanced
- [ ] Comment on #189 with link to this file + honest statuses (after smoke)
- [ ] Close issues / mark live pass only after owner signs off (not automatic)
