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
asdf plugin add golang
asdf plugin add terraform
# asdf plugin add direnv
asdf plugin add awscli

cat << EOF >> "$HOME/.tool-versions"
ruby 3.0.1 system
nodejs 16.1.0 system
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
EOF

cat << EOF >> "$HOME/.default-python-packages"
boto3
ipython
EOF
