#!/usr/bin/env bash

asdf plugin-add java https://github.com/halcyon/asdf-java.git
# 2022/10の時点でv17までしか使えない
asdf install java openjdk-17.0.2
asdf global java openjdk-17.0.2
asdf reshim java

cat << 'EOF' >> ~/.zshrc
# Android
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin
EOF