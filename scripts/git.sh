#!/usr/bin/env bash -eux

brew install gh
# gh auth login

git config --global user.name "Nikita Kamaev"
git config --global user.email "hiyori.amatsuki@gmail.com"
git config --global push.default current
git config --global pull.ff only
git config --global core.ignorecase false
git config --global color.ui true
git config --global core.quotepath false

git config --global alias.st status
git config --global alias.df diff
git config --global alias.co commit
git config --global alias.br branch
git config --global alias.ps push
git config --global alias.pl pull
git config --global alias.ck checkout
git config --global alias.graph "log --pretty=format:'%Cgreen[%cd] %Cblue%h %Cred<%cn> %Creset%s' --date=short  --decorate --graph --branches --tags --remotes"

echo 'alias git-prune-merged="git branch --merged | egrep -v '(^\*|master|main|dev|develop)' | xargs git branch -d"' >> ~/.aliases
echo 'alias git-pull-recursive="find . -type d -depth 1 -exec git --git-dir={}/.git --work-tree=$PWD/{} pull --prune \;"' >> ~/.aliases
