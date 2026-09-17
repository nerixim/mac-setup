bcask := brew install --cask
brin := brew install

.PHONY: all xcode homebrew osx-preferences stow vscode iterm k8s git gcp-cli azure-cli \
        terraform zsh mise android xcode-app doctor brew-diff mise-bump secrets zellij tmux

all: xcode homebrew osx-preferences stow vscode iterm git zsh mise

xcode:
	./scripts/$@.sh
	touch $@

homebrew: xcode
	./scripts/$@.sh
	touch $@

osx-preferences:
	./scripts/$@.sh
	touch $@

# Symlink dotfiles from stow/home/ into $HOME (default-* lists, p10k, zellij, tmux).
stow:
	./scripts/$@.sh

vscode: homebrew
	./scripts/$@.sh

iterm: homebrew
	./scripts/$@.sh

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

mise:
	./scripts/$@.sh

android:
	./scripts/$@.sh

xcode-app: homebrew
	mas install 497799835
	$(brin) cocoapods

# Install zellij + starter config (opt-in; not part of `make all`).
zellij: homebrew
	./scripts/$@.sh

# Install tmux + Claude-oriented config (opt-in; not part of `make all`).
# This is the iPad attach path: run `ta` then `claude` on the Mac, SSH + `ta` from Termius.
tmux: homebrew
	./scripts/$@.sh

# Verify the machine matches the desired state (read-only). Run anytime.
doctor:
	./scripts/$@.sh

# Show brew formulae/casks installed but not tracked in the Brewfile (read-only).
brew-diff:
	./scripts/$@.sh

# Show outdated mise runtimes and upgrade within the pinned ranges, then
# refresh npm on every supported mise Node (npm 11.10+ for min-release-age).
mise-bump:
	mise outdated || true
	mise upgrade
	./scripts/mise.sh --refresh-npm

# Scaffold ~/.secrets (chmod 600) for tokens that must stay out of the repo.
secrets:
	@test -f ~/.secrets || { \
	  printf '# Sourced from ~/.zsh_profile. Keep OUT of git.\n# export SOME_TOKEN=...\n' > ~/.secrets; \
	  chmod 600 ~/.secrets; \
	  echo "created ~/.secrets (chmod 600)"; \
	}
