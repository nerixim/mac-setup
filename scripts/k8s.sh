#!/usr/bin/env bash -eux

brew install kubectl
echo "source <(kubectl completion zsh)" >> ~/.zshrc

brew install kustomize
brew install --cask lens
brew install stern
brew install k9s
