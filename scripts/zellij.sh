#!/usr/bin/env bash
set -eux

BASEDIR="$(cd "$(dirname "$0")" && pwd)"

brew install zellij
# ~/.config/zellij/config.kdl is symlinked from stow/home/ by scripts/stow.sh.
"${BASEDIR}/stow.sh"

echo "zellij installed. Try it: zellij   (detach: Ctrl-o d / quit: Ctrl-q)"
