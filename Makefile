bcask := brew cask install
brin := brew install

xcode:
	./scripts/$@.sh
	touch $@

homebrew: xcode
	./scripts/$@.sh
	touch $@

osx-preferences:
	./scripts/$@.sh
	touch $@

vscode: homebrew
	$(bcask) visual-studio-code
	echo 'export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"' >> ~/.zshrc

iterm: homebrew
	$(bcask) --appdir="~/Applications" iterm2
	open "./config/Solarized Dark.itermcolors"

docker: homebrew
	$(brin) docker
	$(bcask) docker
	open /Applications/Docker.app

git:
	./scripts/$@.sh

awscli: homebrew
	$(brin) awscli

gcp-cli: homebrew
	$(bcask) google-cloud-sdk

rbenv: homebrew

pyenv: homebrew
	$(brin) pyenv

yarn: homebrew
	$(brin) yarn

chrome: homebrew
	$(bcask) --appdir="/Applications" google-chrome

slack: homebrew
	$(bcask) --appdir="/Applications" slack

google-ime: homebrew
	$(bcask) google-japanese-ime
