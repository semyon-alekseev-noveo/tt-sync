# Live regression gate — 2.0.91

## Meta

| Field | Value |
|-------|--------|
| Gate | `REGRESSION-2.0.91` |
| Recorded | 2026-10-25 ~16:04–16:08 UTC |
| Build | **2.0.91** (BRAT / plugin folder manifest) |
| Vault | `<pilot-vault>` Thinkpad-tts-test |
| Note | `00 Inbox/abyss-active.md` |
| Runner | Obsidian CLI (`tts-sync`) + TickTick MCP |

## Inputs

- Cases: AF-5, NOTE-L3b (×2), AF-GTD-STAGE-MOVE, AF-6, AF-7; DEL-1/DEL-3 deferred (modal)
- Stage mappings already `gtd/*` (AF-GTD-PREFIX)
- Fixtures titled `REG91-*-160427`

## Evidence

### AF-5 — `#gtd/next` → TTS-nextAction

| Check | Result |
|-------|--------|
| Id | `6ade28947a7c111f881492f3` |
| `projectId` | TTS-nextAction `6ad1abfe8f08abb10392fe46` |
| Line stays in Inbox note | **yes** + `#gtd/next` |
| Stage not sent as TT tag | tags = obsidian / note/abyss-active / tts-test |

**Result: pass**

### NOTE-L3b / BUG-COMMENT-NO-PUSH — prove×2

| # | Task | Vault bullet | TT Comments title |
|---|------|--------------|-------------------|
| 1 | AF5 `…492f3` on nextAction | `reg91-l3b-160427` | `reg91-l3b-160427` (id `…492f9`) |
| 2 | GTD `…492f4` on waitingFor | `reg91-l3b-b-160427` | `reg91-l3b-b-160427` (id `…492fa`) |

Title unchanged; bullets remain under parents.

**Result: pass** ×2

### AF-GTD-STAGE-MOVE (Option A)

| Step | Result |
|------|--------|
| Seed `#gtd/next` on `REG91-GTD` `…492f4` | nextAction |
| Append `#gtd/waiting` (dual) + Synchronize | vault → single `#gtd/waiting` |
| MCP | `projectId` = TTS-waitingFor `…870da2` |

**Result: pass**

### AF-6 — complete Obs → TT

| Check | Result |
|-------|--------|
| Vault | `- [x] REG91-AF6-…` `…492f7` |
| MCP | `status` **2**, `completedTime` set |

**Result: pass** (Obs→TT). TT→Obs uncomplete **not run** this session.

### AF-7 — TT list move rewrites stage tag

| Step | Result |
|------|--------|
| MCP move `…492f8` nextAction → waitingFor | `projectId` = `…870da2` |
| Synchronize | vault `#gtd/next` → `#gtd/waiting` (same line) |

**Result: pass**

### DEL-1 / DEL-3

**not run** — `TaskDeletionModal` Confirm/Cancel needs interactive Obsidian (same as SMOKE_TESTS Phase C / prior `#76` hook). Owner or agent with modal hook.

## Conclusion

Core live gate on **2.0.91** (AF-5, NOTE-L3b×2, AF-GTD-STAGE-MOVE, AF-6 Obs→TT, AF-7) **pass**. Deletion UX still **not run**.

## Checklist

- [x] AF-5 `#gtd/next`
- [x] NOTE-L3b ×2
- [x] AF-GTD-STAGE-MOVE
- [x] AF-6 Obs→TT
- [x] AF-7 list→tag
- [ ] DEL-1 Confirm
- [ ] DEL-3 Cancel
