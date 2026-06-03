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

- **Secrets** (tokens, keys) go in `~/.secrets` (chmod 600), sourced from
  `~/.zsh_profile`. Never commit them; keep them out of `~/.zshrc`.
- **Runtime versions** are pinned in `scripts/.mise.toml` (single source of truth).
- **iTerm2** ships as a Dynamic Profile (`config/iterm-profile.json` ->
  `~/Library/Application Support/iTerm2/DynamicProfiles/nerzie.json`), auto-loaded
  by iTerm — no manual Preferences import.

## Known manual steps (can't be scripted)

- `chsh -s /opt/homebrew/bin/zsh` — set login shell (needs your password).
- Trackpad corner right-click applies after a logout/login.
- iTerm key map: Preferences -> Keys -> Presets -> Import -> `config/nerzie.itermkeymap`.
- oh-my-zsh completions / theme lines: see the notes printed by `make zsh`.
