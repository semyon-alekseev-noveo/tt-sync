# #17 — TP-EMPTY-SIDE-GUARD / empty-vault (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `PILOT-BATCH-EDITOR-SAFETY` |
| GitHub | [#17](https://github.com/semyon-alekseev-noveo/tt-sync/issues/17) |
| Recorded | 2026-10-24 ~13:41 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** (`empty-vault` held) |

## Inputs

- `TEST_PLAN.md` **TP-EMPTY-SIDE-GUARD**
- Unit: `src/test/massDeleteGuard.test.ts` EMPTY-SIDE-GUARD
- Prior unsafe attempt (folder park inside/outside vault) aborted; vault restored

## Method (safe)

Physical “move all notes out of the vault” hung or left Dexie `zz-parked-17/*` orphans. For this pass, during one manual `synchronizeNow`:

1. Temporarily stub `vault.getMarkdownFiles()` → `[]` so the deletion scan sees **0** vault ticktick ids (`vaultTrackedCount: 0`) while Dexie still has tasks — same `empty-vault` branch as a true empty scan.
2. Auto-dismiss **Clean up database** with **Cancel** (empty index would otherwise list every Dexie file path).
3. Auto-**Skip deletions this run** on the mass-delete guard modal.
4. Restore `getMarkdownFiles` from the Vault prototype.

No folders renamed. Notes stayed on disk.

## Evidence

| Check | Result |
|-------|--------|
| Guard reason | **empty-vault** |
| Decision | **skip** |
| Dexie tracked | **261** |
| Vault tracked (scan) | **0** |
| Planned task deletions | **223** (held) |
| `deleteTask` attempts | **0** |
| Checkpoint | **held** (`1792848988746` → same) |
| Report | `.tickticksync/reports/deletions-2026-10-24T13-41-34-755Z.md` — excerpt [17-empty-side-guard-report.md](17-empty-side-guard-report.md) |
| After | `getMarkdownFiles().length` **724**; `00 Inbox/abyss-active.md` present |

## Conclusion

EMPTY-SIDE-GUARD holds empty-vault deletions and does not advance the checkpoint when skipped. Close #17 after this PR merges. (`empty-ticktick` side of TP-EMPTY-SIDE-GUARD still **not run** — needs an empty TT snapshot fixture; do not run against a valued account.)

## Checklist

- [x] Plugin **2.0.89**
- [x] empty-vault hold + skip + checkpoint unchanged + report
- [x] Evidence under `PILOT-BATCH-EDITOR-SAFETY/`
- [ ] empty-ticktick half of TP-EMPTY-SIDE-GUARD — **not run**
