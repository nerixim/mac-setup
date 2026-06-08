#!/usr/bin/env bash
set -eux

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
. "${BASEDIR}/lib.sh"

# gh auth login

grep -q 'mac-setup-gitconfig' ~/.gitconfig 2>/dev/null || {
  printf '\n# mac-setup-gitconfig\n' >>~/.gitconfig
  cat "${BASEDIR}/../config/gitconfig" >>~/.gitconfig
}

# Prompt for identity (not committed in config/gitconfig). Skipped if already set.
if [ -z "$(git config --global --get user.name)" ]; then
  read -r -p "git user.name: " git_name
  git config --global user.name "$git_name"
fi
if [ -z "$(git config --global --get user.email)" ]; then
  echo "Tip: use your GitHub noreply (Settings > Emails) to keep your real address private,"
  echo "     e.g. 12345678+username@users.noreply.github.com"
  read -r -p "git user.email: " git_email
  git config --global user.email "$git_email"
fi
grep -q 'mac-setup-gitignore' ~/.gitignore 2>/dev/null || {
  printf '\n# mac-setup-gitignore\n' >>~/.gitignore
  cat "${BASEDIR}/../config/gitignore" >>~/.gitignore
}

append_once ~/.aliases "alias git-prune-merged=\"git branch --merged | egrep -v '(^\\*|master|main|dev|develop)' | xargs git branch -d\""
append_once ~/.aliases 'alias git-pull-recursive="find . -type d -depth 1 -exec git --git-dir={}/.git --work-tree=./{} pull --prune \;"'
append_once ~/.aliases 'alias lg=lazygit'

block_once ~/.aliases ghq-fzf <<'EOF'
function ghq-fzf() {
  local src=$(ghq list | fzf --preview "bat --color=always --style=header,grid --line-range :80 $(ghq root)/{}/README.*")
  if [ -n "$src" ]; then
    BUFFER="cd $(ghq root)/$src"
    zle accept-line
  fi
  zle -R -c
}
zle -N ghq-fzf
bindkey '^g' ghq-fzf
EOF

lazygit_cfg_dir=$(lazygit --print-config-dir)
mkdir -p "${lazygit_cfg_dir}"
cp "${BASEDIR}/../config/lazygit.yml" "${lazygit_cfg_dir}/config.yml"
