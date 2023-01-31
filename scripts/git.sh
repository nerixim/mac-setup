#!/usr/bin/env bash -eux

# brewでインストールしたgitを使う
echo 'export PATH=/usr/local/bin/git:$PATH' >> ~/.zshrc

# gh auth login

BASEDIR="$(dirname "$0")/.."

cat ${BASEDIR}/config/gitconfig >> ~/.gitconfig
cat ${BASEDIR}/config/gitignore >> ~/.gitignore

cat << 'EOF' >> ~/.aliases
alias git-prune-merged="git branch --merged | egrep -v '(^\*|master|main|dev|develop)' | xargs git branch -d"
alias git-pull-recursive="find . -type d -depth 1 -exec git --git-dir={}/.git --work-tree=/Users/nikita/github.com/cambia-inc/cambia/backend/{} pull --prune \;"
EOF