# AF-GTD prefix: `type/*` → `gtd/*`

**Status:** implemented in **2.0.91** (AF-GTD-PREFIX).  
**PO (2026-10-25):** stage tags read as GTD (`#gtd/next`), not `#type/next`.

---

## Behavior

On `checkSettingsMigration` (load / prepare sync):

1. Every `tagListMappings` / `tagMappings` LHS matching `type/…` becomes `gtd/…` (same list / TT tag target).
2. Synced vault lines (`%%[ticktick_id:: …]%%`) rewrite `#type/…` → `#gtd/…` via existing `renameTagsInText`.
3. Already-`gtd/` mappings are a no-op.
4. UI placeholder in GTD settings shows `gtd/next = nextAction`.

`inbox` and non-`type/` tags are untouched. Unsynced lines without `ticktick_id` are not auto-rewritten.

## Case

| ID | Expected |
|----|----------|
| **AF-GTD-PREFIX** | After upgrade, mappings and synced lines use `#gtd/next` (etc.); TT list unchanged; new `#gtd/waiting` routes to waitingFor. |

## Code

- `migrateTypeStagePrefixToGtd` / `typeStageToGtd` in `src/settingsMigration.ts`
- Hook in `main.ts` `checkSettingsMigration`
- Tests: `src/test/settingsMigration.test.ts` (`AF-GTD-PREFIX`)

## Pilot

Create Obsidian/Abyss tags under `gtd/` if the tag tree still only has `type/`. Old `type/` stage tags can remain unused.
