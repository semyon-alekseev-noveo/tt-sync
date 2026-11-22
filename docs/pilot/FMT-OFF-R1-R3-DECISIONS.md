# FMT-OFF R1–R3 — owner decision sheet (drafted 2026-11-22)

Parent: [#201](https://github.com/semyon-alekseev-noveo/tt-sync/issues/201), analysis `docs/pilot/ABYSS-FORMAT-OFF-MATRIX.md` §5. R4 (#305) and R5 (#306) are **shipped and live-proven** — the engine now keeps pull lossless and never relocates lines while the Abyss config is present. What remains are the three *Settings-UX* protections the matrix called R1–R3 (+ R6 docs), each pending an owner pick.

Decision rule per DEV_FLOW: approve ⇒ case ID + expected behavior land in `ABYSS_FIRST_CASES.md` first, failing unit named by the ID, then code. One PR per approved option (R2 can ride with R1).

---

## R1 — Confirm-once warning before Synchronize while OFF with Abyss config

**Problem it stops:** the matrix's core finding — OFF + sync is a migration, not a toggle; the pilot experiment today is exactly «owner flipped the flag and synced to see what happens».

**Proposed behavior (testable):**
- Predicate: `!abyssTasksFormat && projectSchemeEnabled && statusListMappings.length > 0 && syncScopeFolders` non-empty (same family as `abyssLineInPlace`'s slice, `src/syncScope.ts`).
- Manual **Synchronize** (and only manual) while the predicate holds → one modal «Abyss format is OFF — syncing now re-syncs in classic mode: bodies under checkboxes may detach, tags change, list stubs can reappear. Sync anyway / Cancel». Buttons never delete anything; Cancel = no run.
- Confirm is remembered **per session**, not persisted (no new setting).
- Scheduled/reactive paths: **no** modal (they are already gated by `syncEnabled` / interval; a background modal would be worse than silence).

**Case ID:** `AF-FMT-OFF-WARN` (already proposed in matrix §6).
**Surface:** `src/sync/SyncRunContext` or the Maintenance sync trigger + a small modal component; unit `afFmtOffWarn.test.ts`. **Size: S.**
**Risk:** a modal on the manual path the owner uses daily — annoying if the flag is legitimately OFF for classic testing. Mitigation: predicate requires the full Abyss config, so classic-only users never see it.
**Recommendation: accept.** Cheapest real protection; directly targets the failure mode we just paid a pilot soak to measure.

## R2 — Rename the toggle + non-hidden danger copy

**Proposed behavior:** label becomes «Abyss Tasks format — turning this off changes how lists and symbols sync»; help text lists the four effects in one line each (symbols, `- >` bodies, tags, stubs). Copy only, no state change, no confirmation added here (that's R1).
**Case ID:** `UX-SET-FMT-OFF-COPY` (Phase-1-style copy row).
**Surface:** `src/ui/settings/svelte/NotesSettings.svelte` (label + desc strings); source-assert unit like the other UX-SET copy rows. **Size: S (copy).**
**Risk:** none functional; label string churn vs any checklist `32` wording — update the checklist in the same PR.
**Recommendation: accept**; bundle with R1's PR.

## R3 — Status → list table inert-looking while OFF

**Proposed behavior:** when R1's predicate holds and the flag is OFF, the Status → list editor renders **read-only + «inactive» badge** — exactly the pattern already shipped for GTD tag → list (`GTD_STAGE_INACTIVE_BANNER` / `GTD_TAG_LIST_INACTIVE_LABEL` in `src/ui/settings/settingsUxVisibility.ts`). Table stays visible (it becomes live again with the flag), editing is disabled with a one-line reason «Edit while Abyss format is ON, or keep these rows for list placement — they no longer drive symbols while OFF».
**Case ID:** `UX-SET-STATUS-OFF-RO`.
**Surface:** `GtdSection.svelte` + reuse of the visibility helpers; unit extends `uxSetPhase2.settingsVisibility.test.ts` family. **Size: S–M.**
**Risk:** minor — owner might need to edit the table while OFF for a future classic migration; answer = flip flag on, edit, flip off (matches R1's message).
**Recommendation: accept**; it closes the «editable but inert» inconsistency the matrix flagged.

## R6 — «Leaving Abyss mode» docs page

Short `docs/pilot/LEAVING-ABYSS-MODE.md` with the safe sequence (matrix §5 note: move data first, then flag off, then sync), linked from the R2 help text and Settings Defaults. Docs-only, no case ID needed.
**Size: S. Recommendation: accept** — it's the artifact the matrix analysis already produced, reformatted for owners.

---

## Owner decision table

| Option | Accept | Reject | Notes / modify |
|--------|:------:|:------:|----------------|
| R1 confirm-once | ☐ | ☐ | |
| R2 rename + copy | ☐ | ☐ | bundle with R1? |
| R3 read-only table | ☐ | ☐ | |
| R6 docs page | ☐ | ☐ | |

Accepted rows become issues referencing this sheet; each PR updates `ABYSS_FIRST_CASES.md` + `TEST_PLAN.md` per DEV_FLOW before code.
