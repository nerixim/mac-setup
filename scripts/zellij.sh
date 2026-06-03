#!/usr/bin/env bash
set -eux

BASEDIR="$(cd "$(dirname "$0")" && pwd)"

brew install zellij
mkdir -p ~/.config/zellij
cp "${BASEDIR}/../config/zellij.kdl" ~/.config/zellij/config.kdl

echo "zellij installed. Try it: zellij   (detach: Ctrl-o d / quit: Ctrl-q)"
