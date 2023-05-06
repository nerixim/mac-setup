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
	echo 'export PATH="$$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"' >> ~/.zshrc

iterm: homebrew
	open "./config/Solarized Dark.itermcolors"

k8s: homebrew
	./scripts/$@.sh

git:
	./scripts/$@.sh

gcp-cli: homebrew
	$(bcask) google-cloud-sdk

azure-cli: homebrew
	$(brin) azure-cli

terraform: homebrew
	$(brin) tflint hashicorp/tap/terraform-ls
	./scripts/$@.sh

zsh:
	./scripts/$@.sh

asdf:
	./scripts/$@.sh

android:
	./scripts/$@.sh

xcode-app: homebrew
	mas install 497799835
	$(brin) cocoapods
