# PERF-DELTA — pilot results

Gate for GitHub epic [#62](https://github.com/semyon-alekseev-noveo/tt-sync/issues/62) (PERF/DELTA).

| Phase | File | Status |
|-------|------|--------|
| Dual-analyst brief (post-2.0.81 fail) | [62-analyst-dual-brief.md](62-analyst-dual-brief.md) | **consensus** — slice order A→B→pilot |
| Slice 1 — idle comment probe cut + code baseline | [62-slice1-idle-comment-probe.md](62-slice1-idle-comment-probe.md) | **open** — unit locked; live follow-up in 81 file |
| Live `[perf]` + `TP-IDLE-ZERO` on **2.0.81** | [81-idle-zero-2.0.81.md](81-idle-zero-2.0.81.md) | **fail** — quiet ×2 still `getTaskComments` 1757 / `getTaskById` 68 |
| Slice 2 — commentCount backfill + idle-fast + preparePersist gate | [82-slice2-idle-fast.md](82-slice2-idle-fast.md) / [#82](https://github.com/semyon-alekseev-noveo/tt-sync/issues/82) | unit locked; live = [82-idle-zero-2.0.82.md](82-idle-zero-2.0.82.md) |
| Live `[perf]` + `TP-IDLE-ZERO` on **2.0.82** | [82-idle-zero-2.0.82.md](82-idle-zero-2.0.82.md) / [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) | **fail** — quiet ×2 `getTaskComments` **1741** / `getTaskById` **68** (−16 vs 81) |
| Slice 3 — stop double-sweep / `TP-IDLE-MANUAL-SCOPE` | [83-slice3-manual-scope.md](83-slice3-manual-scope.md) / [#83](https://github.com/semyon-alekseev-noveo/tt-sync/issues/83) | **unit locked**; live effect = [83-idle-zero-2.0.83.md](83-idle-zero-2.0.83.md) |
| Live `[perf]` + `TP-IDLE-ZERO` on **2.0.83** | [83-idle-zero-2.0.83.md](83-idle-zero-2.0.83.md) / [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) | **fail** idle-zero; **partial** — comments **871** (~½ of 1741), `totalMs` ~250–276 s |
| Slice 4 — empty-thread skip + `deferCommentSweep` / `TP-IDLE-EMPTY-SWEEP` | [94-slice4-empty-sweep.md](94-slice4-empty-sweep.md) / [#94](https://github.com/semyon-alekseev-noveo/tt-sync/issues/94) | **unit locked**; live = [84-idle-zero-2.0.84.md](84-idle-zero-2.0.84.md) |
| Live `[perf]` + `TP-IDLE-ZERO` on **2.0.84** | [84-idle-zero-2.0.84.md](84-idle-zero-2.0.84.md) / [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) | **fail** idle-zero (`getTaskById` **44**); **comments 0** (was 871) |
| `TP-DELTA-*` §3.5 pilot | issue [#84](https://github.com/semyon-alekseev-noveo/tt-sync/issues/84) | not started |
| Re-pilot `TP-IDLE-ZERO` after slice 2–4 | issue [#85](https://github.com/semyon-alekseev-noveo/tt-sync/issues/85) | **fail** on 2.0.84 — comments **0**, byId **44**; leave open |
| TECH-START-1 / register scan | issue [#86](https://github.com/semyon-alekseev-noveo/tt-sync/issues/86) | not started (P2) |
| Per-phase `[perf]` comment counters | issue [#87](https://github.com/semyon-alekseev-noveo/tt-sync/issues/87) | not started (P2) |
