# Pilot run results (git archive)

Directory layout and phase file template. **Agent workflow** (handoff, when to update, what is canonical): **`.cursor/rules/pilot-results.mdc`**.

## Layout

```text
docs/pilot/results/
  README.md                          ← this file
  <GATE-ID>/                         ← e.g. PILOT-GATE-TEST-11-12
    INDEX.md                         ← ordered list + one-line status per phase
    <issue#>-<short-slug>.md         ← full evidence (one file per GitHub issue)
```

## File naming

| Pattern | Example |
|---------|---------|
| `INDEX.md` | Links all phases for one gate |
| `10-phase-0-baseline.md` | GitHub issue **#10** |
| `11-phase-1-hypothesis.md` | GitHub issue **#11** |

Use the **GitHub issue number** prefix so issue ↔ file is obvious.

## Required sections (every phase file)

1. **Meta** — date (UTC), build (`manifest.json`), issue URL, status (`open` / `closed`)
2. **Inputs** — links to previous phase files (if any)
3. **Evidence** — logs, MCP, disk paths (no secrets, no personal absolute paths in prose; use `<pilot-vault>` or relative vault paths)
4. **Conclusion** — 1–3 sentences, decision for next phase
5. **Checklist** — copy of issue checkboxes with `[x]` / `[ ]`

## Gates in progress

| Gate ID | Index |
|---------|--------|
| `COMMENT-FIXES-2.0.78` | [`COMMENT-FIXES-2.0.78/INDEX.md`](COMMENT-FIXES-2.0.78/INDEX.md) |
| `TECH-SYNC-MODULARIZATION` | [`TECH-SYNC-MODULARIZATION/INDEX.md`](TECH-SYNC-MODULARIZATION/INDEX.md) |
| `PILOT-GATE-TEST-11-12` | [`PILOT-GATE-TEST-11-12/INDEX.md`](PILOT-GATE-TEST-11-12/INDEX.md) |
| `BUG-COMMENT-ABYSS-VIEW` | [`BUG-COMMENT-ABYSS-VIEW/INDEX.md`](BUG-COMMENT-ABYSS-VIEW/INDEX.md) |
| `BUG-COMMENT-DUP-STAMP` | [`BUG-COMMENT-DUP-STAMP/INDEX.md`](BUG-COMMENT-DUP-STAMP/INDEX.md) |
| `PILOT-BATCH-EDITOR-SAFETY` | [`PILOT-BATCH-EDITOR-SAFETY/INDEX.md`](PILOT-BATCH-EDITOR-SAFETY/INDEX.md) |
| `PERF-DELTA` | [`PERF-DELTA/INDEX.md`](PERF-DELTA/INDEX.md) |
| `TP-COMMENT-TT-DELETE` | [`TP-COMMENT-TT-DELETE/INDEX.md`](TP-COMMENT-TT-DELETE/INDEX.md) |
| `PILOT-VAULT-CONFIG` | [`PILOT-VAULT-CONFIG/INDEX.md`](PILOT-VAULT-CONFIG/INDEX.md) |
| `NOTE-L3B-RECHECK` | [`NOTE-L3B-RECHECK/INDEX.md`](NOTE-L3B-RECHECK/INDEX.md) |
| `STEP7-AF-PILOT-SOAK` | [`STEP7-AF-PILOT-SOAK/INDEX.md`](STEP7-AF-PILOT-SOAK/INDEX.md) |
| `BUG-ACTIVEZONE-COMMENT-SHUFFLE` | [`BUG-ACTIVEZONE-COMMENT-SHUFFLE/INDEX.md`](BUG-ACTIVEZONE-COMMENT-SHUFFLE/INDEX.md) |
| `ABYSS-NEST-GTD` | [`ABYSS-NEST-GTD/INDEX.md`](ABYSS-NEST-GTD/INDEX.md) |
| `REGRESSION-2.0.91` | [`REGRESSION-2.0.91/INDEX.md`](REGRESSION-2.0.91/INDEX.md) |
| `BUG-NOTEBOOK-NO-DELETE` | [`BUG-NOTEBOOK-NO-DELETE/INDEX.md`](BUG-NOTEBOOK-NO-DELETE/INDEX.md) |
| `FEAT-NOTEBOOK` | [`FEAT-NOTEBOOK/INDEX.md`](FEAT-NOTEBOOK/INDEX.md) |
| `ID-CHAIN-REBIND` | [`ID-CHAIN-REBIND/INDEX.md`](ID-CHAIN-REBIND/INDEX.md) |
