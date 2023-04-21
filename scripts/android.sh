#!/usr/bin/env bash

_ANDROID_SDK_VERSION=33
_ANDROID_PLATFORM=x86_64
if [[ $(uname -m) == "arm64" ]]; then
  _ANDROID_PLATFORM=arm64-v8a
fi

asdf plugin-add java https://github.com/halcyon/asdf-java.git
# 2022/10の時点でv11までしか使えない
asdf install java adoptopenjdk-11.0.18+10
asdf global java adoptopenjdk-11.0.18+10
asdf reshim java

brew install android-commandlinetools
yes | sdkmanager --licenses
sdkmanager "build-tools;${_ANDROID_SDK_VERSION}.0.0" "emulator" "platform-tools" "platforms;android-${_ANDROID_SDK_VERSION}" "system-images;android-${_ANDROID_SDK_VERSION};google_apis;${_ANDROID_PLATFORM}"
avdmanager create avd --force --name Pixel_6_API_${_ANDROID_SDK_VERSION}_${_ANDROID_PLATFORM} --abi google_apis/${_ANDROID_PLATFORM} --package "system-images;android-${_ANDROID_SDK_VERSION};google_apis;${_ANDROID_PLATFORM}" --device "pixel_6"

cat << 'EOF' >> ~/.zshrc
# Android & React Native
export ANDROID_SDK_ROOT="/opt/homebrew/share/android-commandlinetools"
export ANDROID_HOME=$ANDROID_SDK_ROOT
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
EOF
