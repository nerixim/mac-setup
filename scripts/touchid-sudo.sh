#!/usr/bin/env bash
set -eux

# Touch ID for sudo. /etc/pam.d/sudo_local survives macOS updates; edits to
# /etc/pam.d/sudo do not. Touch ID inside tmux additionally needs pam_reattach.
SUDO_LOCAL=/etc/pam.d/sudo_local
PAM_TID_RE='^auth[[:space:]].*pam_tid\.so'

if grep -qE "$PAM_TID_RE" "$SUDO_LOCAL" 2>/dev/null; then
  echo "Touch ID for sudo already enabled ($SUDO_LOCAL)"
  exit 0
fi

[ -f "$SUDO_LOCAL" ] || sudo cp /etc/pam.d/sudo_local.template "$SUDO_LOCAL"
sudo sed -i '' -E 's/^#[[:space:]]*(auth[[:space:]].*pam_tid\.so)/\1/' "$SUDO_LOCAL"
grep -qE "$PAM_TID_RE" "$SUDO_LOCAL" \
  || echo 'auth       sufficient     pam_tid.so' | sudo tee -a "$SUDO_LOCAL" >/dev/null

echo "Touch ID for sudo enabled. Check in a new terminal: sudo -k; sudo true"
