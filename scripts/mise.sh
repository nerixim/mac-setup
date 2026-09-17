#!/usr/bin/env bash
set -eux

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
. "${BASEDIR}/lib.sh"

# version_ge HAVE NEED — true if HAVE >= NEED.
version_ge() {
  [ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | tail -n1)" = "$1" ]
}

# Latest npm this Node can run. Empty = skip (EOL, or too old for npm 11.10+).
# Node 20 LTS ended 2026-04-30. npm 11.10+ needs Node >= 22.9; npm 12 needs
# ^22.22.2 || ^24.15.0 || >=26.
npm_spec_for_node() {
  local ver="$1" major="${1%%.*}"
  [ "$major" -ge 22 ] || { echo ""; return; }
  if { [ "$major" -eq 22 ] && version_ge "$ver" 22.22.2; } \
    || { [ "$major" -eq 24 ] && version_ge "$ver" 24.15.0; } \
    || [ "$major" -ge 26 ]; then
    echo latest
    return
  fi
  if version_ge "$ver" 22.9.0; then
    echo 11
  else
    echo ""
  fi
}

# Install a current npm into every real mise Node prefix (skip version aliases).
refresh_mise_node_npm() {
  local installs="${HOME}/.local/share/mise/installs/node"
  [ -d "$installs" ] || return 0
  local dir ver spec npm_bin
  for dir in "$installs"/*/; do
    [ -e "$dir" ] || continue
    [ -L "${dir%/}" ] && continue
    ver=$(basename "$dir")
    [[ "$ver" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || continue
    spec=$(npm_spec_for_node "$ver")
    if [ -z "$spec" ]; then
      echo "skip node ${ver} (unsupported or too old for npm 11.10+)"
      continue
    fi
    npm_bin="${dir}bin/npm"
    if [ ! -x "$npm_bin" ]; then
      echo "skip node ${ver} (no npm)"
      continue
    fi
    echo "node ${ver} -> npm@${spec}"
    PATH="${dir}bin:${PATH}" "$npm_bin" install -g "npm@${spec}" --min-release-age=0
  done
}

# ~/.npmrc also holds registry tokens, so it is not stowed. Append the shared
# cooldown if the key is missing (do not clobber a different value).
ensure_min_release_age() {
  local npmrc="${HOME}/.npmrc"
  [ -f "$npmrc" ] || touch "$npmrc"
  grep -qE '^min-release-age=' "$npmrc" && return 0
  if [ -s "$npmrc" ] && [ "$(tail -c1 "$npmrc" | wc -l)" -eq 0 ]; then
    printf '\n' >>"$npmrc"
  fi
  cat "${BASEDIR}/../config/npmrc" >>"$npmrc"
}

if [ "${1:-}" = --refresh-npm ]; then
  ensure_min_release_age
  refresh_mise_node_npm
  exit 0
fi

# Activate at the END of ~/.zshrc so it runs after other PATH prepends.
# (activate_aggressive in the config also forces mise bins to the front.)
append_once ~/.zshrc 'eval "$(/opt/homebrew/bin/mise activate zsh)"'

mkdir -p ~/.config/mise
cp "${BASEDIR}/mise-config.toml" ~/.config/mise/config.toml
# .default-gems / .default-npm-packages / .default-python-packages are symlinked
# from stow/home/ by scripts/stow.sh (run `make stow`).

# The asdf pnpm plugin predates aqua in the registry. Its .mise.backend plus a
# `latest` -> 11.x symlink made `mise upgrade` keep 11 even after 12 shipped.
if mise plugin ls 2>/dev/null | grep -qx pnpm; then
  mise plugin remove pnpm
fi
rm -f "${HOME}/.local/share/mise/installs/pnpm/.mise.backend" \
  "${HOME}/.local/share/mise/installs/pnpm/.mise.backend.toml"

# Node's global npm bin sits on PATH ahead of mise's pnpm tool, so a leftover
# `npm i -g pnpm` hides whatever version mise installed.
if command -v npm >/dev/null; then
  npm uninstall -g pnpm pnpx >/dev/null 2>&1 || true
fi

# for shell completion
mise use -g usage

# pay-respects (`f` command corrector) has no brew formula — install via cargo.
# Needs the Rust toolchain (see the rustup note below); skipped if cargo is absent.
if command -v cargo >/dev/null; then
  cargo install pay-respects
fi

ensure_min_release_age
refresh_mise_node_npm

cat <<'EOF'
To install all pinned runtimes:
  mise install

Bump runtimes later with:
  make mise-bump   # shows `mise outdated`, then `mise upgrade` + npm refresh

Rustup isn't managed by mise — install it manually:
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
EOF
