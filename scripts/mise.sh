#!/usr/bin/env bash -eux

echo 'eval "$(/opt/homebrew/bin/mise activate zsh)"' >>~/.zsh_profile

BASEDIR="$(dirname "$0")/"
cp ${BASEDIR}/.mise.toml "$HOME"

cp ${BASEDIR}/.default-gems "$HOME"
cp ${BASEDIR}/.default-npm-packages "$HOME"
cp ${BASEDIR}/.default-python-packages "$HOME"

# set default rubocop config
ghq get nerixim/ruby-code-style
cp ~/ghq/github.com/nerixim/ruby-code-style/.base.rubocop.yml ~/.rubocop.yml

# for shell completion
mise use -g usage

echo <<~'EOF'
To install all runtimes, run install:
mise install

Rustup insn't included, install it manually:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
EOF
