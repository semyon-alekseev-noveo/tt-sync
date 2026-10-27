# Brief — UX Obs ↔ TT soak

## Goal

Collect qualitative feedback before tightening product/docs. Not an AF regression gate.

## Axes

| Axis | Question |
|------|----------|
| Template noise | Does MOC / Active Zone / frontmatter / sync markers feel like clutter? |
| Excess info | Notices, tags, ids, dual UIs (Abyss + vault + TT) — what is too much? |
| Usability | Can someone add a project/task and sync without a runbook? |
| Logic | Is the Obs project note ↔ TTS-Projects parent ↔ Abyss Projects model coherent? |

## Role order

1. **Analyst A** — Obs → TT, project notes / templates  
2. **Analyst B** — TT → Obs, Abyss view / pull noise  
3. **DevOps** — fresh eyes through a real work task (deploy/ops style capture)  
4. **Researcher** — try to use as knowledge + next actions  
5. **Fool's test** — no prior sync knowledge; attempt common actions; log failures  

## Known UX landmines (for awareness, not to skip reporting)

- Abyss membership query for folder with space must be quoted: `"10 Projects/"`
- Create folder: `10 Projects` (no quotes)
- `taskIgnoreQuery: #ticktick` hides/blocks notes tagged `ticktick` (many synced projects)
- Parent-change toast `none`→`none`: #404
