#!/usr/bin/env bash
# Refresh vendored VoltAgent/awesome-design-md catalog + personal Cursor skill copy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "→ Cloning VoltAgent/awesome-design-md (sparse design-md/)…"
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/VoltAgent/awesome-design-md.git "$TMP/awesome-design-md"
(
  cd "$TMP/awesome-design-md"
  git sparse-checkout init --cone
  git sparse-checkout set --no-cone 'design-md/**' '/README.md' '/LICENSE'
)

DEST="$ROOT/vendor/awesome-design-md"
rm -rf "$DEST"
mkdir -p "$ROOT/vendor"
cp -R "$TMP/awesome-design-md" "$DEST"
rm -rf "$DEST/.git"

python3 - <<PY
from pathlib import Path
root = Path("$DEST") / "design-md"
brands = sorted(p.name for p in root.iterdir() if p.is_dir() and (p / "DESIGN.md").exists())
lines = [
    "# Awesome DESIGN.md catalog",
    "",
    f"{len(brands)} brand systems from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md).",
    "",
    "Each brand folder contains \`DESIGN.md\` (+ optional \`preview.html\` / \`preview-dark.html\`).",
    "",
    "| Slug | Path |",
    "| --- | --- |",
]
for b in brands:
    lines.append(f"| \`{b}\` | \`vendor/awesome-design-md/design-md/{b}/DESIGN.md\` |")
(Path("$DEST") / "CATALOG.md").write_text("\n".join(lines) + "\n")
print(f"→ Indexed {len(brands)} brands")
PY

PERSONAL="${HOME}/.cursor/skills/awesome-design-md"
mkdir -p "$PERSONAL"
rsync -a --delete "$DEST/design-md/" "$PERSONAL/design-md/"
cp "$DEST/README.md" "$DEST/LICENSE" "$DEST/CATALOG.md" "$PERSONAL/" 2>/dev/null || true
# Rewrite catalog paths for personal skill
python3 - <<PY
from pathlib import Path
p = Path("$PERSONAL") / "CATALOG.md"
if p.exists():
    p.write_text(p.read_text().replace("vendor/awesome-design-md/design-md/", "design-md/"))
PY

# Keep project skill SKILL.md; refresh personal SKILL if missing
if [[ ! -f "$PERSONAL/SKILL.md" && -f "$ROOT/.cursor/skills/awesome-design-md/SKILL.md" ]]; then
  cp "$ROOT/.cursor/skills/awesome-design-md/SKILL.md" "$PERSONAL/SKILL.md"
fi

echo "✓ Synced → $DEST"
echo "✓ Personal skill → $PERSONAL"
du -sh "$DEST" "$PERSONAL"
