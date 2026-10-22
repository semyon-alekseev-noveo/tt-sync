# 55 — Release 2.0.78 smoke (comment fixes on modular tip)

## Meta

- PR: [tt-sync #55](https://github.com/semyon-alekseev-noveo/tt-sync/pull/55)
- Release: **2.0.78** — https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.78
- Date: 2026-10-22
- Vault: `<pilot-vault>` only
- Commit: tip of `feat/comment-fixes-2.0.78`

## Inputs

- Base: modularization tip + **2.0.77** bump (`chore/release-2.0.77-modularization`).
- Cherry-picks: BUG-COMMENT-ABYSS-VIEW (`dee9569`), BUG-COMMENT-DUP-STAMP (`ab05fdf`), editor-safety #16 docs (`5b8467b`).
- Supersedes closed PRs #24 / #26 / #54.

## Evidence

### Regression gate

| Check | Result |
|-------|--------|
| `npx vitest run` | **100** files, **693** passed |
| `npm run build` | ok — `dist/` version **2.0.78** |
| GitHub release assets | `main.js`, `manifest.json`, `styles.css`, `tickticksync-abyss.zip` |

### Pilot deploy + Synchronize

| Step | Result |
|------|--------|
| Copy `dist/{main.js,manifest.json,styles.css}` → `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/` | **pass** |
| `obsidian vault=Thinkpad-tts-test plugin:reload id=tickticksync-abyss` | **pass** |
| eval → plugin manifest version | **`2.0.78`** |
| First `tts-sync` while `syncRunning` stuck true | command **Executed**; checkpoint **unchanged** (stuck flag) |
| Clear `syncRunning` via eval; re-run `tts-sync` | **Executed** |
| `data.json` `checkPoint` | **moved** `1792655865066` → `1792659785083` |
| `data.json` `version` | **2.0.78** |

Status: **pass** (deploy + reload + Synchronize completed after clearing stuck `syncRunning`; checkpoint advanced). Abyss-view / DUP-STAMP cases were **not** re-run in this smoke (prior evidence under their result folders).

## Conclusion

- Automated gate: **pass**
- Pilot Synchronize smoke: **pass**
- Owner should merge #55 into `abyss-mapping`

## Checklist

- [x] Vitest + build green on release tip
- [x] Assets on GitHub release 2.0.78
- [x] Pilot plugin folder = 2.0.78
- [x] One Synchronize completed (checkpoint advanced)
- [ ] Owner merges #55
