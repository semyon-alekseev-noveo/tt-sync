# PR 4 — break `main` ↔ `services` (`PluginContext`)

## Meta

| Field | Value |
|-------|--------|
| Gate / epic | `TECH-SYNC-MODULARIZATION` |
| GitHub | [tt-sync #31](https://github.com/semyon-alekseev-noveo/tt-sync/issues/31) / **TECH-CIRC-1** |
| Recorded | 2026-10-22 UTC |
| Base | `feat/tech-sync-modularization-pr3` (PR #36 still open) |
| Status | **open** — PR on `feat/tech-sync-modularization-pr4` (stacks on #36) |

## Inputs

- Prior phase: [`31-pr3-vault-io.md`](31-pr3-vault-io.md)
- Plan: `docs/SYNC_MODULARIZATION.md` § PR 4
- Constraint: extract-only / dependency inversion; no sync behavior change

## Evidence

### Cycle map (before)

| Edge | Direction |
|------|-----------|
| `main.ts` | value-imports `TickTickService` and other `@/services/*` |
| `services/*`, `fileOperation`, `taskParser`, sync phases | imported `TickTickSync` from `@/main` (value or type) |

Runtime stayed mostly type-erased; TypeScript / madge `--ts-config` still reported `main` on cycles through services.

### What moved

| Before | After |
|--------|--------|
| Services typed against `@/main` | `PluginContext` in `src/pluginContext.ts` |
| `TickTickSync` only | `class TickTickSync extends Plugin implements PluginContext` |
| Call sites in services / fileOperation / taskParser / sync phases+lifecycle+vault-io | `import type { PluginContext } from '@/pluginContext'` |
| Service-used modals + `settingsstore` | same port (keeps services→modal→main closed) |
| — | Guard: `src/test/pluginContext.noMainImport.test.ts` |

### Gate

| Check | Result |
|-------|--------|
| `npx vitest run` | **99** files, **687** passed (includes `synchronizationInner.integration.test.ts`, `pluginContext.noMainImport`) |
| `npm run build` | ok (`dist/main.js`) |
| madge runtime `main`+`services` | no circular dependency |
| madge `--ts-config` cycles listing `main.ts` | query / redo / ui only — **not** services |

No live-vault pilot this slice (extract-only; no behavior claim).

## Conclusion

PR 4 dependency inversion is extract-complete: **TECH-CIRC-1** `main` ↔ `services` back-edge removed. Next slice: **PR 5** split `taskParser`, or store ports / timed `vaultDeletion` per plan.

## Checklist

- [x] `PluginContext` port; services do not import `@/main`
- [x] Vitest + build green
- [ ] PR merged into `abyss-mapping` (owner; stacks on #36 / #35 / #34)
- [ ] PR 5 parser split / store ports
