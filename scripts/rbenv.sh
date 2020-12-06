#!/usr/bin/env bash -eux

brew install rbenv
rbenv init

echo 'eval "$(rbenv init -)"' >> ~/.zsh_profile
# homebrewなどでバイナリーをダウンロードして~/.rbenv/versions/x.x.x/binに配置したらビルドしなくてもよい
