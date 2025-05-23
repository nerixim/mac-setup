#!/usr/bin/env bash -eux

brew install zsh zsh-completions

echo "/usr/local/bin/zsh" | sudo tee -a /etc/shells

sudo ln -s /usr/local/bin/zsh /usr/local/bin
chsh -s /usr/local/bin/zsh

curl -L https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh | sh

## no more necessary
# git clone https://github.com/powerline/fonts
# ./fonts/install.sh
# rm -rf fonts

# iTerm2のフォントを変更する
# 1. iTerm2 > Preferences > Profiles > Text
# 2. Change Fontボタンをクリックする
# 3. Collectionで日本語を選択する
# 4. FamilyでD2Coding for Powerlineを選択する
##

git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
# Set ZSH_THEME="powerlevel10k/powerlevel10k" in ~/.zshrc.

# enable natural text selection manually
# iTerm → Preferences → Profiles → Keys → Presets... → Import

git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
# iTermでSolarized Darkを使っている場合は背景色を少し暗くする必要あり
# https://github.com/zsh-users/zsh-autosuggestions/issues/416#issuecomment-503457366

git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# oh-my-zsh plugins (~/.zshrc)
echo 'Add oh-my-zsh plugins as necessary'
echo 'plugins=(git gitfast docker docker-compose aws brew terraform kubectl colored-man-pages zsh-autosuggestions yarn pip zsh-syntax-highlighting macos)'

# homebrewのcompletionsをohmyzshがロードする前に初期化する必要がある
# https://docs.brew.sh/Shell-Completion#configuring-completions-in-zsh

cat <<'EOF' >>~/.aliases
alias b="bundle"
alias be="bundle exec"
alias pip="pip3"
alias ls="eza"
alias cat="bat"
alias ps="procs"
alias df="duf"
alias du="dust"
alias find="fd"
alias grep="ripgrep"
alias top="htop"
alias d="docker"
alias dc="docker compose"
alias dcps="docker compose ps --format 'table {{.Service}} | {{.State}} | {{range .Publishers}}{{.URL}}:{{.PublishedPort}}{{end}}'"
EOF

cat <<'EOF' >>~/.zshrc
source ~/.zsh_profile
source ~/.aliases
EOF

cat <<'EOF' >>~/.zsh_profile
export LANG="en_US.UTF-8"
export GOPATH=$HOME/go
export PATH="$PATH:$GOPATH/bin:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"
export EDITOR="code -w"
eval "$(zoxide init zsh)"
EOF

cat <<'EOF'
*************
Setup completions:
Add following BEFORE source $ZSH/oh-my-zsh.sh

FPATH="$(brew --prefix)/share/zsh/site-functions:${FPATH}"
rm -f ~/.zcompdump; compinit
*************
EOF

echo '$(thefuck --alias f)' >>~/.zsh_profile
eval $(thefuck --alias f)

setopt auto_cd
