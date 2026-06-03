#!/usr/bin/env bash
set -eux

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
. "${BASEDIR}/lib.sh"

HOMEBREW_BUNDLE_FILE="${BASEDIR}/k8s.brew" brew bundle
append_once ~/.zshrc "source <(kubectl completion zsh)"
