#!/usr/bin/env bash
set -eux

# Install command-line tools using Homebrew.

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
. "${BASEDIR}/lib.sh"

# Ask for the administrator password upfront.
sudo -v
# Keep-alive: update existing `sudo` time stamp until the script has finished.
while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &

# Install Homebrew if missing.
if ! command -v brew >/dev/null 2>&1; then
  echo "Installing homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Activate brew for the rest of THIS script run. (Persistent activation for new
# shells is written to ~/.zsh_profile by zsh.sh.)
eval "$("${BREW}" shellenv)"

brew update
brew upgrade

# Install everything from the Brewfile (idempotent).
brew bundle --file="${BASEDIR}/../Brewfile"
