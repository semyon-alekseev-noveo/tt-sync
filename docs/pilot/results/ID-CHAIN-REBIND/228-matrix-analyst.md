# 228 — ID-CHAIN full failure matrix (analyst DoR)

| Field | Value |
|-------|--------|
| Issue | [#228](https://github.com/semyon-alekseev-noveo/tt-sync/issues/228) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) |
| When | 2026-10-29 |
| Status | **DoR ready** — AF stubs + child issues; **no live pass** from this file |
| Inputs | `214-plan-taxonomy-rebind.md`; #215–#217/#223 evidence; #208; dual-analyst briefs A/B/C |

## Chain truth (1 screen)

| Hop | Store | Role |
|-----|-------|------|
| Vault line | `%%[ticktick_id::]%%` | Primary for sync + deletion-guard `presentIds` |
| Vault FM | YAML `ticktick_id:` | Project **parent** only — **not** in guard presentIds today |
| Dexie | `taskId`, `file`, `deleted` | Hub |
| TickTick | API ids | Backup restore often → **new** ids |

| Action | Meaning |
|--------|---------|
| **Skip** | Held plan unused; checkpoint not advanced for deletes |
| **Rebind** | Rewrite/insert vault markers from live Dexie/TT; **never** TT deletes |
| **Apply once** | Execute held deletes — **forbidden** after restore/reset/empty-side |
| **Cancel** | Dismiss Confirm Deletion |
| **detach** | Drop marker; keep checklist text |

Glossary: `217-glossary-rebind.md`.

## Coverage summary

| Status | Meaning |
|--------|---------|
| **COVERED** | AF + evidence (live ×2 or accepted) — do not re-litigate |
| **PARTIAL** | Related ship; wrong fixture or incomplete DoD |
| **UNIT-ONLY** | Code/unit; live still required |
| **OPEN** | Needs AF / child eng |

**Do not re-litigate:** #216 Rebind live ×2 · #223 tag-only live ×2 · #215 archive/TT-gone text-keep live ×2 · #217 Rebind copy (owner 30s open).

## Matrix A — Single-side empty / wiped

| # | AF ID | Status | Forbidden | Expected repair |
|---|-------|--------|-----------|-----------------|
| 1 | `BUG-208-EMPTY-TT-NO-AZ-STRIP` | **UNIT-ONLY** | Apply; Confirm strip AZ | Skip / hold; after TT restore → Rebind; permanent gone → detach |
| 2 | `ID-DEXIE-RESET-NO-WIPE` *(new)* | **OPEN** | Apply post-Reset false vault→TT; orphan strip on 404 | Skip; bootstrap no strip; Rebind after Dexie refill |
| 3 | `ID-EMPTY-VAULT-NO-TT-WIPE` *(new)* | **PARTIAL** (#223/#216/EMPTY-SIDE) | Apply TT wipe for “vault-absent” | Skip; Rebind when notes exist; else leave TT |

## Matrix B — Dual-zero

| # | AF ID | Status | Forbidden | Expected repair |
|---|-------|--------|-----------|-----------------|
| 4 | `ID-DUALZERO-VAULT-DEXIE-EMPTY` *(new)* | **OPEN** | Apply TT wipe | Sync refill Dexie; Skip; Rebind only if destination notes exist |
| 5 | `ID-DUALZERO-STALE-DEXIE` *(new)* | **OPEN** | Apply either way; invent TT from stale Dexie | Skip → **Reset** stale Dexie → restore real side; else irrecoverable |
| 6 | `ID-DUALZERO-VAULT-ONLY` *(new)* | **PARTIAL** (#215) | Confirm wipe text; invent TT from vault | detach / no-op; after TT backup → Rebind |

## Matrix C — TickTick backup restore

| # | AF ID | Status | Forbidden | Expected repair |
|---|-------|--------|-----------|-----------------|
| 7 | `ID-TT-RESTORE-SAME-IDS` *(new)* | **OPEN** | Treat as wipe; Apply | Quiet align; Rebind not required |
| 8 | `ID-REBIND-RESTORE` (+ DEDUP/UX) | **COVERED** (#216) | Apply | Rebind rewrite/insert |
| 9 | `ID-TT-RESTORE-OMITTED` *(new)* + `ID-MISSING-FROM-TT-BACKUP` | **PARTIAL** (#215 detach) | Invent omitted TT tasks; wipe vault text | detach + honest “not in backup” |

## Matrix D — Vault backup restore

| # | AF ID | Status | Forbidden | Expected repair |
|---|-------|--------|-----------|-----------------|
| 10 | `ID-VAULT-RESTORE-MATCH` *(new)* | **OPEN** | Mass TT/vault wipe | Synchronize; wait Obsidian Sync idle |
| 11 | `ID-VAULT-RESTORE-STALE` → #215 | **PARTIAL** | Confirm wipe | detach / Skip |
| 12 | `ID-VAULT-RESTORE-TEXT-ONLY` / `ID-TEXT-NO-MARKER` *(new)* | **OPEN** | Apply TT deletes; dup insert | Held → Rebind bind unmarked lines |
| 13 | `ID-VAULT-RESTORE-CONFLICT` *(new)* | **OPEN** | Blind dual-bind; Apply | Skip/report; deterministic Rebind; owner resolves true dups |

## Matrix E — Residuals

| # | AF ID | Status | Notes |
|---|-------|--------|-------|
| 14 | `ID-TEXT-NO-MARKER` | **OPEN** | Day-to-day unmarked checkbox; default bind via Rebind only |
| 15 | `ID-MISSING-FROM-TT-BACKUP` | **PARTIAL** | Irrecoverable; honest UX |
| 16 | `ID-PROJECT-FM-NOT-PRESENTIDS` | **OPEN** | FM parent ≠ presentIds; false vault-absent (#208) |
| 17 | `ID-NOTEBOOK-RESTORE-SAFE` | **PARTIAL** (`BUG-NOTEBOOK-NO-DELETE`) | Notebook ids out of vault→TT rematch delete set |

## Recommended GitHub children

| Pri | Issue | Scope |
|-----|-------|-------|
| P0 | Keep **#215** (no duplicate) | Empty-TT live ×2 **or** written deferral + risk before epic close |
| P1 | [#230](https://github.com/semyon-alekseev-noveo/tt-sync/issues/230) | Dexie Reset + dual-zero fail-closed (A2 + B4–B6) |
| P1 | [#231](https://github.com/semyon-alekseev-noveo/tt-sync/issues/231) | Vault backup restore identity (D10–D13) |
| P1 | [#232](https://github.com/semyon-alekseev-noveo/tt-sync/issues/232) | Guard index: project FM `ticktick_id` (E16 / #208) |
| P2 | [#233](https://github.com/semyon-alekseev-noveo/tt-sync/issues/233) | TEXT-NO-MARKER + omit-from-backup honesty (E14/E15/C9) |
| P2 | [#234](https://github.com/semyon-alekseev-noveo/tt-sync/issues/234) | Notebook/protected × rebind (E17) |
| — | **#218** | Optional after paths still diverge |
| — | **#217** owner 30s | Owner-only |

**Merge advice:** One empty-TT track (#215), not duplicate P0. C7 = smoke under restore PR, not solo issue.

## Explicit deferrals / non-goals

- Invent TT tasks not in backup  
- Title-only auto-merge as default  
- Apply once after restore/reset  
- #218 before matrix children prove divergence  
- Closing #214 while empty-TT live open **without** written deferral  

**Must not silently defer:** A1 empty-TT live ×2 (historical AZ wipe risk — soak/34).

## Analyst checklist (DoR)

- [x] Matrix A–E complete  
- [x] New AF IDs stubbed in `ABYSS_FIRST_CASES.md`  
- [x] `TEST_PLAN.md` stubs for new IDs  
- [x] Gap list + children  
- [x] Comment on #214 / #228 linking this file  
- [x] Child issues opened (#230–#234)  
- [ ] Owner accepts DoR  

## Conclusion

DoR for #228 ready for owner. Engineering next: empty-TT live (#215), then Reset/dual-zero + vault-restore + FM guard children. No product code in the analyst PR beyond docs/AF/TEST_PLAN.
