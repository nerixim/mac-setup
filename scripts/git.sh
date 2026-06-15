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

if [ -f ~/.aliases ]; then
  aliases_tmp=$(mktemp)
  grep -v '^alias git-prune-merged=' ~/.aliases >"${aliases_tmp}" || true
  mv "${aliases_tmp}" ~/.aliases
fi

block_once ~/.aliases git-prune-merged <<'EOF'
function git-prune-merged() {
  local protected='^(master|main|dev|develop)$'
  local deleted=0
  local skipped=0
  local branch
  local branches
  local current_root
  local worktree_path
  local worktrees

  current_root=$(git rev-parse --show-toplevel)

  worktrees=$(git worktree list --porcelain | awk '
    /^worktree / { worktree_path = substr($0, 10) }
    /^branch refs\/heads\// { print substr($0, 19) "\t" worktree_path }
  ')
  while IFS=$'\t' read -r branch worktree_path; do
    [[ -z "$branch" || "$branch" =~ $protected || "$worktree_path" == "$current_root" ]] && continue
    git branch -vv --list "$branch" | rg -q '\[.*: gone\]' || continue

    if [[ -n "$(git -C "$worktree_path" status --porcelain)" ]]; then
      echo "Skipping $branch: worktree has local changes at $worktree_path"
      skipped=1
      continue
    fi

    git worktree remove "$worktree_path" && git branch -D -- "$branch" && deleted=1
  done <<< "$worktrees"

  branches=$(git branch --merged | rg -v '^[*+]' | sed 's/^ *//' | rg -v "$protected" || true)
  for branch in ${(f)branches}; do
    [[ -z "$branch" ]] && continue
    git branch -d -- "$branch" && deleted=1
  done

  branches=$(git branch -vv | rg -v '^[*+]' | rg '\[.*: gone\]' | sed 's/^ *//' | awk '{print $1}' | rg -v "$protected" || true)
  for branch in ${(f)branches}; do
    [[ -z "$branch" ]] && continue
    git show-ref --verify --quiet "refs/heads/$branch" || continue
    git branch -D -- "$branch" && deleted=1
  done

  if (( deleted == 0 && skipped == 0 )); then
    echo "No merged or gone branches to delete."
  fi
}
EOF
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
