#!/usr/bin/env bash -eux

echo 'source $(brew --prefix asdf)/libexec/asdf.sh' >> "${HOME}/.zsh_profile"

asdf plugin add nodejs
asdf plugin add ruby
asdf plugin add python
asdf plugin add poetry https://github.com/asdf-community/asdf-poetry.git
asdf plugin add golang
asdf plugin add terraform
# asdf plugin add direnv
asdf plugin add awscli

cp .tool-versions "$HOME"

echo 'legacy_version_file = yes' > "$HOME/.asdfrc"

cp .default-gems "$HOME"
cp .default-npm-packages "$HOME"
cp .default-python-packages "$HOME"
