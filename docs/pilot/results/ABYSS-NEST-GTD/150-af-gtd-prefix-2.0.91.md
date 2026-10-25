# AF-GTD-PREFIX — live prove (2.0.91 tip)

## Meta

| Field | Value |
|-------|--------|
| Build | **2.0.91** tip deploy to `<pilot-vault>` |
| Recorded | 2026-10-25 ~14:32 UTC |

## Evidence

### Before reload

`tagListMappings`: `type/next|planned|waiting|someday` → TTS-* lists.

### After reload + Synchronize

| Check | Result |
|-------|--------|
| `data.json` mappings | `gtd/next|planned|waiting|someday` |
| Synced lines in `abyss-active.md` | `#gtd/waiting` / `#gtd/next` (no `#type/` on AF rows sampled) |
| Plugin manifest | **2.0.91** |

**Result: pass** (unit suite + this vault migrate). Second independent check: multiple AF fixture lines all rewritten in the same run.

## Conclusion

AF-GTD-PREFIX ready for release tag after PR merge.
