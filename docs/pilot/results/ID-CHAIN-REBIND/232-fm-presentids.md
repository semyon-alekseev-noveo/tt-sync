# 232 — Project FM ticktick_id ≠ presentIds

| Field | Value |
|-------|--------|
| Issue | [#232](https://github.com/semyon-alekseev-noveo/tt-sync/issues/232) |
| Epic | [#214](https://github.com/semyon-alekseev-noveo/tt-sync/issues/214) / [#228](https://github.com/semyon-alekseev-noveo/tt-sync/issues/228) E16 |
| Status | **unit pass**; live **not run** |
| Inputs | `228-matrix-analyst.md`; #208 |

## AF

| AF ID | Unit | Live |
|-------|------|------|
| `ID-PROJECT-FM-NOT-PRESENTIDS` | **pass** | **not run** |

## Behavior

- Guard `presentIds` = inline `%%[ticktick_id::]%%` in note **body** only.
- YAML `ticktick_id:` (project parent) is stripped via `stripYamlFrontmatter` before collect.
- Markers accidentally inside the FM fence are ignored.
- Missing AZ child markers still plan vault→TT deletes (parent skipped via `isParent`); FM alone does not clear children.

## Code

- `collectLineMarkerPresentIds` / `stripYamlFrontmatter` in `vaultDeletionScan.ts`
- Tests: `idProjectFmNotPresentIds.test.ts`

## Checklist

- [x] Unit
- [x] AF + TEST_PLAN
- [ ] Live tip (optional: project note FM + stripped AZ → hold children, not cleared by FM)
- [ ] Comment #232
