#!/usr/bin/env bash -eux

brew install kubectl
echo "source <(kubectl completion zsh)" >> ~/.zshrc
