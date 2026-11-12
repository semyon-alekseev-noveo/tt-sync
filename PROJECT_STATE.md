# Project state

## CHANGELOG vs this file

| File | Role |
|------|------|
| `CHANGELOG.md` | Append-only iteration history |
| `PROJECT_STATE.md` | Current snapshot (not a second changelog) |
| `PO_STATUS.md` | Product-owner brief (RU); must not drift from this file |

## Status vocabulary

One definition, used here, in `PO_STATUS.md`, in `TEST_PLAN.md`, and in `docs/pilot/results/UX-OBS-TT-SOAK/INDEX.md`.

| Status | Means | Evidence required |
|--------|-------|-------------------|
| `shipped` | In a released tag | GitHub Release + `CHANGELOG.md` row |
| `merged-tip` | Merged to `abyss-mapping`, not released | PR merge SHA |
| `unit-only` | Code + unit green, **live prove not run** | Test file/name |
| `open` | Reproduced, no fix | Repro steps in issue or pilot note |
| `triage` | Filed, no DoR / no expected behavior yet | Issue link |
| `blocked-owner` | Needs a human in Obsidian/TickTick | Checklist in `docs/pilot/results/` |
| `parked` | Owner deferred the decision | Decision note |
| `won't-fix` | Closed not planned | Close reason |
| `risk-accepted` | Known, monitored, no auto-repair | `PO_STATUS.md` |

Project stage is a separate axis: **pilot soak → Step 8 live gate**. The live gate is **closed** (not started).

## Current status (2026-11-12)

| Field | Value |
|-------|-------|
| Stage | Pilot soak on `<pilot-vault>`; Step 8 live-vault gate **closed** |
| Pilot build | **tip `00ff923` declared as the test-vault build** (pilot-only, not a release; supersedes `945d182`, both CI-green) |
| Last release | **2.0.96**, 2026-11-03 (non-prerelease) |
| Branch tip | `abyss-mapping` @ `00ff923` — **unreleased** |
| CI on tip | **GREEN** on `00ff923` and `945d182`; `PROC-CI-CYCLES-RED` fixed (#300, allowlist 118 → 56) |
| Unit tests | **1001 passed / 140 files** on the tip; **1005 / 141** with #202 re-landing |
| Open issues | 16 |
| Open PRs | 0 |

Consequence: the pilot build is now CI-validated, but no release has been cut since 2026-11-03. #202 was merged into the wrong branch (see `PROC-PR-STACK-MISBASE`); it is re-landed by `a6e46ad`.

## Context

- Obsidian plugin fork of [thesamim/TickTickSync](https://github.com/thesamim/TickTickSync); development repo [semyon-alekseev-noveo/tt-sync](https://github.com/semyon-alekseev-noveo/tt-sync) branch `abyss-mapping` (BRAT install; plugin id `tickticksync-abyss`).
- Auth: unofficial web session (cookie / password), **not** TickTick Open API `tp_…` tokens; Cursor MCP uses separate OAuth at `mcp.ticktick.com`.
- Live vault: `<live-vault>`. Test copy: `<pilot-vault>`. Live vault stays frozen on a non-prerelease tag; pilot tracks the branch tip.
- **Direction (2026-10-16):** **Abyss-first** — tasks stay where Abyss puts them; TickTick mirrors tags/lists and project parents. See `ABYSS_FIRST_PLAN.md` (topology R / CASE-T4 parked).
- TT **Projects** ↔ project notes under `10 Projects/`; safety: `syncedLists`, `syncScopeFolders`, manual sync.

## Target

1. **Reliable sync with no silent failure:** any pull/push error is visible; the checkpoint never lies.
2. **Abyss comments and tags stable:** child-line edits and TT-only comment changes land without manual workarounds.
3. **Safe live-vault start:** Step 6 (AF-*) cases and Step 8, plus NOTE-L3b soak, as **one** live run.
4. **Maintainability:** modularization done; remaining extract work is optional (#66 closed, #86 open).
5. **Green CI and a release:** the tip must pass `CI / test` before anything ships to BRAT/live.

## Validation

- Build: `npm run build` in repo root; CI on `abyss-mapping` via `.github/workflows/ci.yml`.
- Unit tests: `npx vitest run` — **997 passed / 140 files** on 2026-11-12. CI also runs `check:cycles` (allowlist may only shrink) and `check:sizes` (≤30 KB or listed).
- **`npm run check` (`tsc --noEmit`) is NOT green and is NOT part of CI:** 35 errors on the tip (e.g. `taskModification/newTasks.ts`, `scan.ts`, `syncModule.ts`, `settingsVaultMigrate.ts`). Treat `tsc` as advisory until someone owns that cleanup; the build (esbuild/vite) does not typecheck.
- Manual pilot: **`SMOKE_TESTS.md`**; palette **Synchronize** only; full TT pull on plugin load. Context tags **2.0.41** (`syncNoteContextTags`).
- Pilot evidence: `docs/pilot/results/`; index `docs/pilot/results/UX-OBS-TT-SOAK/INDEX.md`.
- **Validation debt:** `TEST_PLAN.md` still has ~202 `not run` markers against ~177 `pass` mentions. Many are older sections, but the count is not shrinking by itself — do not read it as coverage.
- BRAT installs: release assets from `.github/workflows/release.yml` (see `docs/BRAT_INSTALL.md`). Publish requires tag = `manifest.json` = `package.json` = `versions.json`, refuses an existing Release, and runs CI `test` first.
- Release **2.0.96** (2026-11-03) is the current shipped baseline. `2.0.95` exists as a tag **without** a GitHub Release; `2.0.94` is the previous published release.

## Problems

Release blocker (resolved):

- **PROC-CI-CYCLES-RED** — `check:cycles` failed on the tip: `pluginContext.ts | services/EventHandlerService.ts | settings.ts | sync/syncEnabled.ts | ui/settings/settingsstore.ts`, introduced by the Sync-off fix (#296). **Fixed 2026-11-12:** `settings.ts` no longer imports the Svelte store; the store registers itself via `registerSettingsStore` (`src/settings.ts`, `src/ui/settings/settingsstore.ts`). Allowlist shrank **118 → 56** (no cycle added; one edge removed). **Merged #300 (`945d182`), CI green** → `merged-tip`.

Process (open):

- **PROC-PR-STACK-MISBASE** — #302 was opened with base `fix/issue-213-status-wipe-guard` (stacked on #301). The owner merged both PRs, but GitHub merged #302 into the *stacked base branch*, not `abyss-mapping`; #301 then merged into `abyss-mapping`. Result: PR #302 shows `MERGED` while its content is absent from the tip (`src/test/uxSetTasksFolderCopy.test.ts` missing on `00ff923`). Rule going forward: after merging a stacked PR, **retarget the child to `abyss-mapping`** (or verify `git show <tip>:<file>`), because "MERGED" is not proof of landing. Re-landed #202 via cherry-pick `a6e46ad` on branch `fix/issue-202-tasks-folder-copy-relaunch`.

Open bugs:

- **BUG-CREATE-MATCH-UNDEF** [#291](https://github.com/semyon-alekseev-noveo/tt-sync/issues/291) — dual Notice on open-note create (`created` + `Failed to add … 'match'`). Fix merged (#293, unit `bugCreateMatchUndef.test.ts`). Live re-prove **not run** → `unit-only`.
- **BUG-TT-TAGFILTER-INBOX** [#299](https://github.com/semyon-alekseev-noveo/tt-sync/issues/299) — task added in a TT tag-filtered view lands in Inbox instead of the linked note. Filed 2026-11-07. Triage 2026-11-12: AF row written, code facts recorded (context tags are push-only; no pull routing by `note/<slug>`; orphan fallback = `00 Inbox/abyss-active.md`). **Product answer pending** (is the tag SoT, slug collisions, `proj/` too) → `triage`.
- **BUG-CONFIRM-REBIND-DUP** — post-#273 Confirm Rebind `InsertLine` dups beside live same-title siblings; `allowDisplaceLiveSameTitle` fix is unit-only, pilot re-prove **not run** (`UX-OBS-TT-SOAK/41-…`) → `unit-only`.
- **BUG-OPENNOTE-DELETE-CONFIRM** — Delete/Backspace mid-edit opened PushDeleteTT Confirm; keyup `deletedTaskCheck` dropped, re-prove **not run** (`UX-OBS-TT-SOAK/42-…`) → `unit-only`.
- **BUG-TT-CREATE-PATH-BYPASS** — create-path audit units pass; pilot path-guard **not run** (`UX-OBS-TT-SOAK/45-…`) → `unit-only`.
- **BUG-RESET-CACHE-DELETE** — post-Reset Synchronize proposed vault-line deletes for pre-wipe ids; ghost detach now expected honesty, owner Reset→Synchronize ×2 still pending (`25-…` / `50-…`) → `blocked-owner`.
- **GTD_ARRAY_KEYS** [#213](https://github.com/semyon-alekseev-noveo/tt-sync/issues/213) — `statusListMappings` was missing from the wipe-guard (`src/settingsMerge.ts`). **Fixed 2026-11-12:** added to `GTD_ARRAY_KEYS`; `wouldWipeGtdFromDisk` now mirrors `preserveGtdFromDisk` over all four arrays. Unit `GTD-ARRAY-KEYS` (3 of 4 new tests fail without the fix). **Merged #301 (`00ff923`), CI green** → `merged-tip` (pilot rows `not run`).

Open UX / product:

- **UX-NOTICE-*** — create vs reattach Notices + modal cache wording; unit on tip, owner strip-marker prove **not run** (`36-…` / `50-…`) → `blocked-owner`.
- **UX-SET-TASKS-FOLDER-COPY** [#202](https://github.com/semyon-alekseev-noveo/tt-sync/issues/202) — GTD «Tasks folder» help read like classic per-list mode. **Fixed 2026-11-12:** `tasksFolderHelp()` returns Abyss copy when scheme + Abyss format + push scope are on; classic copy otherwise. Unit `uxSetTasksFolderCopy.test.ts`. PR #302 was merged into the stacked base `fix/issue-213-status-wipe-guard` instead of `abyss-mapping` (see `PROC-PR-STACK-MISBASE`), so it never reached the tip; re-landed by cherry-pick `a6e46ad` → `merged-tip` once that PR merges (pilot rows `not run`).
- **Project-identity layers** [#243](https://github.com/semyon-alekseev-noveo/tt-sync/issues/243) / [#244](https://github.com/semyon-alekseev-noveo/tt-sync/issues/244) (duplicate: parent scheme vs `proj/` tags vs GTD stage naming) and [#245](https://github.com/semyon-alekseev-noveo/tt-sync/issues/245) (real product decision: parent vs tags-only mode). Tip has **no** tags-only identity mode; parent scheme is SoT → `triage`.
- **FEAT-NOTEBOOK** [#159](https://github.com/semyon-alekseev-noveo/tt-sync/issues/159) — MVP live **pass** ×2; bi-directional still open → `triage`.
- **Abyss status source** [#185](https://github.com/semyon-alekseev-noveo/tt-sync/issues/185) — read `taskStatuses` / `projectStatuses` from the Abyss Tasks plugin settings. Spec only (`docs/pilot/UX-ABYSS-STATUS-SRC.md`), pilot **not run** → `triage`.

Open analysis / perf / process:

- **abyssTasksFormat OFF matrix** [#201](https://github.com/semyon-alekseev-noveo/tt-sync/issues/201) — analysis only; the dangerous combo is *Synchronize while OFF* → `triage`.
- **TECH-START-1** [#86](https://github.com/semyon-alekseev-noveo/tt-sync/issues/86) — register scan / defer full pull + full `.md` walk; `RISK-LARGE-VAULT` remainder → `open`.
- **PILOT-REDO-SOAK** [#78](https://github.com/semyon-alekseev-noveo/tt-sync/issues/78) — redo journal + `Undo last sync` never soaked on a vault → `blocked-owner`.
- **PROC-RELEASE-GATE** [#172](https://github.com/semyon-alekseev-noveo/tt-sync/issues/172) — enable required status check `CI / test` on `abyss-mapping` → `blocked-owner`.
- **Repo hygiene** [#33](https://github.com/semyon-alekseev-noveo/tt-sync/issues/33) — personal path in script, floating deps, docs sprawl → `triage`.

Resolved / closed (keep as history, do not re-open):

- **UX-SET-SYNC-MASTER-OFF** [#287](https://github.com/semyon-alekseev-noveo/tt-sync/issues/287) — `syncEnabled` kill switch + Sync Control toggle; owner live pass (`49-…`) → `resolved`.
- **BUG-SYNC-OFF-REACTIVE-CREATE** [#295](https://github.com/semyon-alekseev-noveo/tt-sync/issues/295) — reactive create/update sealed; prove ×2 on `76cf71c` (first hot-swap run failed and was retained, not counted) → `resolved`.
- **BUG-GHOST-MARKER-AFTER-RESET** [#290](https://github.com/semyon-alekseev-noveo/tt-sync/issues/290) — vault-only + TT-miss → detach; prove ×2 @ `a1946a6` (`51-…`) → `resolved`.
- **BUG-LISTROOT-NOTE-PROMOTE** [#284](https://github.com/semyon-alekseev-noveo/tt-sync/issues/284) — `isSchemeParentTask` rejects note-context without `project`; prove ×2 @ `358690e` (`47-…`), pilot hierarchy recovered (`48-…`) → `resolved`.
- **ARCH-SYNC-INTENT-IDENTITY** [#255](https://github.com/semyon-alekseev-noveo/tt-sync/issues/255) — identity pass before destructive plan; prove ×2 (`39-…`) → `resolved`.
- **UX-SYNC-TT-DEDUPE** [#276](https://github.com/semyon-alekseev-noveo/tt-sync/issues/276) — closed not planned; prevention (#279+#280+#281) + orphan cleanup instead → `won't-fix`.
- **Settings UX epic** [#189](https://github.com/semyon-alekseev-noveo/tt-sync/issues/189) — phases 0–4 (#190–#194) + #205 closed → `resolved`.
- **ID-CHAIN children** #208, #215–#217, #223, #228, #230–#234 → closed; epic [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) stays open **only** for optional [#218](https://github.com/semyon-alekseev-noveo/tt-sync/issues/218).
- **RISK-PULL-WINS-LOCAL** [#174](https://github.com/semyon-alekseev-noveo/tt-sync/issues/174) / **RISK-DUAL-STORE** [#175](https://github.com/semyon-alekseev-noveo/tt-sync/issues/175) — closed with unit-only coverage, pilot never run → `risk-accepted` (see `PO_STATUS.md`).
- **TECH-API-1** — live API risk stays in `PO_STATUS.md`; not closed by tests.
- Comments family #25/#27/#28/#29 resolved on 2.0.76/2.0.79/2.0.80 and proved on 2.0.89.
- Pilot `taskIgnoreQuery: #ticktick` leftover from superseded Option B — blocks Abyss edit on TT-origin project notes (`parked` until owner needs Abyss on TT-origin / before Step 8).
- Decision #1 Abyss vs `#ticktick` — `parked`; tip still stamps note `#ticktick` (`06-…`).

## To Be Done

Ordered. Do not start Step 8 before 1–3 are green.

1. **PROC-CI-CYCLES-RED:** fix is in the working tree (see Problems). Push it, get `CI / test` green on `abyss-mapping`. Until then the tip is unreleasable.
2. **[done 2026-11-12] Pilot declaration:** tip `945d182` (green CI) is the declared test-vault build. No release is cut; live vault stays on 2.0.96. Revisit when a tag is wanted.
3. **Close the proof tails** (owner, `docs/pilot/results/UX-OBS-TT-SOAK/50-owner-live-tails-checklist.md`):
   - `41-…` Confirm Rebind dup — prove ×2 on different fixtures.
   - `42-…` open-note Delete/Backspace — prove ×2.
   - `25-…` Reset → Synchronize ×2 (ghost detach is now expected honesty).
   - `36-…` strip-marker reattach toast + Orphan glance.
   - #291 live create Notice (unit already green).
4. **#299** `BUG-TT-TAGFILTER-INBOX` — **triaged 2026-11-12** (AF row + code facts + open questions in the issue). Next: one MCP read of the repro task's `tags`/`parentId` to pick scenario A (TT keeps the tag) or B (bare task), then answer the 4 product questions. No code before that.
5. **Collapse #243/#244** into one doc/UX issue and keep #245 as the single product decision (parent vs tags-only).
6. **#213** — **merged 2026-11-12** (#301, `00ff923`, CI green) → `merged-tip`. Pilot rows in `TEST_PLAN.md` stay `not run`.
7. **#202** — **re-landing 2026-11-12**: PR #302 merged into the stacked base, not the tip (`PROC-PR-STACK-MISBASE`). Cherry-pick `a6e46ad` is open for merge; pilot rows stay `not run`.
8. **#172** enable required `CI / test` on `abyss-mapping` so a red tip cannot be merged again.
9. **Optional / parked:** #218 (or close #214), #185, #159, #201, #86, #78, #33.
10. **Step 8 live gate** — only after 1–3 and after the parked Decision #1 config is cleared (`taskIgnoreQuery`).

## Doc drift fixed in this rewrite

- #295 / #287 / #290 / #284 were listed as open or "pending close" — all four are **closed** with prove ×2.
- "Published tag 2.0.94" was stale — latest release is **2.0.96**.
- `PO_STATUS.md` (2026-10-28, Validation stops at 2.0.90) is now the oldest status file and needs a refresh pass.
- `UX-OBS-TT-SOAK/INDEX.md` has row `52` duplicated and still marks #295 prove as "not run".
- CI red was not recorded anywhere in the status docs.

## References

Canonical:

- `DEV_FLOW.md` — process for analyst, developer, and tester
- `PO_STATUS.md`
- `ABYSS_FIRST_PLAN.md` — Steps 1–8
- `ABYSS_FIRST_CASES.md`
- `TEST_PLAN.md` — manual cases for each behavior-changing PR
- `PROJECT_STATE.md`
- `CHANGELOG.md`
- `SMOKE_TESTS.md`
- `ABYSS_NOTES_ALIGNMENT.md`
- `ABYSS_MAPPING.md`
- `docs/TICKTICK_DELTA_API.md` — delta API, echo/`etag`, comment gaps, recommended sync shape
- `docs/SYNC_MODULARIZATION.md` — module boundaries, phase list, PR 1–7 sequence
- `docs/ANALYST_REFERENCE_DIAGRAMS.md` — analyst layer diagram (bug routing)
- `TODO.md`

Archive (not requirements): `GTD_SYNC_CASES.md`, `GTD_SYNC_RESEARCH.md`, `TT_ABYSS_ROADMAP.md`, `SYNC_PROJECTS_AND_SUBTASKS.md`.

Pilot notes live in the vault, not in this repo: `<pilot-vault>/00 Inbox/TTS-SETUP.md`.
