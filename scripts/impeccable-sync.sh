#!/usr/bin/env bash
# Refresh vendored Impeccable Cursor skill from upstream (CLI bundle download is 404).
# Source: https://github.com/pbakaus/impeccable · https://impeccable.style/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "→ Sparse-cloning pbakaus/impeccable (.cursor/skills/impeccable)…"
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/pbakaus/impeccable.git "$TMP/impeccable"
(
  cd "$TMP/impeccable"
  git sparse-checkout init --cone
  git sparse-checkout set .cursor/skills/impeccable
)

SRC="$TMP/impeccable/.cursor/skills/impeccable"
DEST="$ROOT/.cursor/skills/impeccable"
test -f "$SRC/SKILL.md" || { echo "Missing SKILL.md in upstream sparse tree" >&2; exit 1; }

rm -rf "$DEST"
mkdir -p "$DEST"
rsync -a "$SRC/" "$DEST/"
chmod +x "$DEST/scripts/impeccable" 2>/dev/null || true

PERSONAL="${HOME}/.cursor/skills/impeccable"
mkdir -p "$PERSONAL"
rsync -a --delete "$DEST/" "$PERSONAL/"

echo "✓ Project skill → $DEST"
echo "✓ Personal skill → $PERSONAL"
du -sh "$DEST" "$PERSONAL"
echo "Reload Cursor, then run /impeccable init in chat if PRODUCT.md is missing."
