#!/usr/bin/env bash
set -eux

# Symlink the dotfiles under stow/home/ into $HOME via GNU stow, so the repo file
# IS the live file (edit once, no copy/write-back drift). Covers: .default-gems,
# .default-npm-packages, .default-python-packages, .p10k.zsh, .config/zellij/.
BASEDIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(dirname "$BASEDIR")"

brew install stow

# --restow is idempotent on re-runs (re-creates existing symlinks).
stow --dir="${REPO}/stow" --target="$HOME" --restow home
