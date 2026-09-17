#!/usr/bin/env bash
set -eux

# Symlink the dotfiles under stow/home/ into $HOME via GNU stow, so the repo file
# IS the live file (edit once, no copy/write-back drift). Covers: .default-gems,
# .default-npm-packages, .default-python-packages, .p10k.zsh, .terraformrc,
# .config/zellij/, ~/.tmux.conf, and the shared coding-agent config: .claude/ (CLAUDE.md,
# settings.json, agents/, commands/, docs/, skills/, statusline.sh) plus
# .codex/AGENTS.md and .config/opencode/AGENTS.md, which are symlinks to
# .claude/CLAUDE.md inside the repo so every agent reads one file.
BASEDIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(dirname "$BASEDIR")"

brew install stow

# stow refuses to link over a real file (e.g. ~/.claude/settings.json that
# Claude Code created before this ran). Move such files aside instead of
# failing, so a second machine can `git pull && make stow` without cleanup.
BACKUP="${HOME}/.stow-backup/$(date +%Y%m%d-%H%M%S)"
(cd "${REPO}/stow/home" && find . \( -type f -o -type l \) -print) | while read -r rel; do
  target="${HOME}/${rel#./}"
  if [ -e "${target}" ] && [ ! -L "${target}" ]; then
    mkdir -p "${BACKUP}/$(dirname "${rel#./}")"
    mv "${target}" "${BACKUP}/${rel#./}"
    echo "moved existing ${target} -> ${BACKUP}/${rel#./}"
  fi
done

# --restow is idempotent on re-runs (re-creates existing symlinks).
# --no-folding links files one by one instead of symlinking whole directories:
# ~/.claude and ~/.config hold machine-local state next to the tracked files,
# and a folded ~/.config -> repo symlink would make mise.sh write into the repo.
stow --dir="${REPO}/stow" --target="$HOME" --restow --no-folding home
