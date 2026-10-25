# AF-GTD prefix: `type/*` → `gtd/*` (planned)

**Status:** backlog / migration plan — **not implemented** until a dedicated PR.  
**PO (2026-10-25):** stage tags should read as GTD, e.g. `#gtd/next`, `#gtd/waiting`, not `#type/next` (clarity of purpose; `type/` collides with document taxonomy).

---

## Why

- `#type/*` in the vault is easy to confuse with note/frontmatter “type” taxonomy.
- Stage tags only exist to drive **GTD list routing** (`tagListMappings` → TickTick lists). Prefix `gtd/` states that.

## Engine note (no hardcode today)

Runtime routing uses **`tagListMappings` left-hand side** as opaque strings. There is **no** hard requirement that the prefix be `type/`. Changing the mapping table is enough for new tasks.

Renaming an existing mapping row **while keeping `listId`** already triggers vault rewrite of **synced** lines (`tagRenames` / `renameTagsInText` in `settingsMigration.ts`) — only lines with `%%[ticktick_id:: …]%%`, outside fences.

## Target mapping (pilot example)

| Old Obsidian tag | New | TickTick list (unchanged) |
|------------------|-----|---------------------------|
| `type/next` | `gtd/next` | TTS-nextAction / nextAction |
| `type/waiting` | `gtd/waiting` | TTS-waitingFor |
| `type/someday` | `gtd/someday` | TTS-someDay |
| `type/planned` | `gtd/planned` | TTS-Planned |
| `inbox` (if mapped) | keep or `gtd/inbox` — **decide in PR** | TTS-Inbox |

Leaf names (`next`, `waiting`, …) stay; only the **namespace** changes.

## Migration steps (future PR)

1. **Analyst:** update AF-5 / AF-7 / AF-GTD-* examples to `#gtd/…`; add case **AF-GTD-PREFIX** (below).
2. **Settings:** edit `tagListMappings` LHS (same `listId`); save → plugin rewrites synced lines.
3. **Pilot vault:** create Abyss/Obsidian tags `gtd/next` etc.; retire or leave unused `type/*` stage tags.
4. **Presets / docs:** `TTS-data-preset`, GTD UI placeholders (`GtdSection.svelte`), `TEST_PLAN`, BRAT notes.
5. **Unsynced lines** (no ticktick_id): manual or one-shot vault script — out of automatic rename.
6. **Prove×2** on pilot: AF-5 with `#gtd/next`; AF-GTD-STAGE-MOVE next↔waiting under `gtd/`.

## Case (catalog draft)

| ID | Expected |
|----|----------|
| **AF-GTD-PREFIX** | After mapping rename `type/next`→`gtd/next` (same listId), a synced line that had `#type/next` shows `#gtd/next`; TickTick list unchanged. New checkbox with `#gtd/waiting` routes to waitingFor. |

## Non-goals

- Do not rename TickTick **list** names.
- Do not change Option A exclusivity rules.
- Do not require Abyss; any editor that writes `#gtd/next` on a checkbox line is enough.

## References

- `src/settingsMigration.ts`, `docs/pilot/AF-GTD-STAGE-REPLACE.md` (Option A kept)
- PO decision 2026-10-25 (chat) + issue #147
