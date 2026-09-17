#!/usr/bin/env bash
set -eux

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
. "${BASEDIR}/lib.sh"

brew install tmux
# ~/.tmux.conf is symlinked from stow/home/ by scripts/stow.sh.
"${BASEDIR}/stow.sh"

# Steal the session so the attaching device owns the size (Mac ↔ iPad).
append_once ~/.aliases "alias ta='tmux attach -d -t main 2>/dev/null || tmux new -s main'"

if ! lsof -nP -iTCP:22 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Remote Login is off — Termius cannot SSH in until you enable it." >&2
  echo "  System Settings → General → Sharing → Remote Login" >&2
  echo "  or: sudo systemsetup -setremotelogin on" >&2
fi

cat <<'EOF'

tmux installed.

On the Mac, in iTerm, when you want a Claude session you can pick up on the iPad:
  ta
  claude
Leave it running. Do not /resume from a new process — attach the same tmux.

On the iPad (Termius, already installed):
  1. Enable Remote Login (Sharing → Remote Login) if the script warned above.
  2. Start Tailscale on Mac and iPad when you are away from this LAN.
  3. SSH as nk@<Tailscale IP> (or nk@Ns-MacBook-Pro.local on Wi-Fi).
  4. After login: ta

Detach without killing Claude: Ctrl-B then d
Claude "background task" vs tmux prefix: Ctrl-B twice, or Claude's Ctrl-X Ctrl-B
EOF
