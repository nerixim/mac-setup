#!/usr/bin/env bash -eux

brew install zsh zsh-completions

sudo echo "/etc/shells" >> /etc/shells
chsh -s /usr/local/bin/zsh

curl -L https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh | sh

git clone https://github.com/powerline/fonts
./fonts/install.sh
rm -rf fonts

# iTerm2のフォントを変更する
# 1. iTerm2 > Preferences > Profiles > Text
# 2. Change Fontボタンをクリックする
# 3. Collectionで日本語を選択する
# 4. FamilyでD2Coding for Powerlineを選択する

git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
# Set ZSH_THEME="powerlevel10k/powerlevel10k" in ~/.zshrc.

# enable natural text selection manually
# iTerm → Preferences → Profiles → Keys → Presets... → Natural Text Editing

git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
# iTermでSolarized Darkを使っている場合は背景色を少し暗くする必要あり
# https://github.com/zsh-users/zsh-autosuggestions/issues/416#issuecomment-503457366

# oh-my-zsh plugins (~/.zshrc)
# plugins=(git docker docker-compose aws brew terraform kubectl colored-man-pages zsh-autosuggestions)