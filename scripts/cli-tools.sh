#!/usr/bin/env bash -eux

brew install git tig gitmoji

echo 'export PATH=/usr/local/bin/git:$PATH' >> ~/.zshrc

brew install tree bat htop
brew install thefuck

brew install httpie jq
