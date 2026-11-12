# `abyssTasksFormat` OFF on a configured Abyss pilot — ON vs OFF matrix

**Status:** analysis (docs only, no engine change) — [#201](https://github.com/semyon-alekseev-noveo/tt-sync/issues/201)
**Written:** 2026-11-12 · tip `ec91fec`
**Vault scope:** `<pilot-vault>` only. Nothing here was run on `<live-vault>`.
**Method:** static read of the code on the tip. Every claim names the file and line. Anything that needs a human in Obsidian is marked **verify in pilot**, not asserted.

---

## Verdict

Turning `abyssTasksFormat` **off** on a configured Abyss pilot is **not a mode switch**. It is a **lossy downgrade of the vault**:

1. The checkbox symbol stops being the source of truth for the list, so **every non-terminal symbol (`[/]`, `[!]`, `[?]`, `[=]`, `[~]`) collapses to `[ ]`** on the next pull, and the stage moves into `#gtd/*` tags.
2. Note bodies written in Abyss `- >` form fall outside the classic body-region scan, so the body **detaches from the task** and the TickTick body can be cleared.
3. TickTick comments stop using the Comments API and fall back to the legacy content block.
4. List stubs (`TTS-*.md`) become eligible again and can reappear under the tasks folder.
5. A TickTick-side list change can **move the vault line to another file**.

Only two things are safe: looking at Settings, and editing settings values (they persist). **Synchronize while OFF is the footgun.**

Recommendation: **treat OFF as unsupported while the pilot config is present** — warn, and offer a guided "leave Abyss mode" instead of a bare checkbox. Details in §5.

---

## 1. What the flag actually gates

| Area | Code | `abyssTasksFormat` ON | OFF |
|------|------|------------------------|-----|
| Status→list SoT | `src/taskParser/convertToTask.ts:116`, `src/taskParser/convertToLine.ts:32` | checkbox symbol → TickTick list via `statusListMappings` | mapping **ignored**; stage from `tagListMappings` / `gtdStageVia` |
| Status tags | `src/taskParser/convertToTask.ts:119-145` | status tag derived from checkbox; conflicting status tags dropped | tags pass through unchanged |
| Stage tags on the line | `src/taskParser/convertToTask.ts:256-315` | `#gtd/*` stripped when status is SoT | list-mapped stage tags kept / rewritten |
| Note body format | `src/taskParser/notes.ts:76`, `:209` | Abyss `- >` description + `- ` comments | classic `noteDelimiter` block |
| Comments transport | `src/abyssCommentSync.ts:39` | TickTick Comments API (`syncAbyssCommentsViaApi`) | legacy block inside `content` |
| Body-region detection | `src/services/NewFileMap.ts:463`, `:506`, `:552` | `abyssRegionEnd()` (indent-based) | classic delimiter / indent scan |
| Keep line in place | `src/sync/vault-pull/persistTasksToFile.ts:102` | always keep | classic structure-move path enabled |
| Push without `#ticktick` | `src/syncScope.ts:233` (`scopePushWithoutMarker`) | true when push scope is non-empty | false |
| List-stub suppression | `src/syncScope.ts:245` (`listStubFilesEnabled`) | false (scheme + scope) | **true** → stubs allowed |
| Context tags (`note/`, `proj/`) | `src/sync/vault-push/taskModification/push.ts:154`, `src/taskParser/convertToTask.ts:329` | maintained on push | not maintained; still **stripped on pull** (`convertToLine.ts:30`) |
| Block merge on write | `src/sync/vault-push/taskModification/newTasks.ts:312`, `src/services/NewFileMap.ts:135` | `mergeAbyssBlock` | plain replace |
| Settings visibility | `src/ui/settings/settingsUxVisibility.ts:17` (`isAbyssGtdPathActive`) | Abyss slice active | classic twins reappear |

`useStatusList` is literally `abyssTasksFormat && statusListMappings.length` (`convertToTask.ts:116`). There is no second switch.

---

## 2. ON vs OFF matrix

Pilot config assumed (from `docs/pilot/results/PILOT-VAULT-CONFIG/64-pilot-config-2.0.89.md`):
`projectSchemeEnabled: true`, `syncScopeFolders: ['00 Inbox/', '10 Projects/', '30 Tasks/']`,
`statusListMappings` set, `tagListMappings` set, `stopInjectingTickTickTag: true`,
`enableFullVaultSync: false`, `fileLinksInTickTick: noLink`.

### 2.1 Create — new vault line → TickTick

| | ON | OFF |
|---|---|---|
| New line in scope, no id, no `#ticktick` | `scopePushWithoutMarker()` true → `isLineTrackedForSync` true → **created** | gate fails (`syncScope.ts:233` → `markers.ts:29`) → **not created** |
| New line with `#ticktick` | created | created |
| New line with id + `#obsidian` | tracked | tracked (`markers.ts:20`) |

**Effect:** writing a task anywhere in scope stops creating it in TickTick. That is classic behavior, but the Abyss workflow is "write the task where it belongs" — nothing tells the user their capture silently stopped.

`enableFullVaultSync` would compensate by tagging the whole file (`newTasks.ts:273`), but it also tags every line in every in-scope file — not a fix.

### 2.2 Update — existing Abyss line → TickTick

| | ON | OFF |
|---|---|---|
| Tracked? | yes (id / source tag) | yes — plugin-written lines carry `#ticktick` or `#obsidian` (`convertToLine.ts:88-99`) |
| List placement | checkbox symbol → `statusListMappings` | file default / `tagListMappings` / list-named tag |
| Status tag | derived from checkbox, conflicts dropped | untouched; `status/in-progress` may be pushed as a plain tag |
| `#gtd/*` leftovers | stripped (`__stripStageTagsRewrite`) | kept → tag bloat and stage/list disagreement |
| Body / comments | `mergeAbyssBlock` + Comments API | classic `content` replacement |

**Effect:** a task can **change TickTick list** on the first update after OFF, because the symbol no longer routes. Example: a `[/]` line in `TTS-WIP` with no `#gtd/*` and no file default falls back to the default project (or the Inbox fallback), so the next edit moves it in TickTick.

### 2.3 Pull — TickTick → vault (the dangerous direction)

| | ON | OFF |
|---|---|---|
| Checkbox char | `restoreStatusFromList()` — list → char (`convertToLine.ts:36-52`) | `restoreStatus()` — `statusMappings` tags only (`statusMapping.ts:28`) |
| Result for `[/] [!] [?] [=] [~]` | preserved | **collapse to `[ ]`** (no matching status tag exists on the TT side) |
| Stage tags on the line | list-mapped tags stripped when status is SoT | `tagsForCurrentList(via: 'list')` **adds** `#gtd/<stage>` (`convertToLine.ts:60-72`) |
| Note body | `- >` lines rebuilt | classic delimiter block rebuilt |
| Comments | Comments API → `- ` lines | legacy content block; API comments not rendered |
| Context tags | re-appended on push | stripped on pull, never refreshed |

**Effect:** one Synchronize while OFF rewrites the vault: symbols lost, `#gtd/*` injected, bodies reformatted. Turning the flag back ON does **not** restore the symbols — the information is gone from TickTick (it was only in the list placement, and the list may have moved too).

### 2.4 Structure — file moves and stubs

| | ON | OFF |
|---|---|---|
| TT-side list change | line stays (`keepLineInPlace` true) | `handleTickTickStructureMove` **moves the line to another file** (`fileOperation.ts:544`) and may create a default file for the target project |
| `TTS-*.md` stubs | suppressed (`listStubFilesEnabled` false) | allowed again → stubs can reappear under `30 Tasks/TickTick` (known G1 / `UX-STUB-1`) |
| Body region on update | `abyssRegionEnd` — indented children belong to the task | classic scan: an Abyss `- >` child (tab + `- `) does **not** start with `notePrefix` (tab + two spaces) → region ends at the task line (`NewFileMap.ts:463-481`) |

**Effect of the body-region mismatch:** the generated line replaces only the task line. The `- >` body stays in the file as orphaned text (re-attached if the flag goes back ON), while the classic `getNoteString` sees an empty body and can push empty `content` — the same class of damage that `BUG-NOTE-BODY-WIPE` guards against, but that guard is gated on `abyssTasksFormat` (`push.ts:139`). **verify in pilot.**

### 2.5 Settings UI

| | ON | OFF |
|---|---|---|
| Defaults "Tasks folder" twin | hidden | reappears |
| Legacy SyncProject / AND-OR | hidden | reappears |
| Hub single tasks file | hidden | reappears |
| Status→list table | visible | visible, but **inert** |
| Stored values | persist | persist |

**Effect:** nothing is destroyed by opening Settings. The risk is that an inert table still looks active, and the classic twins invite edits that matter only when OFF.

---

## 3. Failure scenarios, ranked

| # | Scenario | Severity | Confidence |
|---|----------|----------|-----------|
| S1 | OFF + Synchronize → every `[/] [!] [?] [=] [~]` becomes `[ ]`; stage moves to `#gtd/*` | **high** — silent data loss in the vault | code-certain (§2.3) |
| S2 | OFF + Synchronize → Abyss `- >` body detaches; TickTick body can be cleared | **high** — task notes at risk | code-likely; **verify in pilot** |
| S3 | OFF + edit → task changes TickTick list because the symbol no longer routes | **medium** | code-certain (§2.2) |
| S4 | OFF + Synchronize → `TTS-*.md` stubs reappear under the tasks folder | **medium** | code-certain (`syncScope.ts:245`) |
| S5 | OFF + TT list change → vault line moves to another file | **medium** | code-certain (`persistTasksToFile.ts:102`) |
| S6 | OFF → new lines in scope stop creating tasks | **low/medium** — expected classic, surprising for Abyss | code-certain |
| S7 | OFF → API comments no longer render; legacy block instead | **low** | code-certain |

S1 and S2 are the reason this is a footgun rather than a preference.

---

## 4. Is OFF a supported mode?

Two honest answers:

- **Technically** the plugin still runs. Every branch has an OFF path; nothing throws.
- **Product-wise** no: the pilot config is a one-way door. OFF preserves the *files* but not the *semantics*. The data that makes the Abyss path work (symbol → list) is not stored in TickTick anywhere else, so it cannot be recovered by re-enabling the flag.

So: **OFF is a migration, not a toggle.** If the owner wants to leave Abyss mode, the safe sequence is to move data first (write symbols back as tags, move lists), then turn the flag off and Synchronize — never turn it off and sync to "see what happens".

---

## 5. Recommendations (follow-ups, not this ticket)

| # | Recommendation | Shape |
|---|----------------|-------|
| R1 | **Warn before a sync while OFF** when the Abyss config is present (`projectSchemeEnabled` + non-empty `statusListMappings` + non-empty `syncScopeFolders`) | Settings UX + a one-time Confirm on Synchronize. Cheapest real protection. |
| R2 | **Do not hide the danger behind a checkbox.** Rename it to «Abyss Tasks format (turning this off changes how lists and symbols sync)» and show a read-only summary of what will change. | Copy only |
| R3 | **Keep the status→list table read-only while OFF**, with an "inactive" badge — today it stays editable but inert. | Settings UX |
| R4 | **Make `restoreStatus` fall back to the list-derived char** even when the flag is OFF *if* `statusListMappings` is non-empty — i.e. keep pull lossless while OFF. | Engine change; needs its own issue + AF cases |
| R5 | **Gate `handleTickTickStructureMove` on the Abyss config**, not only on the flag, so OFF does not start moving vault lines. | Engine change; own issue |
| R6 | **Docs:** a short "leaving Abyss mode" page with the safe sequence, linked from Settings. | Docs |

R1 + R2 + R3 are small and unblock the pilot immediately. R4 + R5 are the real fixes and should be separate issues with cases.

---

## 6. Cases to add when behavior claims are accepted

Not added to `ABYSS_FIRST_CASES.md` yet — they describe *current* OFF behavior, and the issue says analysis only. Proposed IDs for the follow-up PRs:

| Proposed ID | Claim |
|-------------|-------|
| `AF-FMT-OFF-SYMBOL-LOSS` | With `abyssTasksFormat` off and `statusListMappings` set, a pull must not silently collapse `[/] [!] [?] [=] [~]` to `[ ]`. Today it does. |
| `AF-FMT-OFF-BODY-DETACH` | With the flag off, an Abyss `- >` body must not detach from its task or clear the TickTick body. Today it can. |
| `AF-FMT-OFF-LIST-MOVE` | With the flag off, an edit must not move a task to another TickTick list purely because the symbol stopped routing. |
| `AF-FMT-OFF-NO-STUBS` | With the flag off, list stubs must not reappear under the tasks folder while the Abyss config is present. |
| `AF-FMT-OFF-WARN` | A sync while the flag is off and the Abyss config is present must warn once (after R1). |

Each becomes a failing unit named by the ID, per `DEV_FLOW.md`.

---

## 7. Safe verification (pilot only)

Do **not** run this on `<live-vault>`. On `<pilot-vault>`:

1. Snapshot: copy the vault, or `git`-commit it if it is versioned. Record `data.json` keys from §2.
2. Pick **one** note with 2–3 tasks that use `[/]` and `[!]` and have `- >` bodies.
3. Turn `abyssTasksFormat` **off**. **Do not** Synchronize. Confirm: settings persist, classic twins reappear, no file changed. → proves §2.5.
4. Synchronize once. Record, per task: checkbox char, tags added/removed, body lines, TickTick list, TickTick body, comments panel. → S1/S2/S3.
5. Check `30 Tasks/TickTick/` for new `TTS-*.md` files. → S4.
6. Turn the flag back **on**, Synchronize, and record what did **not** come back. That is the irreversible part.
7. Restore the snapshot. Write the result to `docs/pilot/results/` and link it here.

If step 3 already changes files, that is a bug worth its own issue.

---

## 8. Sources

- `src/syncScope.ts:228-252` — push scope, `scopePushWithoutMarker`, `listStubFilesEnabled`
- `src/taskParser/markers.ts:12-32` — `hasTickTickTag`, `isLineTrackedForSync`
- `src/taskParser/convertToTask.ts:115-145`, `:250-330`, `:380-400` — status SoT, stage tags, context tags
- `src/taskParser/convertToLine.ts:30-72`, `:88-99` — pull symbols, stage tags, source tag
- `src/taskParser/notes.ts:76`, `:209` — body/comment format
- `src/abyssCommentSync.ts:37-40` — Comments API gate
- `src/services/NewFileMap.ts:135`, `:433`, `:463-481`, `:506`, `:552` — body region, block merge
- `src/sync/vault-pull/persistTasksToFile.ts:97-117` — keep-in-place vs structure move
- `src/fileOperation.ts:544-600` — `handleTickTickStructureMove`
- `src/sync/vault-push/taskModification/push.ts:139-165` — body-wipe guard, context tags
- `src/sync/vault-push/taskModification/newTasks.ts:80-95`, `:273`, `:312`
- `src/statusMapping.ts:28-36`, `src/statusListMapping.ts:18-22` — char restore paths
- `src/ui/settings/settingsUxVisibility.ts:17-30`, `:44-58` — UI slice
- `docs/pilot/results/PILOT-VAULT-CONFIG/64-pilot-config-2.0.89.md` — pilot keys
