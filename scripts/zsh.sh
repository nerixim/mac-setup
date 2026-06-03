#!/usr/bin/env bash
set -eux

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
. "${BASEDIR}/lib.sh"

brew install zsh zsh-completions

# Use Homebrew zsh as login shell (Apple Silicon: /opt/homebrew).
BREW_ZSH="${HOMEBREW_PREFIX}/bin/zsh"
if ! grep -qxF "${BREW_ZSH}" /etc/shells; then
  echo "${BREW_ZSH}" | sudo tee -a /etc/shells
fi
[ "$SHELL" = "${BREW_ZSH}" ] || chsh -s "${BREW_ZSH}"

# oh-my-zsh
if [ ! -d "${HOME}/.oh-my-zsh" ]; then
  sh -c "$(curl -fsSL https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" "" --unattended
fi

ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
clone_once() { [ -d "$2" ] || git clone --depth=1 "$1" "$2"; }
clone_once https://github.com/romkatv/powerlevel10k.git            "${ZSH_CUSTOM}/themes/powerlevel10k"
clone_once https://github.com/zsh-users/zsh-autosuggestions        "${ZSH_CUSTOM}/plugins/zsh-autosuggestions"
clone_once https://github.com/zsh-users/zsh-syntax-highlighting.git "${ZSH_CUSTOM}/plugins/zsh-syntax-highlighting"

# ---- configure ~/.zshrc (oh-my-zsh writes a default one we patch in place) ----
# Restore the tuned Powerlevel10k prompt config instead of re-running `p10k configure`.
cp "${BASEDIR}/../config/p10k.zsh" ~/.p10k.zsh
if [ -f ~/.zshrc ]; then
  # macOS/BSD sed needs the empty backup-extension arg.
  sed -i '' 's|^ZSH_THEME=.*|ZSH_THEME="powerlevel10k/powerlevel10k"|' ~/.zshrc
  sed -i '' 's|^plugins=.*|plugins=(git gitfast docker docker-compose aws brew terraform kubectl colored-man-pages zsh-autosuggestions yarn pip zsh-syntax-highlighting macos mise)|' ~/.zshrc
fi
append_once ~/.zshrc '[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh'

# ---- aliases ----
# NOTE: grep/find are intentionally NOT aliased to ripgrep/fd — those tools are
# not flag-compatible and break muscle memory and scripts. Use `rg` / `fd` directly.
append_once ~/.aliases 'alias b="bundle"'
append_once ~/.aliases 'alias be="bundle exec"'
append_once ~/.aliases 'alias pip="pip3"'
append_once ~/.aliases 'alias ls="eza"'
append_once ~/.aliases 'alias cat="bat"'
append_once ~/.aliases 'alias ps="procs"'
append_once ~/.aliases 'alias df="duf"'
append_once ~/.aliases 'alias du="dust"'
append_once ~/.aliases 'alias top="htop"'
append_once ~/.aliases 'alias d="docker"'
append_once ~/.aliases 'alias dc="docker compose"'
append_once ~/.aliases "alias dcps=\"docker compose ps --format 'table {{.Service}} | {{.State}} | {{range .Publishers}}{{.URL}}:{{.PublishedPort}}{{end}}'\""

# ---- shell rc wiring ----
append_once ~/.zshrc 'source ~/.zsh_profile'
append_once ~/.zshrc 'source ~/.aliases'

block_once ~/.zsh_profile zsh-profile-base <<'EOF'
export LANG="en_US.UTF-8"
export GOPATH=$HOME/go
export PATH="$PATH:$GOPATH/bin:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
export EDITOR="code -w"
# Homebrew (Apple Silicon)
eval "$(/opt/homebrew/bin/brew shellenv)"
eval "$(zoxide init zsh)"
eval "$(thefuck --alias f)"
setopt auto_cd
unsetopt nomatch  # let next.js-style globs with [] pass through
# Secrets live outside the repo; sourced if present so ~/.zshrc is safe to share.
[ -f ~/.secrets ] && source ~/.secrets
EOF

cat <<'EOF'
*************
ZSH_THEME, plugins, and ~/.p10k.zsh are configured automatically.

One manual step remains — Homebrew completions must be on FPATH BEFORE
`source $ZSH/oh-my-zsh.sh` (so oh-my-zsh's compinit picks them up). Add near the
top of ~/.zshrc, before that line:

  FPATH="$(brew --prefix)/share/zsh/site-functions:${FPATH}"
*************
EOF
