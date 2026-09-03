# mac-setup

Apple Silicon Mac provisioning. Homebrew prefix is assumed to be `/opt/homebrew`.

## Full setup

```shell
make all
# == make xcode homebrew osx-preferences vscode iterm git zsh mise
```

Individual targets also work: `make zsh`, `make osx-preferences`, etc.

## Keeping it healthy (instead of remembering TODO comments)

```shell
make doctor      # read-only: checks actual machine state, prints OK/FIX + the fix
make mise-bump   # show outdated runtimes, then `mise upgrade`
make secrets     # scaffold ~/.secrets (chmod 600) for tokens kept out of git
```

`make doctor` is the source of truth for "is this machine set up right?" — it
replaces scattered comments with executable checks. The scripts are idempotent,
so re-running any target reconciles state rather than duplicating lines.

## Conventions

- **Dotfiles** under `stow/home/` are symlinked into `$HOME` with GNU stow
  (`make stow`) — the repo file *is* the live file, so there's no copy/write-back
  drift. Covers `.default-*` package lists, `.p10k.zsh`, `.terraformrc`, and
  zellij config. Files that are appended/generated (`.zshrc`, `.aliases`,
  gitconfig, iTerm, lazygit) stay script-managed instead.
- **Terraform** uses a shared provider plugin cache (`~/.terraformrc` ->
  `~/.terraform.d/plugin-cache`, dir created by `make terraform`). Without it
  each module's `.terraform/` carries its own provider binaries — that was 76 GB
  across two repos. Deleting any `.terraform/` is always safe; `terraform init`
  rebuilds it from the cache.
- **Brewfile** is a curated baseline, not a full machine dump. `make brew-diff`
  shows installed-but-untracked packages (minus `scripts/.brew-ignore`) to promote.
- **Secrets** (tokens, keys) go in `~/.secrets` (chmod 600), sourced from
  `~/.zsh_profile`. Never commit them; keep them out of `~/.zshrc`.
- **Runtime versions** are pinned in `scripts/mise-config.toml`, installed to the
  single global mise config at `~/.config/mise/config.toml`.
- **iTerm2** ships as a Dynamic Profile (`config/iterm-profile.json` ->
  `~/Library/Application Support/iTerm2/DynamicProfiles/nerzie.json`), auto-loaded
  by iTerm — no manual Preferences import.

## Known manual steps (can't be scripted)

- `chsh -s /opt/homebrew/bin/zsh` — set login shell (needs your password).
- Trackpad corner right-click applies after a logout/login.
- iTerm default profile: `make iterm` sets "nerzie" as default automatically, but
  only while iTerm is **closed** (it rewrites its plist on quit). If iTerm was
  running, set it once: Settings -> Profiles -> nerzie -> Other Actions -> Set as
  Default. Cmd+Left/Right tab switching rides in the profile's key map.
- Optional global key bindings (every profile): Settings -> Keys -> Key Bindings
  -> Presets -> Import -> `config/nerzie.itermkeymap`.
- oh-my-zsh completions / theme lines: see the notes printed by `make zsh`.
