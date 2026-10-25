# Alternate path: GTD stage via Abyss checkbox statuses

**Status:** parked design — not the active plan. Active path for Abyss tag-tree stage **move** is **replace intent** (`docs/pilot/AF-GTD-STAGE-REPLACE.md`) with Option A sync compensation ([#137](https://github.com/semyon-alekseev-noveo/tt-sync/issues/137) / #144).

## Why this doc exists

Abyss Settings → Task statuses lets you add custom symbols (e.g. `[!]` under TO DO / IN PROGRESS). That feels like a clean exclusive “stage” UI. This note records what a **migration off `#type/*` tags** would mean, so it is not mixed into the current tag→list work.

## What would change

| Today (active) | Checkbox-status path |
|----------------|----------------------|
| Stage = Obsidian tag `#type/next` … | Stage = checkbox symbol in `- [?]` |
| Abyss tag-tree DnD adds/removes tags | Tag-tree **cannot** set stage (no `#type/next` to drop on) |
| Sync: `tagListMappings` → TT **list** | Sync: new map `symbol → list` (not today’s `statusMappings` → TT tag) |
| Exclusive stage = sync rewrite (Option A) | Exclusive by construction (one symbol) |

## Why it is not “just enable custom statuses”

1. **Tag-tree DnD** is the Abyss-first gesture for Inbox ↔ Next today. Without stage tags, that gesture has no target unless Abyss gains another exclusive UI (or users only change stage in TickTick / markdown).
2. Abyss status **types** are `todo` / `in-progress` / `done` / `cancelled`. Next vs Waiting are both open tasks — forcing them into todo/wip is a semantic stretch.
3. Current cases AF-5 / AF-7 / `tagListMappings` / pilot presets all assume tags → lists.
4. Mid-state `statusMappings` (char → TT **tag**) must not be reused as list routing without a deliberate redesign (see `docs/pilot/AF-STATUS-AXES.md` §6 when present).

## If PO later chooses this path

1. Freeze `#type/*` stage tags; migrate vault lines to agreed symbols.
2. Add `checkboxStageMappings` (or extend settings): `symbol → listId`.
3. Push: checkbox char → list; Done/Cancelled still complete/cancel.
4. Pull: list → set checkbox char (and clear other stage symbols).
5. Document Abyss UX without tag-tree stage DnD (or wait for Abyss exclusive tag groups / another gesture).
6. New AF cases; deprecate AF-GTD-TAG-ADD.

## Decision (2026-10-25)

Stay on **tags → lists**. Fix DnD by **last mapped stage wins + rewrite vault line** (#137 Option A). Revisit this doc only if PO abandons tag-tree stage UX.
