# Agents

Safety: pilot vault only; no secrets or personal absolute paths; do not invent live-vault pass. Do not push `abyss-mapping`/`master`, merge, tag, or release unless the owner asked — PR into `abyss-mapping`; owner merges. Bug fixes: prove ×2 — see `.cursor/rules/bug-prove-twice.mdc`.

Process: case ID + expected behavior in `ABYSS_FIRST_CASES.md` (or `PO_STATUS.md`) before code; failing test named by that ID; then fix. Behavior PRs update `TEST_PLAN.md` in the same PR. `npx vitest run` and `npm run build` must pass. Pilot evidence: `.cursor/rules/pilot-results.mdc` → `docs/pilot/results/`.

Read `DEV_FLOW.md` for sync/pilot/release detail when needed — not for every tiny edit.
