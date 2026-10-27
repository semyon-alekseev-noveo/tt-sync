# Decision #1 — Abyss vs `#ticktick`

| Field | Value |
|-------|--------|
| Gate | UX-OBS-TT-SOAK |
| Decision | Abyss `taskIgnoreQuery` vs TickTickSync `#ticktick` provenance / sync marker |
| Plugin (soak) | tickticksync-abyss **2.0.94** |
| Abyss (soak) | **2.2.3** |
| Vault | Thinkpad-tts-test (pilot) |
| Status | **done** (analysis; owner chooses) |
| When | 2026-10-27 |

## Meta

Product brief for the owner: why the collide exists, what users feel, and which fix fits pilot vs prod. **No plugin code change in this phase** — vault config / docs / later TTS behavior are options below.

Three different “ticktick” words (do not conflate):

| Concept | Where | Role |
|---------|--------|------|
| **SyncTag** `#tts-test` | TTS settings `SyncTag` | Pilot **pull filter** (limit tasks from TickTick). Not the Abyss landmine. |
| **syncMarkerTag** `#ticktick` | Task **lines** (`settings.syncMarkerTag`, default `ticktick`) | “This checkbox is synced / was pulled.” Detection also accepts `#obsidian` + `%%ticktick_id%%` when scope-push is on. |
| **Source tag `ticktick` on project notes** | Frontmatter `tags:` of scheme notes | Provenance: note created/pulled from TickTick (`stampSourceTags` / `renderProjectNote`). **This** collides with Abyss ignore. |

---

## Зачем так сделали (intent / history)

### Почему в vault стоит Abyss `taskIgnoreQuery: #ticktick`

**Гипотеза (подтверждена документами):** ignore ставили под **Step 3 Option B** — «Inbox = untagged», а `#ticktick` на строках не должен ломать Abyss Inbox (маркер «не считается тегом» для untagged-режима).

**Evidence:**

- `CHANGELOG.md` · Iteration 2026-10-16 15:30 UTC — owner chose Option B; test vault `abyss-tasks/data.json` → `taskIgnoreQuery: #ticktick`.
- `ABYSS_FIRST_PLAN.md` §3 Option B — untagged inbox + ignore sync marker; §3.1 later **superseded** (2026-10-18): Option B **не работает** для inbox (после `#obsidian` строка выпадает из untagged Inbox; ignore `#obsidian` спрятал бы задачу отовсюду).
- Решение плагина: **Option A** — Abyss Inbox = tag `#inbox`. Pilot Abyss сейчас: `inbox.mode: "tag"`, `tag: "#inbox"` — Option A **уже применена**.
- **`taskIgnoreQuery: #ticktick` остался** как хвост Option B. План прямо говорит: плагин **не** выставляет `taskIgnoreQuery`; это vault setting. Intent «спасти untagged Inbox» устарел; side-effect на project notes никто не закрыл.

**Текущий pilot Abyss (суть, без абсолютных путей):**

| Key | Value |
|-----|--------|
| `taskIgnoreQuery` | `#ticktick` |
| `projects.membershipQuery` | `#system/project and "10 Projects/"` |
| `projects.createFolder` | `10 Projects` |
| `projects.taskInsertionSection` | `## Active Zone` |
| `inbox` | tag `#inbox` (Option A) |
| `taskFilePath` | `00 Inbox/abyss-active.md` |

### Почему TickTickSync штампует `#ticktick`

**1. Project notes (frontmatter) — provenance**

- `ProjectSchemeService.stampSourceTags`: если нет `ticktick`/`obsidian` в tags → добавить `ticktick` при `Source:: TickTick` в теле, иначе `obsidian`.
- `renderProjectNote` / `ensureProjectNote` / `renderProjectTemplate`: TT→Obs parent note всегда получает tags `system/project` + **`ticktick`** (+ `ticktick_id`).
- Docs: `GTD_SYNC_RESEARCH.md` AC-9 / scheme table — source tag on note; A4 expects tag `ticktick` on pulled project note.

**2. Task lines — sync marker / origin**

- `convertTaskToLine` → `addTickTickTag` for TT-born (or non-`#obsidian` project children); vault-born under scheme parent keep `#obsidian`.
- `syncMarkerTag` default `ticktick`; `stopInjectingTickTickTag: true` на pilot **не пушит** тег `ticktick` **в TickTick**, но **не убирает** frontmatter provenance и не отменяет line marker на pull.
- Scope push без маркера (`scopePushWithoutMarker`) позволяет Obs→TT без `#ticktick` на строке — soak Fool/lean path; SyncTag `#tts-test` — отдельный ритуал (см. 04).

**Итог intent:** `#ticktick` = «из TickTick / synced line». Abyss ignore = «не считай этот тег для Inbox». Одно слово, два смысла; после перехода на `#inbox` ignore стал **ядом для TT-origin проектов**.

---

## Как устроено сейчас (mechanism)

```text
TT: parent on TTS-Projects
        │ Synchronize (scheme)
        ▼
Vault: 10 Projects/<title>.md
  tags: system/moc, system/project, ticktick
  ticktick_id: <parent>
  ## Active Zone  (+ later child lines with #ticktick / #obsidian + %%id%%)
        │
        ├─ Abyss membershipQuery → note IS a Project (system/project + folder) ✓
        └─ Abyss taskIgnoreQuery #ticktick → note/tasks IGNORED ✗
              → create/edit via Abyss: «No target file found for task»
```

**Что всё ещё синхронится Obs↔TT, когда Abyss заблокирован**

- Markdown Active Zone + Synchronize (или debounce) → дети в TTS-Projects.
- TT→Obs pull parent/children (дети иногда со 2-го sync — 01b).
- Obs-origin notes **без** frontmatter `ticktick` (только `#obsidian`) — Abyss create **должен** работать (01a test03, 02/03 lean notes); UI Abyss в soak часто **not run**, но settings+priors согласованы.
- List stubs / parked trees (`30 Tasks/TickTick`, `zz-parked-*`) — отдельный шум; не главный blocker edit, но кандидат на path-ignore (вариант D).

---

## В чём проблема сейчас (user-visible)

| Symptom | Evidence |
|---------|----------|
| Abyss: **«No target file found for task»** при add/edit на TT-origin project | 01b (brief landmine + live TT tip parent tagged `ticktick`) |
| TT-pulled project виден в membership, но **second-class** в Abyss | 01b, 05 synthesis axis Logic |
| Phone-first (создал parent в TT) → vault note → **нельзя** править next actions в Abyss | 02 DevOps, 03 Researcher — «wrong door» |
| Obs→TT sync при этом **OK** | 01a Dishwasher child; 02/03/04 lean notes |
| Три «Projects» + один тег-слово = ментальный разрыв | 01a table; 05 P0 backlog |
| Ignore — **устаревший хвост** Option B при уже включённом `#inbox` | ABYSS_FIRST_PLAN §3.1 + текущий `data.json` |

Корень: **note-level** `#ticktick` + Abyss **taskIgnoreQuery: #ticktick**. Line-level `#ticktick` усиливает ignore на задачах внутри note, но soak бьёт именно по **project note** provenance.

---

## Варианты решения

### A. Снять Abyss ignore (`taskIgnoreQuery` очистить / сузить)

| | |
|--|--|
| **Что меняется** | Vault Abyss: убрать `#ticktick` из `taskIgnoreQuery` (пусто или path на stubs — см. D). Docs/preset: Option B deprecated. TTS code: нет. |
| **Pros** | Сразу лечит TT-origin Abyss edit; совпадает с Option A inbox; effort **S**; soak P0 закрывается config-only. |
| **Cons** | Если где-то ещё ждут «ignore marker = untagged», поведение Inbox/тегов изменится (на pilot Inbox уже `#inbox` — риск низкий). Legacy list-file noise может стать видимее в Abyss Tasks. |
| **Residual risk** | Нужен smoke: Abyss create на TT-tip parent + Inbox `#inbox` не регрессирует. |
| **Effort** | **S** |
| **Fit** | **Pilot сейчас**; prod vaults с тем же хвостом Option B. |

### B. Не штамповать `#ticktick` на **project notes** (оставить на lines / list stubs)

| | |
|--|--|
| **Что меняется** | TTS: `renderProjectNote` / `ensureProjectNote` / `stampSourceTags` — provenance иначе (`Source:: TickTick` only, или tag `origin/ticktick` / `tts/from-tt`). Docs + ABYSS cases A4. Abyss ignore можно оставить для **line** marker, если verified. |
| **Pros** | Разделяет «origin note» и «sync line marker»; phone-first + Abyss edit без трогания ignore; чище product model. |
| **Cons** | Code + tests + migration старых frontmatter tags; Dataview/queries на `tag:ticktick` ломаются; effort **M**. |
| **Residual risk** | Если ignore остаётся `#ticktick`, **line** `#ticktick` на Active Zone всё ещё может глушить задачи в Abyss views (нужна verify Abyss 2.2.x: note tags vs line tags). |
| **Effort** | **M** |
| **Fit** | **Prod-shaped** fix; pilot может жить на A, пока B не смержен. |

### C. Abyss — не редактор проектов; документ «Obs markdown + TT only»

| | |
|--|--|
| **Что меняется** | Docs only: TT-origin notes не edit через Abyss; workflow = note / TT app. Ignore **оставить**. |
| **Pros** | Zero code; честный scope; effort **S**. |
| **Cons** | Soak показал, что люди **ожидают** Abyss Projects; phone-first путь остаётся ловушкой; P0 «resolve collide» не решён для UX. |
| **Residual risk** | Постоянный support load / «No target file…». |
| **Effort** | **S** (docs) |
| **Fit** | Временный pilot workaround **или** если owner отказывается от Abyss как project UI. |

### D. Hybrid: ignore path `30 Tasks/TickTick/**` (и/или parked), не `#ticktick` на notes

| | |
|--|--|
| **Что меняется** | Abyss `taskIgnoreQuery` → path filter (если syntax Abyss query это умеет — plan: «often tag/path»). Пример intent: `"30 Tasks/TickTick/"` / `zz-parked`. Убрать tag `#ticktick` из ignore. Optionally TTS later stops note-level stamp (B). |
| **Pros** | Прячет list stubs / dump noise; project MOCs остаются editable; ближе к реальной боли «sync dump». |
| **Cons** | **Verify** Abyss 2.2.3 path ignore; wrong path → либо ничего не игнорируется, либо слишком много. Line `#ticktick` в Active Zone больше не «ядовит» note целиком (хорошо), если ignore был tag-wide. |
| **Residual risk** | Неполный ignore stubs; нужно owner UI confirm. |
| **Effort** | **S–M** (config + verify) |
| **Fit** | **Pilot + prod** вместе с A (A∪D): clear tag ignore, add path ignore. |

### E. Other (если evidence сильнее)

| Option | When |
|--------|------|
| **E1. Rename syncMarkerTag** (`tts-synced` etc.) | Если нужен ignore «маркера» без clash с provenance — **L**, migration всех lines. Обычно хуже B+A. |
| **E2. Abyss membership exclude** `and not #ticktick` | Ухудшит: TT projects исчезнут из Projects panel целиком — **reject**. |
| **E3. Keep ignore + strip note tag in vault once** | One-shot vault cleanup без code: снять `ticktick` с frontmatter TT notes — temporary; scheme **перештампует** на следующем sync → нужен B или A. |

---

## Рекомендация

**Preferred: A сейчас (+ D если stubs шумят в Abyss Tasks), B в бэклог продукта.**

1. **Pilot (сегодня):** очистить `taskIgnoreQuery` (пусто) **или** заменить на path ignore stubs (`30 Tasks/TickTick` / parked) — **A∪D**. Inbox уже `#inbox` — Option B не нужна.
2. **Smoke (два независимых proof на bug-fix style):** (1) Abyss add task на live TT-origin tip parent → строка в `## Active Zone`; (2) другой TT-origin / Obs-origin note + Sync → TT child. Записать в pilot results.
3. **Prod TTS (отдельный PR):** **B** — не писать frontmatter `ticktick` на project notes (provenance = `Source::` / другой tag); line marker оставить. Обновить ABYSS_FIRST / TEST_PLAN / cases A4.
4. **C** — только если owner явно говорит «Abyss не для project edit».

### Что ещё спросить у owner

1. Должен ли **Abyss Projects** быть first-class editor для **TT-created** parents, или только Obs-origin?
2. Нужен ли вообще **note-level** provenance tag, или достаточно `Source:: TickTick` + `ticktick_id`?
3. Игнорировать ли в Abyss **list stubs** path (`30 Tasks/TickTick/**`) отдельно от marker?
4. Ок ли **сразу** чистить ignore на pilot vault (A), без ждать PR B?

---

## References

| Item | Path / key |
|------|------------|
| This gate INDEX | `docs/pilot/results/UX-OBS-TT-SOAK/INDEX.md` |
| Soak evidence | `01a`, `01b`, `02`, `03`, `04`, `05-synthesis.md`, `00-brief.md` |
| Plan Option B → A | `ABYSS_FIRST_PLAN.md` §3 / §3.1 |
| Changelog Option B apply | `CHANGELOG.md` · 2026-10-16 15:30 UTC |
| Research G12 / marker | `GTD_SYNC_RESEARCH.md` (G12, syncMarkerTag, stampSourceTags) |
| Note stamp | `src/services/ProjectSchemeService.ts` `stampSourceTags` |
| Note template tags | `src/projectScheme.ts` `renderProjectNote` / `ensureProjectNote` |
| Line marker | `src/taskParser/convertToLine.ts`, `src/taskParser/markers.ts` `addTickTickTag` |
| Marker name setting | `settings.syncMarkerTag` (default `ticktick`); `stopInjectingTickTickTag` |
| Pilot pull filter | `SyncTag` = `tts-test` (≠ Abyss ignore) |
| Abyss keys (vault plugin data) | `taskIgnoreQuery`, `projects.membershipQuery`, `inbox.mode` |

No personal absolute filesystem paths in this file.
