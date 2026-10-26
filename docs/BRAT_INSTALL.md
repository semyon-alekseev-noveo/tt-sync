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
| Pilot track | **latest**, or a **frozen** prerelease tag while testing a PR build |
| Live track | **frozen** to the last non-prerelease tag (for example `2.0.93`). Do not use **latest** |
| Plugin id | `tickticksync-abyss` (from the release `manifest.json`; BRAT reads it after install) |

In BRAT: **Add a beta plugin** → paste the repository URL → set the version (see below) → enable **TickTickSync (Abyss fork)** under **Community plugins**. Change the track later with the **edit** button on that row (latest vs a frozen tag).

## Pilot vault vs live vault

BRAT’s **latest** track picks the highest semver among GitHub Releases **and pre-releases** ([BRAT developer guide](https://github.com/TfTHacker/obsidian42-brat/blob/main/BRAT-DEVELOPER-GUIDE.md)). GitHub’s own “latest” badge skips pre-releases. BRAT does not. A pilot pre-release `2.0.94` therefore sorts above stable `2.0.93` and **latest** will install it.

| Vault | BRAT version | What it installs |
|--------|----------------|------------------|
| **Pilot** | **latest** when the owner wants PR pre-releases, or **frozen** to one pre-release tag | Highest semver, including a `workflow_dispatch` build marked pre-release |
| **Live** | **frozen** to the last tag that is **not** a pre-release | That tag only. Move the frozen tag after the next live release from `abyss-mapping` |

The live vault must not track pre-releases. Leave it frozen. Do not point it at a pre-release tag. Do not leave it on **latest** while any higher pre-release exists.

A pre-release is cut from Actions → Release Obsidian plugin → **Run workflow** with **pre-release** checked (the default). That path may build an open PR. A tag push on `abyss-mapping` publishes a normal release and is what the live frozen tag should move to. Details: `DEV_FLOW.md` § Versioning and releases.

Open plugin settings from **Settings → Community plugins → Installed** (the list of enabled plugins): use the **gear** on the **TickTickSync (Abyss fork)** row. The community catalog detail page for a beta plugin does not show that gear.

If BRAT reports **no releases**, publish the first release (see below), then use **Check for updates** or re-add the plugin.

Use release **2.0.17** or newer so the settings tab registers synchronously on plugin enable.

On Obsidian **1.13+**, plugin options also appear in the **left settings sidebar** (scroll below **Community plugins** → **TickTickSync**). If the Installed-list gear is missing, use command palette **Open TickTickSync settings** or that sidebar entry.

## Obsidian steps (new install)

1. **Disable** the official **TickTickSync** (`tickticksync`) if it is installed from the community catalog.
2. Optional but recommended: remove `.obsidian/plugins/tickticksync/` after you migrate settings (below).
3. Open **Settings → Community plugins → BRAT** → **Add Beta plugin** → `https://github.com/semyon-alekseev-noveo/tt-sync`.
4. Confirm a **release** exists on GitHub (not only the `abyss-mapping` branch). Pilot may use **latest**. The live vault freezes to a non-prerelease tag (see above).
5. **Enable** **TickTickSync (Abyss fork)** (`tickticksync-abyss`).
6. Reload Obsidian if BRAT does not pull files immediately.

## First GitHub release (maintainers)

The release workflow builds `dist/` and uploads Obsidian plugin files to a GitHub Release.

**Option A — manual workflow (no local tag):**

1. Open [Actions → Release Obsidian plugin](https://github.com/semyon-alekseev-noveo/tt-sync/actions/workflows/release.yml).
2. **Run workflow** on `abyss-mapping` for a live release, or on the PR branch for a pilot pre-release.
3. Leave **version** empty to use `manifest.json`, or set an explicit tag. The tag must equal `manifest.json`, `package.json`, and a `versions.json` key (`2.0.93`, not `v2.0.93`).
4. **Pre-release** checked (default): pilot build. The ancestor check is skipped. Tests and the version / existing-release checks still run.
5. **Pre-release** unchecked: live release. The commit must already be on `abyss-mapping`.

**Option B — git tag (live release):**

```bash
git tag 2.0.93   # must equal manifest.json version; no v prefix
git push tt-sync 2.0.93
```

Tag push runs the same workflow. It is not a pre-release, and it fails unless that commit is an ancestor of `origin/abyss-mapping`, the version files match, tests pass, and the tag has no GitHub Release yet.

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
