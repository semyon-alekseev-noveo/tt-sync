# AF-GTD-TAG-ADD Option A — pilot prove×2

## Meta

| Field | Value |
|-------|--------|
| Gate | `ABYSS-NEST-GTD` |
| GitHub | [#137](https://github.com/semyon-alekseev-noveo/tt-sync/issues/137) / merge [#140](https://github.com/semyon-alekseev-noveo/tt-sync/pull/140) + tip hotfix `stageNeedsPushDespiteHash` |
| Recorded | 2026-10-25 ~12:20–12:26 UTC |
| Build | tip after #140 + hash-stuck fix (local deploy to `<pilot-vault>`) |
| Note | `00 Inbox/abyss-active.md` |

## Inputs

- Option A: last mapped stage wins list; vault rewrite to one stage tag.
- Hotfix: hash-unchanged path must still push when dual stage tags or list≠Dexie.

## Evidence

### Prove 1 — `AFGTD-P1-121945`

| Step | Result |
|------|--------|
| Create `#type/next` + sync | id `6addf3ef14aabb1f881b65b2` on TTS-nextAction (`…fe46`) |
| Append `#type/waiting` (DnD-add sim) | dual tags on line |
| First syncs on #140-only tip | **stuck**: `lineHash` matched dual line; TT stayed nextAction |
| Deploy hash-stuck fix + sync | vault → single `#type/waiting`; TT `projectId` = TTS-waitingFor `…870da2` |

**Result: pass** (with hash-stuck fix)

### Prove 2 — `AFGTD-P2-122502` (independent fixture)

| Step | Result |
|------|--------|
| Create `#type/next` + sync | id `6addf52f5aaacc1f88777c37` on nextAction |
| Append `#type/waiting` + sync | vault single `#type/waiting`; TT `…870da2` waitingFor |

**Result: pass**

## Conclusion

AF-GTD-TAG-ADD Option A works on pilot for Inbox↔Waiting style stage add. **Do not ship #140 alone** without the hash-stuck follow-up — prove1 demonstrated the residual.

## Checklist

- [x] Prove1 MCP list + exclusive vault tag
- [x] Prove2 independent fixture
- [ ] Hotfix PR merged into `abyss-mapping`
- [ ] Close #137 after hotfix merge
