# Task Settings

## Link to Tasks

Control how links between Obsidian and TickTick are displayed:

| Setting | TickTick → Obsidian | Obsidian → TickTick |
|---------|-------------------|-------------------|
| No Link | No link added | No link added |
| Link in Task | Link added to task line | Link added to task line |
| Link in Description | Link added as first line of notes | Link added as first line of notes |

## Organize Tasks by TickTick Folders

When enabled, tasks are organized into Obsidian folders matching your TickTick folder structure. Files without a default project will not be moved.

## Task Display

Control which task elements are visible in **Reading mode** and **Edit mode** independently:

| Element | Reading Mode | Edit Mode |
|---------|-------------|-----------|
| **TickTick Link** | Show or hide the TickTick task link | Show or hide the TickTick task link |
| **TickTick ID** | Show or hide the TickTick task ID | Show or hide the TickTick task ID |
| **#ticktick Tag** | Show or hide the `#ticktick` tag | Show or hide the `#ticktick` tag |

## Reset local sync database

Formerly **Reset Tasks**. Clears the plugin’s local IndexedDB sync state (tasks, file/task maps, comment maps, projects, tags, journal) and sets the sync `checkPoint` to `0`. Vault markdown notes are **not** deleted. TickTick is not changed. The button does **not** auto-sync.

Use this **before restoring a TickTick account backup** (instead of deleting the plugin database in browser DevTools). After restore, run **Synchronize** once so the plugin re-links from vault `ticktick_id` markers and a full TickTick pull. With an empty local DB, the empty-Dexie mass-delete guard still blocks invented deletions.

!!! warning
    This only clears the local sync cache. It does not delete notes in your vault and does not delete tasks in TickTick.

## Notes Settings

See the [Notes page](notes.md) for note synchronization settings, including the optional note separator configuration.
