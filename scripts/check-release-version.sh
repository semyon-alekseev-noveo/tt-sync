#!/usr/bin/env bash
# PROC-RELEASE-GATE (#30): the release tag must equal manifest.json version,
# package.json version, and a key in versions.json.
#
# Run this before any step that rewrites dist/manifest.json. The release
# workflow does not stamp the tag onto dist/; Vite copies source manifest.json.
#
# Usage (repo root): TAG=2.0.93 bash scripts/check-release-version.sh
set -euo pipefail

TAG="${TAG:-}"

if [ -z "$TAG" ]; then
	echo "TAG is required" >&2
	exit 1
fi

# One token. Allows 2.0.93 and 2.0.94-pilot.1. Rejects whitespace (grep would
# otherwise accept the first line of a multi-line string). A leading v fails
# the equality check below: v2.0.93 ≠ manifest version 2.0.93.
case "$TAG" in
"" | *[!0-9A-Za-z.+-]*)
	echo "Release tag must be a single version token without whitespace." >&2
	exit 1
	;;
esac

for f in manifest.json package.json versions.json; do
	if [ ! -f "$f" ]; then
		echo "Missing ${f}" >&2
		exit 1
	fi
done

MANIFEST=$(jq -r '.version' manifest.json)
PKG=$(jq -r '.version' package.json)

if [ "$TAG" != "$MANIFEST" ] || [ "$TAG" != "$PKG" ]; then
	echo "Version mismatch: tag=${TAG} manifest=${MANIFEST} package=${PKG}" >&2
	exit 1
fi

if ! jq -e --arg v "$TAG" 'has($v)' versions.json >/dev/null; then
	echo "versions.json has no key ${TAG} (version-bump.mjs writes this key)" >&2
	exit 1
fi

echo "Version match: tag=${TAG} manifest=${MANIFEST} package=${PKG} versions.json key present"
