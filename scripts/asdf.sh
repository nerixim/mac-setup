#!/usr/bin/env bash -eux

brew install \
  coreutils automake autoconf openssl \
  libyaml readline libxslt libtool unixodbc \
  unzip curl gpg \
  asdf

echo 'source $(brew --prefix asdf)/asdf.sh' >> "${HOME}/.zsh_profile"

asdf plugin add nodejs
asdf plugin add ruby
asdf plugin add python
asdf plugin add poetry https://github.com/asdf-community/asdf-poetry.git
asdf plugin add golang
asdf plugin add terraform
# asdf plugin add direnv
asdf plugin add awscli

cat << EOF >> "$HOME/.tool-versions"
ruby 3.1.0 system
nodejs 16.13.2 system
python 3.9.4 system
golang 1.16.4
EOF

echo 'legacy_version_file = yes' > "$HOME/.asdfrc"

cat << EOF >> "$HOME/.default-gems"
bundler
pry
solargraph
rubocop
rubocop-rspec
rubocop-rake
rubocop-rails
rubocop-performance
EOF

cat << EOF >> "$HOME/.default-npm-packages"
yarn
typescript
ts-node
typesync
aws-cdk
esbuild
EOF

cat << EOF >> "$HOME/.default-python-packages"
boto3
ipython
black
EOF
