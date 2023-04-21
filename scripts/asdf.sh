#!/usr/bin/env bash -eux

echo 'source $(brew --prefix asdf)/libexec/asdf.sh' >>"${HOME}/.zsh_profile"

asdf plugin add nodejs || true
asdf plugin add ruby || true
asdf plugin add python || true
asdf plugin add poetry https://github.com/asdf-community/asdf-poetry.git || true
asdf plugin add golang || true
asdf plugin add terraform || true
# asdf plugin add direnv
# asdf plugin add awscli
asdf plugin-add java https://github.com/halcyon/asdf-java.git || true

BASEDIR="$(dirname "$0")/"
cp ${BASEDIR}/.tool-versions "$HOME"

echo 'legacy_version_file = yes' >"$HOME/.asdfrc"

cp ${BASEDIR}/.default-gems "$HOME"
cp ${BASEDIR}/.default-npm-packages "$HOME"
cp ${BASEDIR}/.default-python-packages "$HOME"

# set default rubocop config
ghq get nerixim/ruby-code-style
cp ~/ghq/github.com/nerixim/ruby-code-style/.base.rubocop.yml ~/.rubocop.yml
