# Step 8 — live-vault gate runbook (one sitting)

**Status:** preparation only — **the gate is CLOSED** until the Preconditions box is all green.
**Executor:** the owner, or a local agent driving Obsidian on the owner's machine. A cloud agent must not record any result here.
**Vault:** `<live-vault>` (Thinkpad). `<pilot-vault>` used only for the pre-flight soak below.
**Time estimate:** 60–90 min including two syncs and the soak.

---

## 0. Preconditions (resolve before starting)

- [x] Required-CI gate on `abyss-mapping` (#172) — ruleset 27795106, verified 2026-11-21.
- [x] All proof tails closed: `25`/`36` (#317), `41` (#318), `42` (#319), `#291` (#320), `#305`/`#306` live ×2 (#316/#324).
- [x] Regression fixes shipped and live-proven up to release **2.0.99** (pilot = live candidate bytes `a3113a4b…`).
- [ ] **#202 glance** — Abyss-mode «Tasks folder» copy confirmed by eye (TEST_PLAN row), else fix before Step 8.
- [ ] **Decision #1** — `#ticktick` vs Abyss: decide whether the live config keeps `taskIgnoreQuery` unset (current pilot state: `null`; tip still stamps note `#ticktick` per `06-…`). Record the decision in `ABYSS_FIRST_CASES.md` § Decision #1 and in live `data.json` before first sync.
- [ ] **NOTE-L3b + CTX-D2 soak** — the two remaining pilot cases run on `<pilot-vault>` **in this same sitting, before** touching live (they are part of the combined gate, not separate tickets).
- [ ] Live vault backup exists and is restorable (tar or file-versioning), taken at the moment of install.
- [ ] Credentials per plan **8.0**: session cookie only, no `tp_…` in anything, autologin off preferred; if on — exclude the plugin `data.json` from any vault file sync.

## 1. Install (live vault)

1. BRAT add `tickticksync-abyss` from `semyon-alekseev-noveo/tt-sync` — pinned **2.0.99** release, not prerelease.
2. Verify bytes: `sha256(main.js)` = `a3113a4b…88e347`.
3. Do **not** enable sync yet; apply the production preset (plan **8.1**): real list names in `syncedLists`, `syncScopeFolders` = the production folders, `syncEnabled` stays **false** (manual Synchronize only for the whole gate).

## 2. Pilot pre-flight (same sitting, `<pilot-vault>`)

1. NOTE-L3b (child comment line, title unchanged → TT Comments, description stays body) — record in `ABYSS_FIRST_CASES.md` results log.
2. CTX-D2 (dirty-tag task re-sync) — same.
3. Any fail → **stop**, file, fix on a branch; the live vault is not touched.

## 3. Live gate run (plan 8.2 — one pass of AF-*, DEL, NOTE-L3b on live)

Run in this order; record each row pass/fail/not-run in the results log (`docs/pilot/results/STEP8-LIVE-GATE/`, create on first run) and mirror the tick into `ABYSS_FIRST_CASES.md`.

| # | Case | What to do | Pass = |
|---|------|------------|--------|
| 1 | AF-1 | New checkbox in a scoped note, manual Synchronize | task lands in the mapped production list; marker written; one Notice |
| 2 | AF-2 | Edit title + tags on a synced line | update lands; no duplicate task |
| 3 | AF-3 | Reparent a line (Abyss nest) | TT `parentId` follows (see 137b) |
| 4 | AF-4 | Delete a whole synced line, then Synchronize | **only here** may PushDeleteTT Confirm appear; choose Apply once → task deleted in TT — or Don't delete to keep |
| 5 | AF-5 | `#gtd/*` stage tag change | mover-wins list + exactly one stage tag |
| 6 | AF-6 | TT-side title/comment change → Synchronize | lands in the note, comment thread updated (NOTE-BODY paths intact) |
| 7 | AF-7 | Out-of-scope folder line | untouched |
| 8 | AF-8 | Empty checkbox | not pushed |
| 9 | DEL | After Reset cache (if exercised): Sync ×2 | no invented deletes (25-… behavior) |
| 10 | NOTE-L3b | Live-vault version of §2.1 | comment in TT panel, body stays |

Between rows: check «Sync completed» notice, no silent red Notice (fail-closed is the product).

## 4. Stop conditions

- Any PushDeleteTT/Sync discrepancies modal you cannot explain from the case table → **Don't delete**, stop, record, bring back to pilot.
- Journal shows `create` for a task that should have re-attached → stop (dup-create family, #279–#281 behavior should prevent; if not — stop).
- Any Notice «Sync failed» → checkpoint is honest and held (fail-closed); note the message, re-run once, then stop.

## 5. Rollback

1. Plugin: **Undo last sync (preview first)** → apply if the plan matches the damage (journal `53-…`/`redo` — note: redo journal is **not yet soaked on live**; prefer step 2 for anything structural).
2. Vault: restore the §0 backup file-set.
3. Cache: Settings → Maintenance → Reset local sync cache; then re-Synchronize only after root cause is on a branch.
4. TickTick: tasks created during a failed run are deleted by hand (they are few by construction — the gate is short).

## 6. Sign-off (plan Step 8 «Done when»)

- PO signs in `PO_STATUS.md` (add a dated line under To Be Done #11).
- Live vault: `syncEnabled` may then be set **true** with the usual interval — owner choice, recorded in the results dir with the final `data.json` keys (no values).
- Close/refresh: this file gets a §7 «Run log» only after the run; never fill rows from CI or inference.

---

Open dependency notes: `#78` redo-soak on the live vault remains **not run** — §5 prefers backup restore over undo until it is soaked; R1–R3 of #201 (`FMT-OFF-R1-R3-DECISIONS.md`) do not gate Step 8 but R1 makes a future accidental flag-flip on live self-protecting.
