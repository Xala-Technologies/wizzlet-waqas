#!/usr/bin/env bash
# Refresh optional /brag launch-video skills (https://github.com/latent-spaces/brag)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use 24 >/dev/null 2>&1 || nvm use node >/dev/null 2>&1 || true
fi
npx --yes skills add https://github.com/latent-spaces/brag --agent cursor --skill brag --skill brag-slim --copy -y
for name in brag brag-slim; do
  rm -rf ".cursor/skills/$name" "${HOME}/.cursor/skills/$name"
  rsync -a ".agents/skills/$name/" ".cursor/skills/$name/"
  rsync -a ".agents/skills/$name/" "${HOME}/.cursor/skills/$name/"
done
echo "✓ /brag skills synced — use only when making a launch video"
