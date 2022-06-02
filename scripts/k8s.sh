#!/usr/bin/env bash -eux

HOMEBREW_BUNDLE_FILE=k8s.brew brew bundle
echo "source <(kubectl completion zsh)" >> ~/.zshrc
