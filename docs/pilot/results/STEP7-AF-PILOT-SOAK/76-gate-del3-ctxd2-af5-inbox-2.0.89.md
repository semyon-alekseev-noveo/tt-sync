# #76 — STEP7-GATE DEL-3 / CTX-D2 / AF-5 Inbox (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `STEP7-AF-PILOT-SOAK` |
| GitHub | [#76](https://github.com/semyon-alekseev-noveo/tt-sync/issues/76) (parent [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20)) |
| Recorded | 2026-10-25 ~03:57–04:00 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** (three rows in one session) |

## Inputs

- Issue [#76](https://github.com/semyon-alekseev-noveo/tt-sync/issues/76)
- Note: `00 Inbox/abyss-active.md` (Abyss Inbox capture)

## Evidence

### AF-5 Inbox (`#type/next` variant)

1. Added `- [ ] AF-76 af5-inbox 035600 #type/next #inbox …`
2. Synchronize → id **`6add7e304de4201f884a6a51`**

| Check | Result |
|-------|--------|
| TT list | TTS-nextAction |
| Line still in Inbox note | **yes** |
| `#inbox` on line after sync | **not kept** (same as #72 AF-5; `#type/next` + `#note/…` remain) |

### CTX-D2

1. Seeded with **two** `#note/abyss-active` hashtags on one line.
2. Synchronize → id **`6add7e304de4201f884a6a50`**; line has **exactly one** `#note/abyss-active`.
3. TT tags: one `note/abyss-active` (plus `obsidian`/`inbox`/`tts-test`).
4. Second Synchronize (with DEL-3 Cancel): line content unchanged (only line number shifted).

### DEL-3

1. Seeded `AF-76 del3 035600` → id **`6add7e304de4201f884a6a4f`**.
2. Removed the vault line; hooked Cancel on TaskDeletionModal; Synchronize.
3. Modal **Cancel** clicked (`__af76_del3_cancelled`); `deleteTask` count **0**.

| Check | Result |
|-------|--------|
| TT task after Cancel | still present, status **0** |
| Vault line | gone (expected after local delete) |
| API deletes | **0** |

## Conclusion

Gate rows DEL-3, CTX-D2, and AF-5 Inbox (type/next) **pass** on **2.0.89**. Close #76. Epic #20 AF case pilots + this gate are done; Step 8 live vault still closed. Next backlog: [#19](https://github.com/semyon-alekseev-noveo/tt-sync/issues/19).

## Checklist

- [x] DEL-3 Cancel keeps TT task; 0 deletes
- [x] CTX-D2 single hashtag / single TT tag; second sync idle
- [x] AF-5 Inbox → nextAction; line stayed (note: `#inbox` not retained with `#type/next`)
- [x] Evidence under `STEP7-AF-PILOT-SOAK/`
