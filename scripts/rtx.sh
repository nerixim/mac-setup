#!/usr/bin/env bash -eux

echo 'eval "$(/opt/homebrew/bin/rtx activate zsh)"' >>~/.zsh_profile

BASEDIR="$(dirname "$0")/"
cp ${BASEDIR}/.rtx.toml "$HOME"

cp ${BASEDIR}/.default-gems "$HOME"
cp ${BASEDIR}/.default-npm-packages "$HOME"
cp ${BASEDIR}/.default-python-packages "$HOME"

# set default rubocop config
ghq get nerixim/ruby-code-style
cp ~/ghq/github.com/nerixim/ruby-code-style/.base.rubocop.yml ~/.rubocop.yml
