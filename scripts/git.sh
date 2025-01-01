#!/usr/bin/env bash -eux

# brewでインストールしたgitを使う
echo 'export PATH=/usr/local/bin/git:$PATH' >>~/.zshrc

# gh auth login

BASEDIR="$(dirname "$0")/.."

cat ${BASEDIR}/config/gitconfig >>~/.gitconfig
cat ${BASEDIR}/config/gitignore >>~/.gitignore

cat <<'EOF' >>~/.aliases
alias git-prune-merged="git branch --merged | egrep -v '(^\*|master|main|dev|develop)' | xargs git branch -d"
alias git-pull-recursive="find . -type d -depth 1 -exec git --git-dir={}/.git --work-tree=./{} pull --prune \;"
EOF

cat <<'EOF' >>~/.aliases
# ghq
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

cat <<'EOF' >>~/.aliases
alias lg=lazygit
EOF

lazygit_cfg_dir=$(lg --print-config-dir)
mkdir -p "${lazygit_cfg_dir}"
cp ${BASEDIR}/config/lazygit.yml "${lazygit_cfg_dir}/config.yml"
