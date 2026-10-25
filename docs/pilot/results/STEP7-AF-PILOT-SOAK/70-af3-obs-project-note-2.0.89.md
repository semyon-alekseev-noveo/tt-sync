# #70 — AF-3 Obs project note → TT parent (2.0.89)

## Meta

| Field | Value |
|-------|--------|
| Gate | `STEP7-AF-PILOT-SOAK` |
| GitHub | [#70](https://github.com/semyon-alekseev-noveo/tt-sync/issues/70) (parent [#20](https://github.com/semyon-alekseev-noveo/tt-sync/issues/20)) |
| Recorded | 2026-10-24 ~14:20 UTC |
| Build | **2.0.89** on `<pilot-vault>` (Thinkpad-tts-test) |
| Status | **pass** (CLI create note + Synchronize ×2) |

## Inputs

- `ABYSS_FIRST_CASES.md` **AF-3**
- Issue [#70](https://github.com/semyon-alekseev-noveo/tt-sync/issues/70)
- `projectsFolder: 10 Projects`, TTS-Projects `6ad1abff8f0841315e870da9`

## Evidence

1. Created `10 Projects/AF-3 pilot obs parent 142000.md` with tags `system/moc`, `system/project`, `obsidian` — **no** `ticktick_id`.
2. Synchronize (`sync-mvmhkci3-4-sfpq`): journal `obs->tt` task create → id **`6adcbea84de4201f884a6a4a`**; note frontmatter gained that id.
3. Second Synchronize: same `ticktick_id`; **no** additional journal `create` for this title.

| Check | Result |
|-------|--------|
| TT projectId | TTS-Projects `6ad1abff8f0841315e870da9` |
| Title | `AF-3 pilot obs parent 142000` |
| Tags | `obsidian`, `project` — **no** `ticktick` |
| Content / file link | empty (no vault link injected) |
| Journal creates for title | **1** (first sync only) |
| Second sync new create | **none** |

## Conclusion

New Obsidian project note creates exactly one parent on the projects list; second sync is idle. Close #70. Next: AF-4 (#71).

## Checklist

- [x] Note under `10 Projects/` with `system/project` → Synchronize
- [x] One parent on TTS-Projects; no `ticktick` tag / file link
- [x] Second Synchronize creates nothing new
- [x] Evidence under `STEP7-AF-PILOT-SOAK/`
