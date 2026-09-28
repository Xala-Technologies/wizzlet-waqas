#!/usr/bin/env bash
# Refresh Taste Skill pack from https://www.tasteskill.dev/ (Leonxlnx/taste-skill)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# Prefer Node 24+ when available (skills CLI)
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use 24 >/dev/null 2>&1 || nvm use node >/dev/null 2>&1 || true
fi

echo "→ Installing Leonxlnx/taste-skill (all skills → Cursor)…"
npx --yes skills add Leonxlnx/taste-skill --agent cursor --skill '*' --copy -y

echo "→ Mirroring .agents/skills → .cursor/skills + ~/.cursor/skills…"
for d in .agents/skills/*/; do
  [[ -d "$d" ]] || continue
  name="$(basename "$d")"
  case "$name" in
    impeccable|awesome-design-md|design-fidelity-qa) continue ;;
  esac
  rm -rf ".cursor/skills/$name"
  rsync -a "$d" ".cursor/skills/$name/"
  rm -rf "${HOME}/.cursor/skills/$name"
  rsync -a "$d" "${HOME}/.cursor/skills/$name/"
done

echo "✓ Taste Skill synced"
ls .cursor/skills | sed 's/^/  - /'
echo "Reload Cursor to pick up skill changes."
