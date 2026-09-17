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
make mise-bump   # show outdated runtimes, then `mise upgrade` + npm refresh
make secrets     # scaffold ~/.secrets (chmod 600) for tokens kept out of git
```

`make doctor` is the source of truth for "is this machine set up right?" — it
replaces scattered comments with executable checks. The scripts are idempotent,
so re-running any target reconciles state rather than duplicating lines.

## Conventions

- **Dotfiles** under `stow/home/` are symlinked into `$HOME` with GNU stow
  (`make stow`) — the repo file *is* the live file, so there's no copy/write-back
  drift. Covers `.default-*` package lists, `.p10k.zsh`, `.terraformrc`, zellij
  config, `.tmux.conf`, and the coding-agent config below. Files that are appended/generated
  (`.zshrc`, `.aliases`, gitconfig, `.npmrc`, iTerm, lazygit) stay script-managed instead.
- **Coding-agent config** lives in `stow/home/.claude/` (`CLAUDE.md`,
  `settings.json`, `statusline.sh`, `agents/`, `commands/`, `docs/`, own `skills/`)
  and is stowed file-by-file into `~/.claude/`, next to Claude Code's untracked
  runtime state. `~/.codex/AGENTS.md` and `~/.config/opencode/AGENTS.md` are
  symlinks to the same `CLAUDE.md`, so every agent reads one file. Edits made on
  any machine (including Claude Code writing to `settings.json`) land in the repo:
  commit + push here, `git pull && make stow` elsewhere. Third-party skills under
  `~/.agents/skills` are not tracked; reinstall them with their installer.
  The repo is public, so keep client names, tokens, and internal URLs out of these
  files — `~/.secrets` and per-project `.claude/` dirs are the place for those.
- **Terraform** uses a shared provider plugin cache (`~/.terraformrc` ->
  `~/.terraform.d/plugin-cache`, dir created by `make terraform`). Without it
  each module's `.terraform/` carries its own provider binaries — that was 76 GB
  across two repos. Deleting any `.terraform/` is always safe; `terraform init`
  rebuilds it from the cache.
- **Brewfile** is a curated baseline, not a full machine dump. `make brew-diff`
  shows installed-but-untracked packages (minus `scripts/.brew-ignore`) to promote.
- **Secrets** (tokens, keys) go in `~/.secrets` (chmod 600), sourced from
  `~/.zsh_profile`. Never commit them; keep them out of `~/.zshrc`.
- **Runtime versions** are pinned in `scripts/mise-config.toml` (one version per
  tool, major/minor prefix so `mise install` picks the newest patch), installed to
  the single global mise config at `~/.config/mise/config.toml`. Add extra
  versions per machine with `mise use -g node@22`; they stay out of the repo.
  `make mise` / `make mise-bump` also installs a current npm into each supported
  mise Node (skip EOL majors; Node 20 LTS ended 2026-04) so `min-release-age`
  works. That key lives in `config/npmrc` and is appended to `~/.npmrc` — the
  file is not stowed, because it also holds registry tokens.
- **iTerm2** ships as a Dynamic Profile (`config/iterm-profile.json` ->
  `~/Library/Application Support/iTerm2/DynamicProfiles/nerzie.json`), auto-loaded
  by iTerm — no manual Preferences import.

## Known manual steps (can't be scripted)

- Trackpad corner right-click applies after a logout/login.
- iTerm default profile: `make iterm` sets "nerzie" as default. If iTerm is
  running (the usual case), a background waiter applies it the moment you fully
  quit iTerm (Cmd+Q); the next launch starts with nerzie. Existing windows keep
  their old profile — open a new tab. Cmd+Left/Right tab switching rides in the
  profile's key map.
- Optional global key bindings (every profile): Settings -> Keys -> Key Bindings
  -> Presets -> Import -> `config/nerzie.itermkeymap`.
- oh-my-zsh completions / theme lines: see the notes printed by `make zsh`.
- Claude from iPad: `make tmux`, then `ta` + `claude` in iTerm. Enable Remote
  Login (Sharing → Remote Login), start Tailscale on Mac and iPad when away,
  SSH from Termius, run `ta`. Do not use `tmux -CC` with Claude fullscreen.
