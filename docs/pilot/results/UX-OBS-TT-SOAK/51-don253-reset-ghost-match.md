# 51 — DON-253 after Reset→Sync (ghost markers + create `.match`)

## Meta

| Field | Value |
|-------|--------|
| Date (UTC) | 2026-11-05 fail → **2026-11-06** tip prove ×2 |
| Vault | Thinkpad-tts-test |
| Build | tip **2.0.96** @`a1946a6` (merge [#293](https://github.com/semyon-alekseev-noveo/tt-sync/pull/293)) |
| Runner | agent (CLI + MCP) after owner merge |
| Cases | `BUG-GHOST-MARKER-AFTER-RESET` (#290), `BUG-CREATE-MATCH-UNDEF` (#291) |
| Result | Ghost detach live **pass** ×2; create `.match` live **not run** (unit **pass** in #293) |

## Inputs

- Owner Reset→Sync item 2 report (RU) — live **fail** 2026-11-05 (`50-don253-reset-ghost-match.md`).
- Fix PR [#293](https://github.com/semyon-alekseev-noveo/tt-sync/pull/293) merged into `abyss-mapping`.
- Note fixtures: `30 Tasks/301 Noveo_tasks/DON-253.md`; prove2 `30 Tasks/303 Личные задачи/Законспектировать-обучение-грудная-клетка.md`.

## Evidence (live fail — 2026-11-05)

- On disk after incident: Cutover/Validation lines still carry `%%[ticktick_id:: 6ad332…]%%` except Remove tcp-services → `6aec900783c55223f9dcb7ad`.
- MCP: sampled `6ad3324d…` / `6ad33250…` / `6ad33254…` / `6ad3325080c8b04a254e810d` → `resource_not_found`.
- MCP: `6aec900783c55223f9dcb7ad` **exists** (inbox; tags `note/don-253`, `obsidian`, `inbox`).
- Journal `2026-11-05.jsonl`: one `obs→tt` create at `14:17:43Z` (title Remove tcp-services…); commit id `6aec9007…`.
- No `%%tt-detached%%` on DON-253. «1 gone» toast aligned with other notes, not bulk DON-253 detach.

## Root cause (fix — #293)

1. **Ghost markers:** `ID-TT-GONE-DETACH` / post-Reset orphan path skipped strip but **left** vault-only markers when Dexie miss + TT 404. Fix: **detach** (`%%tt-detached%%`, text kept); never invent TT; still never Confirm-wipe (`BUG-RESET-CACHE-DELETE`).
2. **`.match` toast:** editor-path create wrote vault but did not `fileMap.replaceLines` → `getTaskRecord(newId)` index -1 → `abyssRegionEnd` → `indentWidth(undefined).match` → outer «Failed to add… not modified» after create Notice. Fix: sync fileMap on successful editor write; harden abyssRegionEnd; post-create errors must not say «not modified».

## Tip deploy (2026-11-06)

- `npm run build` → pilot `tickticksync-abyss`; `plugin:reload` → enabled **2.0.96**.
- Deployed `main.js` contains `BUG-GHOST-MARKER-AFTER-RESET` / `detach vault-only gone`.

## Evidence (live pass ×2 — ghost detach)

### Prove 1 — DON-253 (Synchronize; Dexie already miss for ghosts)

- Pre: nine `6ad332…` markers still fake-live; MCP 404 on samples; live `6aec9007…` present in Dexie + TT.
- `obsidian command id=tickticksync-abyss:tts-sync` (~06:53–06:54Z).
- Post: all nine ghosts → `[-]` + `%%tt-detached%%` (text kept); `6aec9007…` kept on Remove tcp-services.
- Journal `2026-11-06.jsonl`: no `obs→tt` create for those titles; no Apply once.
- Same sync also detached other vault-only `6ad332…` ghosts elsewhere (side effect of tip honesty).

### Prove 2 — independent fixture (second Synchronize)

- Planted one known-404 marker on Законспектировать… (`6ad332ab80c8b04a254e81a5`, MCP 404; Dexie miss).
- Second `tts-sync` (~06:55–06:56Z).
- Post: line → `[-]` + `%%tt-detached%%`; text kept; journal no create for that title; DON-253 unchanged (still honest).

## Create `.match` (#291)

- Unit **pass** in #293 (`bugCreateMatchUndef.test.ts`).
- Live open-note create dual-Notice re-prove **not run** this session (optional; avoided inventing TT on pilot).

## Checklist

- [x] Issues filed (#290, #291)
- [x] AF + TEST_PLAN rows
- [x] Unit + fix PR (#293 merged)
- [x] Live prove ×2 ghost detach after tip
- [ ] Live create `.match` prove (optional / still open on #291)
