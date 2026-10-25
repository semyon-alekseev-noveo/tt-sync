# AF-GTD-TAG-ADD mover-wins — live prove×2 (#144)

## Meta

| Field | Value |
|-------|--------|
| Gate | `ABYSS-NEST-GTD` |
| GitHub | [#144](https://github.com/semyon-alekseev-noveo/tt-sync/pull/144) merged `d4ede1e` |
| Recorded | 2026-10-25 ~14:00–14:02 UTC |
| Build | tip `d4ede1e` **local deploy** to `<pilot-vault>` (BRAT **2.0.90** was still pre-#144 — toast said `first type tag`) |
| Note | `00 Inbox/abyss-active.md` |

## Inputs

- Owner screenshot on BRAT 2.0.90: dual `#type/waiting`+`#type/next`, toast `first type tag` (pre-#144 string).
- Tip toast string is `winning stage`. Deployed `dist/` → plugin folder + Obsidian reload before checks.

## Evidence

### Cleanup sync (tip after deploy)

| Task | Before vault | After `tts-sync` | TT `projectId` |
|------|--------------|------------------|----------------|
| P1 `…65b2` | dual waiting+next | single `#type/next` | TTS-nextAction `…fe46` |
| P2 `…7c37` | dual waiting+next | single `#type/next` | TTS-nextAction `…fe46` |

(Mover while Dexie/TT was waitingFor → `type/next`.)

### Prove 1 — open-note path, P1 next→waiting

| Step | Result |
|------|--------|
| Line `#type/next` only; append `#type/waiting` on disk; `obsidian-cli open` note | — |
| Wait ~5s (no Synchronize) | vault → single `#type/waiting` |
| MCP `get_task_by_id` | `projectId` = TTS-waitingFor `…870da2` |

**Result: pass**

### Prove 2 — independent fixture P2

| Step | Result |
|------|--------|
| Append `#type/waiting` beside `#type/next`; open note | vault → single `#type/waiting` (within ~2s of open) |
| MCP | `projectId` = TTS-waitingFor `…870da2` |

**Result: pass**

## Conclusion

#144 tip works on pilot when **actually deployed**. BRAT 2.0.90 alone does not include mover-wins; owner screenshot matched that build. Need **2.0.91** (or tip copy) for BRAT users.

## Checklist

- [x] Tip string `winning stage` in installed `main.js`
- [x] Prove1 open-note next→waiting
- [x] Prove2 independent task
- [ ] Release bump for BRAT (owner)
