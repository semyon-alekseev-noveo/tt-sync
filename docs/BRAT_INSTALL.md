# Install the Abyss fork via BRAT

The community plugin id is `tickticksync`. This fork uses **`tickticksync-abyss`** so Obsidian’s community catalog and “Update all” will not replace your custom build.

## Requirements

- [BRAT](https://github.com/TfTHacker/obsidian42-brat) (`obsidian42-brat`) **v1.1.0 or newer** enabled in the vault.
- GitHub repo [semyon-alekseev-noveo/tt-sync](https://github.com/semyon-alekseev-noveo/tt-sync) with at least one **GitHub Release** that includes `main.js`, `manifest.json`, and `styles.css` as release assets (published by the [Release Obsidian plugin](https://github.com/semyon-alekseev-noveo/tt-sync/actions/workflows/release.yml) workflow).

BRAT does **not** compile the plugin from source. Since BRAT v1.1.0 it installs from **release assets**, not from files on a git branch. Branch **`abyss-mapping`** is where development happens; CI builds and tags produce the releases BRAT consumes.

## BRAT settings

| Field | Value |
|--------|--------|
| Repository | `https://github.com/semyon-alekseev-noveo/tt-sync` |
| Track | **Latest** release (default), or a **frozen** release tag in BRAT’s edit dialog |
| Plugin id | `tickticksync-abyss` (from the release `manifest.json`; BRAT reads it after install) |

In BRAT: **Add a beta plugin** → paste the repository URL → leave version on **latest** (or pick a frozen tag) → enable **TickTickSync (Abyss fork)** under **Community plugins**.

Open plugin settings from **Settings → Community plugins → Installed** (the list of enabled plugins): use the **gear** on the **TickTickSync (Abyss fork)** row. The community catalog detail page for a beta plugin does not show that gear.

If BRAT reports **no releases**, publish the first release (see below), then use **Check for updates** or re-add the plugin.

Use release **2.0.17** or newer so the settings tab registers synchronously on plugin enable.

On Obsidian **1.13+**, plugin options also appear in the **left settings sidebar** (scroll below **Community plugins** → **TickTickSync**). If the Installed-list gear is missing, use command palette **Open TickTickSync settings** or that sidebar entry.

## Obsidian steps (new install)

1. **Disable** the official **TickTickSync** (`tickticksync`) if it is installed from the community catalog.
2. Optional but recommended: remove `.obsidian/plugins/tickticksync/` after you migrate settings (below).
3. Open **Settings → Community plugins → BRAT** → **Add Beta plugin** → `https://github.com/semyon-alekseev-noveo/tt-sync`.
4. Confirm a **release** exists on GitHub (not only the `abyss-mapping` branch). Use **latest** unless you need a frozen tag.
5. **Enable** **TickTickSync (Abyss fork)** (`tickticksync-abyss`).
6. Reload Obsidian if BRAT does not pull files immediately.

## First GitHub release (maintainers)

The release workflow builds `dist/` and uploads Obsidian plugin files to a GitHub Release.

**Option A — manual workflow (no local tag):**

1. Open [Actions → Release Obsidian plugin](https://github.com/semyon-alekseev-noveo/tt-sync/actions/workflows/release.yml).
2. **Run workflow** on branch `abyss-mapping`.
3. Leave **version** empty to use `manifest.json` (e.g. `2.0.15`), or set an explicit tag.
4. Keep **pre-release** checked for beta builds.

**Option B — git tag:**

```bash
git tag 2.0.15   # or v2.0.15 — must match manifest version semantics
git push tt-sync 2.0.15
```

Tag push runs the same workflow and creates the release automatically (`prerelease` is false for tag pushes).

After the first release, BRAT users only need **Add beta plugin** + **Check for updates**.

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
