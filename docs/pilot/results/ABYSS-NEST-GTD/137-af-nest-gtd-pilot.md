# AF-NEST-1 + AF-GTD-TAG-ADD — pilot discovery (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `ABYSS-NEST-GTD` |
| GitHub | [#137](https://github.com/semyon-alekseev-noveo/tt-sync/issues/137) (GTD-tag-add gap) |
| Recorded | 2026-10-25 ~06:04–06:05 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Runner | Obsidian CLI (`tts-sync`) + TickTick MCP `get_task_by_id` |
| Note | `00 Inbox/abyss-active.md` |

## Inputs

- Cases: **AF-NEST-1**, **AF-GTD-TAG-ADD** in `ABYSS_FIRST_CASES.md`
- `gtdStageVia=list`; `tagListMappings` type/next→TTS-nextAction, type/waiting→TTS-waitingFor
- Simulated Abyss nest via markdown indent; simulated Abyss tag-tree by appending a second stage tag

## Evidence

### AF-NEST-1 — nest sibling → TT subtask

| Step | Result |
|------|--------|
| Create siblings + Synchronize | parent `6add9bff…438`, child `…439` on TTS-Inbox (`6ad1abfe…fe45`) |
| Indent child under parent + Synchronize | journal `obs->tt` **move** `parentId` → `…438` |
| MCP child | `parentId` = `6add9bff1f5f961f886fe438`; `projectId` unchanged; parent `childIds` contains child |
| Vault | nested checkbox kept; stage tags not involved |

**Result: pass** (matches expected hierarchy behavior).

### AF-GTD-TAG-ADD — dual stage tags

| Step | Result |
|------|--------|
| Seed `#type/next` + Synchronize | id `6add9c001f5f961f886fe43a` on TTS-nextAction (`…fe46`) |
| Append `#type/waiting` (keep `#type/next`) + Synchronize ×2 | vault line still `#type/next #type/waiting` |
| MCP after | still `projectId` = TTS-nextAction; **no** move to waitingFor; stage tags not on TT (list mode) |

**Result: fail vs desired** (stage replace + list move). Current engine: `listForTags` = first mapped tag → stays on nextAction; vault is not rewritten to a single stage tag.

## Analysis

1. **GTD is not TickTick-only.** Obs→TT works when the line has **one** stage tag (AF-5). TT→Obs rewrite works (AF-7). Pain is Abyss UX: tag-tree drag **adds** tags; sync does not promote “last assigned stage” or strip extras on the vault line.
2. **Workarounds today:** change stage in TickTick (list move → AF-7 rewrites vault tag); or manually delete the old `#type/*` in Obs before/after; or use a single-stage habit outside Abyss tag tree.
3. **Product options (next):** (A) on push, keep **last** / **rightmost** stage tag and rewrite the vault line; (B) treat mapped stage tags as exclusive set (strip others on sync); (C) command / Abyss hook “set GTD stage” that replaces; (D) document TT as preferred stage UI until A–C.
4. Nest path is already usable for task→subtask in Inbox; project Active Zone nest under a **sibling** still overrides MOC parent (documented earlier) — separate soak if needed.

## Checklist

- [x] AF-NEST-1 create + nest + MCP parentId
- [x] AF-GTD-TAG-ADD dual tags + MCP list
- [x] Honest fail on desired GTD replace UX
- [ ] Code fix — not in this PR
