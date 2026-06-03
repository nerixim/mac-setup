#!/usr/bin/env bash
set -eux

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
. "${BASEDIR}/lib.sh"

append_once ~/.zsh_profile 'eval "$(/opt/homebrew/bin/mise activate zsh)"'

cp "${BASEDIR}/.mise.toml" "$HOME"
cp "${BASEDIR}/.default-gems" "$HOME"
cp "${BASEDIR}/.default-npm-packages" "$HOME"
cp "${BASEDIR}/.default-python-packages" "$HOME"

# set default rubocop config
ghq get nerixim/ruby-code-style
cp ~/ghq/github.com/nerixim/ruby-code-style/.base.rubocop.yml ~/.rubocop.yml

# for shell completion
mise use -g usage

cat <<'EOF'
To install all pinned runtimes:
  mise install

Bump runtimes later with:
  make mise-bump   # shows `mise outdated`, then `mise upgrade`

Rustup isn't managed by mise — install it manually:
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
EOF
