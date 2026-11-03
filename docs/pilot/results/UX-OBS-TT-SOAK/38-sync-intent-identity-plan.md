# 38 — Sync intent × identity implementation plan

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Phase | 38 (plan / DoR) |
| Case | `ARCH-SYNC-INTENT-IDENTITY` |
| Status | **plan** — docs + canvas; **#256–#259** code landed (unit); #260–#261 open |
| Debate | [`37-sync-intent-identity-debate.md`](./37-sync-intent-identity-debate.md) (**agreed**) |
| Canvas | IDE: `~/.cursor/projects/.../canvases/sync-intent-identity.canvas.tsx`; repo copy: [`sync-intent-identity.canvas.tsx`](./sync-intent-identity.canvas.tsx) |
| Epic | [#255](https://github.com/semyon-alekseev-noveo/tt-sync/issues/255) |

## Meta

Post-2.0.96 pilot: Rebind does not drain detach-heavy holds; Rebind → Confirm can false-wipe displaced TT ids. Debate #37 converged on **identity/Link apply before destructive planners**, typed intents + precedence, and **mismatch ≠ auto PushDeleteTT**. This phase is the ordered implementation plan; each step is one GitHub issue under the epic.

Process: `DEV_FLOW.md` / `AGENTS.md` — AF case before code; PR into `abyss-mapping` only; do **not** push `abyss-mapping` or `master`; no release/tag from feature branches. Pilot vault only (`<pilot-vault>`).

## Glossary

| EN term | RU meaning |
|---------|------------|
| Link | привязка маркера |
| DetachMarker | снять id, текст оставить |
| InsertLine | вставить строку |
| PullStripVault | убрать строку из vault |
| PushDeleteTT | удалить в TickTick |
| identity pass | проход идентичности до удалений |
| threshold | порог mass-delete |
| Sync discrepancies | окно расхождений |
| precedence | приоритет применения |
| tombstone | пометка вытесненного id (блок wipe в том же прогоне) |
| provenance | происхождение изменения (rewrite ≠ user-removed) |

**Precedence:** Link ≻ DetachMarker ≻ InsertLine ≻ PullStripVault ≻ PushDeleteTT.

**Invariant:** mismatch ≠ auto PushDeleteTT (удалить в TickTick). Threshold (порог mass-delete) counts **destructive** intents only.

## Ordered plan (one GitHub issue per step)

| Step | Issue | Title | Goal |
|------|-------|-------|------|
| 1 | [#256](https://github.com/semyon-alekseev-noveo/tt-sync/issues/256) | Intent types + precedence + destructive-only threshold | Types + unit tests; no sync wiring yet |
| 2 | [#257](https://github.com/semyon-alekseev-noveo/tt-sync/issues/257) | Identity/Link pass before destructive plan + Link tombstones | No false Confirm wipe of rebound/displaced ids |
| 3 | [#258](https://github.com/semyon-alekseev-noveo/tt-sync/issues/258) | Remote-gone → DetachMarker drains hold | Stop Rebind loop on detach-heavy holds |
| 4 | [#259](https://github.com/semyon-alekseev-noveo/tt-sync/issues/259) | One Sync discrepancies UI (held + Confirm) | Copy/wire residual destructives only |
| 5 | [#260](https://github.com/semyon-alekseev-noveo/tt-sync/issues/260) | Check cache uses same intent enumerator | No second wipe dialect |
| 6 | [#261](https://github.com/semyon-alekseev-noveo/tt-sync/issues/261) | Pilot prove ×2 + AF / TEST_PLAN close | Two independent `<pilot-vault>` proofs |

### Step 1 — Intent types + precedence + threshold

- Define typed intents: `Link`, `DetachMarker`, `InsertLine`, `PullStripVault`, `PushDeleteTT` (+ comment siblings if already in tree).
- Encode precedence and “destructive-only” threshold helper.
- Failing then green unit tests named `ARCH-SYNC-INTENT-IDENTITY` (types/precedence/threshold).
- **Out of scope:** live sync path wiring (step 2+).

### Step 2 — Identity pass before destructive plan + tombstones

- Synchronize: prepare → **identity/Link apply with provenance** → re-scan `presentIds` → compile remaining intents → apply by precedence.
- Link tombstones block PushDeleteTT same run (rewrite ≠ user-removed).
- Acceptance: Rebind/Rematch displaced ids must not appear as Confirm wipe targets in the same run.

### Step 3 — Remote-gone → DetachMarker drains hold

- TT-gone in identity pass → DetachMarker (снять id, текст оставить) in-session.
- Must not re-hold after Rebind; detach-heavy holds drain instead of looping (~195 stay held).
- Acceptance: after identity+Rebind path, detach intents are applied or cleared — not re-queued as wipe candidates.

### Step 4 — One Sync discrepancies UI

- Single window for residual **destructives** (held + Confirm): PullStripVault / PushDeleteTT only.
- Align copy with UX-SYNC-ONE-FLOW / glossary (Sync discrepancies = окно расхождений).
- Don’t delete / Rebind / Apply semantics stay; Rebind = Link (+ InsertLine) mode, not a separate wipe dialect.

### Step 5 — Check cache same enumerator

- Check sync cache = rare full scan of the **same** intent enumerator as Synchronize.
- No second wipe dialect; empty Dexie / checkPoint 0 stays fail-closed.
- Unit: same classification for a fixture under Synchronize vs Check path.

### Step 6 — Pilot prove ×2 + close

- Two independent live/pilot checks on `<pilot-vault>` (prefer different fixtures): mixed hold after Rebind must not Confirm-wipe rebound/displaced ids; DetachMarker drains hold.
- Update `ABYSS_FIRST_CASES.md`, `TEST_PLAN.md`, phase evidence under this folder; link both proofs on the epic before close (`bug-prove-twice.mdc`).
- Unit/integration green alone does **not** replace the second live proof.

## Done criteria

1. All child issues merged into `abyss-mapping` (owner merges).
2. `npx vitest run` + `npm run build` green, including synchronizationInner.
3. AF case `ARCH-SYNC-INTENT-IDENTITY` expected behavior matches code; pilot status **pass** only after prove ×2 evidence files.
4. `TEST_PLAN.md` updated in the same PRs that change behavior.
5. No false Confirm wipe of Link-tombstoned / rebound ids; Rebind does not leave detach-heavy holds stuck.

## Non-goals

- Title-matching quality unchanged (conservative; collisions → skip/report).
- No release/tag from this plan PR (docs only).
- No secrets / personal absolute paths in evidence.

## References

- [`37-sync-intent-identity-debate.md`](./37-sync-intent-identity-debate.md)
- [`sync-intent-identity.canvas.tsx`](./sync-intent-identity.canvas.tsx)
- `ABYSS_FIRST_CASES.md` → `ARCH-SYNC-INTENT-IDENTITY`
- `UX-SYNC-ONE-FLOW`, `massDeleteGuard.ts`, `rebindVault.ts`, `deletionGuardRun.ts`, `TaskDeletionHandler.ts`
- `DEV_FLOW.md`, `AGENTS.md`, `.cursor/rules/bug-prove-twice.mdc`
