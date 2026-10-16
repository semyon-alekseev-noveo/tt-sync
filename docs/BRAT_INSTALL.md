# Install the Abyss fork via BRAT

The community plugin id is `tickticksync`. This fork uses **`tickticksync-abyss`** so Obsidian’s community catalog and “Update all” will not replace your custom build.

## Requirements

- [BRAT](https://github.com/TfTHacker/obsidian42-brat) (`obsidian42-brat`) enabled in the vault.
- GitHub repo with branch **`abyss-mapping`** pushed (or your chosen BRAT branch).

## BRAT settings

| Field | Value |
|--------|--------|
| Repository | `https://github.com/semyon-alekseev-noveo/tt-sync` |
| Branch | `abyss-mapping` |
| Plugin id | `tickticksync-abyss` (from `manifest.json`; BRAT reads it after install) |

In BRAT: **Add a beta plugin** → paste the repository URL → confirm branch if prompted → enable **TickTickSync (Abyss fork)** under **Community plugins**.

## Obsidian steps (new install)

1. **Disable** the official **TickTickSync** (`tickticksync`) if it is installed from the community catalog.
2. Optional but recommended: remove `.obsidian/plugins/tickticksync/` after you migrate settings (below).
3. Open **Settings → Community plugins → BRAT** → **Add Beta plugin** → `https://github.com/semyon-alekseev-noveo/tt-sync`.
4. Set tracking to branch **`abyss-mapping`** (BRAT plugin settings or “Switch version” for this plugin).
5. **Enable** **TickTickSync (Abyss fork)** (`tickticksync-abyss`).
6. Reload Obsidian if BRAT does not pull files immediately.

BRAT installs into:

`.obsidian/plugins/tickticksync-abyss/`

(`main.js`, `manifest.json`, `styles.css`).

## Migrate settings from community `tickticksync`

Plugin data lives in **`data.json`** next to the plugin files. The vault redo journal (`.tickticksync/journal/`) is **unchanged** — it is vault data, not the plugin folder id.

**Option A — rename folder (keeps token, GTD preset, devices)**

```bash
VAULT="/path/to/your/vault"
OLD="$VAULT/.obsidian/plugins/tickticksync"
NEW="$VAULT/.obsidian/plugins/tickticksync-abyss"

# Disable both plugins in Obsidian first.
mkdir -p "$(dirname "$NEW")"
if [ -d "$OLD" ] && [ ! -d "$NEW" ]; then
  mv "$OLD" "$NEW"
fi
# Then run BRAT update or copy fresh main.js/manifest.json/styles.css into $NEW
```

Edit `.obsidian/community-plugins.json`: replace `"tickticksync"` with `"tickticksync-abyss"`.

**Option B — BRAT fresh install + copy data only**

1. Let BRAT create `.obsidian/plugins/tickticksync-abyss/`.
2. Copy `data.json` from the old folder:

   `cp .obsidian/plugins/tickticksync/data.json .obsidian/plugins/tickticksync-abyss/data.json`

3. Remove the old plugin from `community-plugins.json` and delete `.obsidian/plugins/tickticksync/` when done.

## Local development build

From the repo root:

```bash
npm run build
```

Copy `dist/` contents to:

`.obsidian/plugins/tickticksync-abyss/`

(`vite` copies `manifest.json` into `dist/` in production builds.)

## Do not mix ids

- Do not enable **both** `tickticksync` and `tickticksync-abyss` in the same vault.
- Do not install the fork under the community folder name; community updates target `tickticksync` only.

## Upstream docs

Behavior and UI largely match upstream: [TickTickSync docs](https://thesamim.github.io/TickTickSync/). Fork-specific behavior is documented in `PO_STATUS.md`, `GTD_SYNC_RESEARCH.md`, and `CHANGELOG.md`.
