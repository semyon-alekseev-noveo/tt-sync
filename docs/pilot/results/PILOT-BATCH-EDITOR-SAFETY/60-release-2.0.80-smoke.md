# 60 — Release 2.0.80 smoke (BUG-COMMENT-VAULT-DUP-KEY #27)

## Meta

- PR: [tt-sync #60](https://github.com/semyon-alekseev-noveo/tt-sync/pull/60) (merged)
- Release: **2.0.80** — https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.80
- Date: 2026-10-22
- Vault: `<pilot-vault>` only (Thinkpad-tts-test)
- Commit: `e13c195` (`abyss-mapping` merge of #60)

## Inputs

- Prior PR-tip pilot: [27-vault-dup-key-2.0.80-unit.md](27-vault-dup-key-2.0.80-unit.md) (`task-11-16` 20→4)
- Prior tip smoke: [58-release-2.0.79-smoke.md](58-release-2.0.79-smoke.md) (twins still present on **2.0.79**)
- Owner release policy: tag only after merge; no feature-branch release; no retag

## Evidence

### Regression gate (on `abyss-mapping` @ `e13c195`)

| Check | Result |
|-------|--------|
| `npx vitest run` | **100** files, **701** passed |
| `npm run build` | ok — `dist/` version **2.0.80** |
| GitHub release assets | `main.js`, `manifest.json`, `styles.css`, `tickticksync-abyss.zip` |
| Tag target | `e13c195` (merge of #60) — **not** retagged |

### Pilot deploy + Synchronize

| Step | Result |
|------|--------|
| Download GitHub release **2.0.80** assets → `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/` | **pass** |
| `obsidian vault=Thinkpad-tts-test plugin:reload id=tickticksync-abyss` | **pass** |
| Loaded plugin version | **`2.0.80`** (`manifest.json` + `data.json` + eval) |
| Pre-deploy Abyss stamps under `task-11-16` | **4** wall-clock (already collapsed on PR tip); **0** ISO twins |
| `obsidian … command id=tickticksync-abyss:tts-sync` | **Executed** (`syncRunning` null; `checkPoint` unchanged — idle delta) |
| Post Synchronize stamps | **4** wall-clock; **no** ISO twins (still collapsed) |

Kept lines (one per `normalizedCommentKey`):

- `2026-10-21 21:22: comment 1`
- `2026-10-21 21:22: коммент 2`
- `2026-10-21 21:25: abyss-view-verify-18380`
- `2026-10-21 21:25: abyss-view-verify-b`

Status: **pass** for deploy + reload + Synchronize smoke; #27 twins remain collapsed on release build.

### Case-specific pilot (#27 / #28 / #29)

| Case | Result |
|------|--------|
| **BUG-COMMENT-VAULT-DUP-KEY** (#27) | **pass** — twins already collapsed on PR tip; after GitHub **2.0.80** deploy + Synchronize, `task-11-16` stays at **4** bullets with no ISO twins. |
| **BUG-COMMENT-EMPTY-VAULT-WIPE** (#28) | **not run** — would require inducing empty-vault wipe path (unsafe without dedicated fixture). |
| **BUG-COMMENT-GET-FAIL-OPEN** (#29) | **not run** — would require injecting `getTaskComments` failure. |

## Conclusion

- Automated gate: **pass**
- Pilot Synchronize smoke: **pass**
- **#27** may close (release + live collapse evidence)
- **#28** / **#29** stay **open** (unit-only unless case-verified)

## Checklist

- [x] Vitest + build green on merged `abyss-mapping` tip
- [x] Assets on GitHub release 2.0.80 (tagged once at merge commit)
- [x] Pilot plugin folder = 2.0.80 (from release assets)
- [x] Synchronize smoke (command executed; twins stay collapsed)
- [x] #27 closable with release + this file
- [ ] #28/#29 closed — **deferred** (case-specific pilot not induced)
