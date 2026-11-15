# 36 — Modal / notice copy review (UX-NOTICE-*)

## Meta
- Date: 2026-11-03
- Trigger: Owner saw `New task created` toasts for tasks that already existed in TickTick (orphan re-attach).
- Cases: `UX-NOTICE-REATTACH`, `UX-NOTICE-MODAL-COPY`
- Status: **unit pass**; owner orphan iter 2 «вроде лучше»; follow-up skip-completed in same tip

## Scope
Owner-facing **modals** under `src/modals/` plus high-traffic sync Notices that misstate create/delete/cache.

## Findings → action

| Surface | Before | Verdict | Action this PR |
|---------|--------|---------|----------------|
| Vault push notice (`newTasks.ts`) | Always `New task created` even on orphan re-attach | **Misleading** | Split: created vs `Reattached existing…` |
| Orphaned TickTick Tasks | `database`; `Add to file & db`; `Delete from ticktick`; bare Cancel | **Jargon / unclear** | `local sync cache`; Add to vault & cache; Delete from TickTick; Cancel (leave…) |
| Clean up database | «database» wipe tone | **Jargon** | Clean up local sync cache |
| Permanently delete deleted tasks | Doubled «deleted»; «database» | **Confusing** | Soft-deleted cache rows wording |
| Latest Changes title | `TicTickSync` typo | **Typo** | TickTickSync |
| Check sync cache Notices | «database» | **Jargon** | local sync cache |
| Mass delete guard / Rematch | Already Skip / Rebind / Apply once + wipe hint | OK | No change |
| Task Deletion Confirmation | Cancel vs Confirm Deletion | OK (glossary) | No change |
| Confirm Full Sync / Password | Caller-supplied | OK | No change |
| Duplicate tasks / lists | Clear abort vs apply | OK | No change |
| File location conflict | Move / Delete / Skip | OK | Deferred polish only |
| Recover deleted tasks | Recover paths clear | OK | Deferred: still says «deleted tasks» vs soft-deleted |
| Sync journal | Diagnostic | OK | No change |
| Default project modal | Classic path | Deferred | Abyss path rarely shows it |
| Misc Notices (login, sync done, move file, …) | Operational | Deferred | Batch later if noise |

## Deferred (not blocking)
- Recover / Purge button microcopy still slightly uneven vs Settings purge label.
- `TaskDeletionModal` title capitalization (`Task Deletion Confirmation`).
- Progress / sync-complete Notices volume (noise, not wrong meaning).

## Checklist
- [x] Analyst cases in `ABYSS_FIRST_CASES.md`
- [x] Unit `uxNoticeReattach.test.ts`
- [ ] Owner tip: force one re-attach (strip marker) → toast says Reattached, not Created — steps in [`50-owner-live-tails-checklist.md`](50-owner-live-tails-checklist.md) §B
- [ ] Owner: open Orphan / Cleanup modals once after Check sync cache (labels match) — same `50` §B

---

## Live glance — 2026-11-14 (2.0.98, pilot)

Runner: agent, live pilot app via `obsidian-cli eval` (notices captured from the Settings popout window, which is the active window — that is where Obsidian renders them).

### B1. Reattach toast (`UX-NOTICE-REATTACH`) — **pass**

Fixture: `10 Projects/Годовые задачи.md`, line «Подумать над областями», marker `6ae8205ad07c7a23f9eed594` removed **only** (title and tags kept), then Synchronize.

- Toast: `Reattached existing TickTick task (marker was missing): Подумать над областями (ID: 6ae8205ad07c7a23f9eed594)` — same old id, **no** «New … created».
- Marker restored on the same line with the **same id**; TickTick stayed at 178 tasks (no dup create).

Control (same sync run): brand-new unique line → `New TickTick task created: PROBE-NOTICE-NEW 2026-11-14T03:00 (ID: 6af7cee77bced317374651bb)`. Probe task deleted afterwards.

### B2. Orphan / cleanup copy (`UX-NOTICE-MODAL-COPY`) — **pass with a label nit**

Maintenance → **Check sync cache** opened the orphan modal:

| Element | Observed copy |
|---------|---------------|
| Title | `No vault link for these TickTick tasks` |
| Meaning | `…they are live in TickTick, but this plugin has no matching ticktick_id in vault lines or the local sync cache.` — **«local sync cache»**, not bare «database» ✅ |
| Restore hint | `After empty-TT / Rematch you may already have the same titles with new ids — then choose Leave alone (do not Add).` |
| Paths heading | `Where Add would put them (not where they already are in the vault)` |
| Prompt | `Leave alone = keep TickTick as-is. Add = write lines (may duplicate). Delete = remove these tasks in TickTick.` |
| Buttons | `Leave TickTick alone` · `Delete in TickTick` · `Add to vault — may duplicate` |

Chose **Leave TickTick alone** (no Add / no Delete). `checkPoint` untouched by Check.

Nits, not blockers:

1. `50-owner-live-tails-checklist.md` still expects the older labels «Add to vault & cache» / «Delete from TickTick»; current labels are `Add to vault — may duplicate` / `Delete in TickTick`. The new ones are clearer — checklist updated in this PR.
2. The orphan row still listed a probe task that had already been deleted in TickTick at the time of the check (stale cache row). Cosmetic; the Check is explicitly a cache diagnostic.
3. The **Reset** notice still says «Local sync database cleared» (see `25-…`) while every Settings/cache string says «local sync cache» — the only remaining «database» in user-facing copy.
