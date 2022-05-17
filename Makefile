bcask := brew install --cask
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
	echo 'export PATH="$$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"' >> ~/.zshrc

iterm: homebrew
	$(bcask) --appdir="~/Applications" iterm2
	# 暫定
	$(bcask) fig
	open "./config/Solarized Dark.itermcolors"

docker: homebrew
	$(bcask) docker
	open /Applications/Docker.app

k8s: homebrew
	./scripts/$@.sh

git:
	./scripts/$@.sh

awscli: homebrew
	$(brin) awscli

gcp-cli: homebrew
	$(bcask) google-cloud-sdk

terraform: homebrew
	$(brin) tflint hashicorp/tap/terraform-ls
	./scripts/$@.sh

browser: homebrew
	$(bcask) --appdir="/Applications" google-chrome firefox brave-browser

slack: homebrew
	$(bcask) --appdir="/Applications" slack

google-ime: homebrew
	$(bcask) google-japanese-ime

zoom: homebrew
	$(bcask) zoom

dev-tools: homebrew
	$(bcask) graphql-playground postman

zsh:
	./scripts/$@.sh

asdf:
	./scripts/$@.sh
