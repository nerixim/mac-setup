bcask := brew cask install

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
	brew install docker
	$(bcask) docker
	open /Applications/Docker.app

awscli: homebrew
	brew install awscli

chrome: homebrew
	$(bcask) --appdir="/Applications" google-chrome

slack: homebrew
	$(bcask) --appdir="/Applications" slack
