# 58 — Release 2.0.79 smoke (P0 comment bugs #27–#29)

## Meta

- PR: [tt-sync #58](https://github.com/semyon-alekseev-noveo/tt-sync/pull/58) (merged)
- Release: **2.0.79** — https://github.com/semyon-alekseev-noveo/tt-sync/releases/tag/2.0.79
- Date: 2026-10-22
- Vault: `<pilot-vault>` only (Thinkpad-tts-test)
- Commit: `38e7371` (`abyss-mapping` merge of #58)

## Inputs

- Prior unit evidence: [27-29-comment-p0-unit.md](27-29-comment-p0-unit.md)
- Prior tip: **2.0.78** on `abyss-mapping`
- Owner release policy: tag only after merge; no feature-branch release; no retag

## Evidence

### Regression gate (on `abyss-mapping` @ `38e7371`)

| Check | Result |
|-------|--------|
| `npx vitest run` | **100** files, **697** passed |
| `npm run build` | ok — `dist/` version **2.0.79** |
| GitHub release assets | `main.js`, `manifest.json`, `styles.css`, `tickticksync-abyss.zip` |
| Tag target | `38e7371` (merge of #58) — **not** retagged |

### Pilot deploy + Synchronize

| Step | Result |
|------|--------|
| Copy `dist/{main.js,manifest.json,styles.css}` → `<pilot-vault>/.obsidian/plugins/tickticksync-abyss/` | **pass** |
| `obsidian vault=Thinkpad-tts-test plugin:reload id=tickticksync-abyss` | **pass** |
| Loaded plugin version | **`2.0.79`** (enabled) |
| `data.json` `version` | **2.0.79** |
| `data.json` `checkPoint` | **moved** `1792660281617` (pre-deploy **2.0.78**) → `1792664146187` (after reload / startup sync window) |
| `obsidian … command id=tickticksync-abyss:tts-sync` | **Executed** (twice; `syncRunning` false; no further checkpoint move — idle delta) |

Status: **pass** for deploy + reload + Synchronize smoke.

### Case-specific pilot (#27 / #28 / #29)

| Case | Result |
|------|--------|
| **BUG-COMMENT-VAULT-DUP-KEY** (#27) | **not pass** — `task-11-16` on `2026-10-19.md` still has **21** Abyss comment lines (wall-clock clusters + ISO twins for the same 4 keys) after Synchronize on **2.0.79**. Unit gate green; live collapse not observed this run. |
| **BUG-COMMENT-EMPTY-VAULT-WIPE** (#28) | **not run** — would require inducing empty-vault wipe path (unsafe on pilot without a dedicated fixture). |
| **BUG-COMMENT-GET-FAIL-OPEN** (#29) | **not run** — would require injecting `getTaskComments` failure. |

## Conclusion

- Automated gate: **pass**
- Pilot Synchronize smoke: **pass**
- Case-specific live verify for #27/#28/#29: **not closed by this smoke** — leave issues **open** until honest case evidence exists (or owner accepts unit-only close)

## Checklist

- [x] Vitest + build green on merged `abyss-mapping` tip
- [x] Assets on GitHub release 2.0.79 (tagged once at merge commit)
- [x] Pilot plugin folder = 2.0.79
- [x] Synchronize smoke (checkpoint advanced vs pre-deploy)
- [ ] #27/#28/#29 closed — **deferred** (case-specific pilot incomplete)
