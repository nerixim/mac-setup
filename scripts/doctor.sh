#!/usr/bin/env bash
# Verifies the machine matches the desired setup state. Read-only — never changes
# anything. Run it any time (`make doctor`) instead of trying to remember the
# TODO comments. Each failing check prints the exact fix.
set -u

pass=0 fail=0
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; pass=$((pass+1)); }
no()   { printf '  \033[31m✗\033[0m %s\n     ↳ fix: %s\n' "$1" "$2"; fail=$((fail+1)); }

section() { printf '\n\033[1m%s\033[0m\n' "$1"; }

section "Homebrew"
if [ -x /opt/homebrew/bin/brew ]; then ok "brew installed at /opt/homebrew"
else no "brew not at /opt/homebrew" "make homebrew"; fi
command -v brew >/dev/null && [ "$(brew --prefix 2>/dev/null)" = /opt/homebrew ] \
  && ok "brew on PATH (Apple Silicon prefix)" \
  || no "brew not active in this shell" 'eval "$(/opt/homebrew/bin/brew shellenv)"'

section "Shell"
[ "$SHELL" = /opt/homebrew/bin/zsh ] \
  && ok "login shell is Homebrew zsh" \
  || no "login shell is $SHELL" "chsh -s /opt/homebrew/bin/zsh"
if grep -qE '^\s*alias (grep|find)=' ~/.aliases 2>/dev/null; then
  no "grep/find aliased (breaks scripts & muscle memory)" "remove the alias from ~/.aliases"
else ok "no grep/find aliases"; fi
grep -q 'source ~/.aliases' ~/.zshrc 2>/dev/null && ok "~/.aliases sourced" || no "~/.aliases not sourced" "make zsh"
[ -f ~/.p10k.zsh ] && ok "~/.p10k.zsh present (prompt config)" || no "~/.p10k.zsh missing" "make zsh"
grep -q 'powerlevel10k/powerlevel10k' ~/.zshrc 2>/dev/null && ok "p10k theme set" || no "ZSH_THEME not powerlevel10k" "make zsh"

section "Secrets hygiene"
if grep -rqE '(ghp_|github_pat_|gho_|AKIA)[A-Za-z0-9]' ~/.zshrc ~/.zsh_profile 2>/dev/null; then
  no "plaintext token in ~/.zshrc or ~/.zsh_profile" "move it to ~/.secrets (chmod 600) and rotate it"
else ok "no obvious tokens in shell rc files"; fi
[ -f ~/.secrets ] && ok "~/.secrets present" || printf '  \033[33m–\033[0m ~/.secrets not present (fine if you have no secrets)\n'

section "Trackpad (right-click)"
v=$(defaults -currentHost read com.apple.AppleMultitouchTrackpad TrackpadCornerSecondaryClick 2>/dev/null || echo unset)
[ "$v" = 2 ] \
  && ok "bottom-right corner = secondary click (currentHost)" \
  || no "corner right-click not set in currentHost domain (=$v)" "make osx-preferences  # then log out/in"

section "Runtimes (mise)"
if command -v mise >/dev/null; then
  ok "mise installed"
  mise current 2>/dev/null | sed 's/^/     /' || true
else no "mise not installed" "make mise"; fi

section "iTerm2 profile"
[ -f "$HOME/Library/Application Support/iTerm2/DynamicProfiles/nerzie.json" ] \
  && ok "dynamic profile 'nerzie' installed" \
  || no "iTerm dynamic profile missing" "make iterm"

section "Core CLI tools"
for t in rg fd eza bat delta lazygit gh ghq fzf zoxide jq yq direnv; do
  command -v "$t" >/dev/null && ok "$t" || no "$t missing" "brew install $t"
done

printf '\n\033[1mSummary:\033[0m %d ok, %d to fix\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
