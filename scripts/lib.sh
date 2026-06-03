#!/usr/bin/env bash
# Shared helpers. Source this from other scripts: . "$(dirname "$0")/lib.sh"

# Apple Silicon only (per setup decision).
export HOMEBREW_PREFIX="/opt/homebrew"
export BREW="${HOMEBREW_PREFIX}/bin/brew"

# append_once <file> <line>
# Appends <line> to <file> only if an exact-match line is not already present.
# Makes the setup scripts safe to re-run.
append_once() {
  local file="$1" line="$2"
  [ -f "$file" ] || touch "$file"
  grep -qxF -- "$line" "$file" || printf '%s\n' "$line" >>"$file"
}

# block_once <file> <marker> <<'EOF' ... EOF
# Appends a heredoc block guarded by a unique marker comment, only once.
block_once() {
  local file="$1" marker="$2"
  [ -f "$file" ] || touch "$file"
  if ! grep -qF "# >>> ${marker} >>>" "$file"; then
    {
      printf '# >>> %s >>>\n' "$marker"
      cat
      printf '# <<< %s <<<\n' "$marker"
    } >>"$file"
  fi
}
