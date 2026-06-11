#!/usr/bin/env bash
# Non-destructive drift report: brew formulae/casks installed on this machine but
# not in the Brewfile, minus anything listed in scripts/.brew-ignore.
# Nothing is installed or removed — it only shows what you might promote into the
# Brewfile. Run via `make brew-diff`.
set -uo pipefail

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
BREWFILE="$(dirname "$BASEDIR")/Brewfile"
IGNORE="${BASEDIR}/.brew-ignore"

names_from() { grep -E "^$1 '" "$BREWFILE" | sed -E "s/^$1 '([^']+)'.*/\1/; s#.*/##" | sort -u; }
ignored() { grep -vE '^[[:space:]]*#|^[[:space:]]*$' "$IGNORE" 2>/dev/null | sort -u; }

echo "# Formulae installed but not in Brewfile (excluding .brew-ignore):"
brew leaves --installed-on-request | sed 's#.*/##' | sort -u \
  | comm -23 - <(names_from brew) | comm -23 - <(ignored) \
  | sed "s/^/  brew '/; s/\$/'/"
echo
echo "# Casks installed but not in Brewfile (excluding .brew-ignore):"
brew list --cask | sort -u \
  | comm -23 - <(names_from cask) | comm -23 - <(ignored) \
  | sed "s/^/  cask '/; s/\$/'/"
echo
echo "# Track one: paste the line into the Brewfile. Silence one: add its name to"
echo "# scripts/.brew-ignore."
