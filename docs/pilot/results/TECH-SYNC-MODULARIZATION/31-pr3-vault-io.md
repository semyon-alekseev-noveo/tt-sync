# PR 3 — vault-io facade

## Meta

| Field | Value |
|-------|--------|
| Gate / epic | `TECH-SYNC-MODULARIZATION` |
| GitHub | [tt-sync #31](https://github.com/semyon-alekseev-noveo/tt-sync/issues/31) |
| Recorded | 2026-10-22 UTC |
| Base | `feat/tech-sync-modularization-pr2` (PR #35 still open) |
| Status | **open** — [PR #36](https://github.com/semyon-alekseev-noveo/tt-sync/pull/36) on `feat/tech-sync-modularization-pr3` (stacks on #35) |

## Inputs

- Prior phase: [`31-pr2-lifecycle.md`](31-pr2-lifecycle.md)
- Plan: `docs/SYNC_MODULARIZATION.md` § PR 3
- Constraint: extract-only; no write/defer/cache behavior change

## Evidence

### What moved

| Before | After |
|--------|--------|
| `src/services/vaultWrite.ts` (implementation) | `src/sync/vault-io/vaultWrite.ts` |
| `src/sync/fileRunCache.ts` (implementation) | `src/sync/vault-io/fileRunCache.ts` |
| `src/sync/pendingMarkerTaskIds.ts` (implementation) | `src/sync/vault-io/pendingMarkerTaskIds.ts` |
| Call sites imported three paths | Facade `@/sync/vault-io` (`index.ts`); push/pull/orchestrator updated |
| — | Thin re-exports at old paths for transitional compile |

`writeTrace` / `vaultIdScan` keep deep imports of `fileRunCache` to avoid barrel cycles with `vaultWrite`.

### Gate

| Check | Result |
|-------|--------|
| `npx vitest run` | **98** files, **686** passed (includes `synchronizationInner.integration.test.ts`, `noWholeNoteWrite`, vault write / cache suites) |
| `npm run build` | ok (`dist/main.js`) |

No live-vault pilot this slice (extract-only; no behavior claim).

## Conclusion

PR 3 vault-io facade is extract-complete. Next slice: **PR 4** — see [`31-pr4-plugin-context.md`](31-pr4-plugin-context.md).

## Checklist

- [x] Implementations under `src/sync/vault-io/`
- [x] Facade `index.ts`; push/pull import from `@/sync/vault-io`
- [x] Vitest + build green
- [ ] PR merged into `abyss-mapping` (owner; stacks on #35 / #34)
- [x] PR 4 main↔services — [`31-pr4-plugin-context.md`](31-pr4-plugin-context.md)
