#!/usr/bin/env bash
set -eux

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
. "${BASEDIR}/lib.sh"

# Install the color preset (still a manual one-time double-click on first run,
# but harmless to re-open).
open "${BASEDIR}/../config/Solarized Dark.itermcolors" || true

# Install the profile as an iTerm2 Dynamic Profile. iTerm auto-loads anything in
# DynamicProfiles/ on launch (and live-reloads it) — no manual Preferences import.
# We wrap the exported profile JSON in the required {"Profiles":[ ... ]} envelope
# and force a stable Name/Guid so re-running updates the same profile in place.
# iTerm watches DynamicProfiles/ and parses a file the moment it appears, so a
# direct `>` redirect lets it read a half-written file ("malformed" warning).
# Write next to the directory and rename in — same volume, so the rename is atomic.
DP_DIR="${HOME}/Library/Application Support/iTerm2/DynamicProfiles"
mkdir -p "${DP_DIR}"
tmp="${DP_DIR}/../nerzie.json.tmp"
jq '. + {Name: "nerzie", Guid: "nerzie-dynamic-profile"} | {Profiles: [.]}' \
  "${BASEDIR}/../config/iterm-profile.json" >"${tmp}"
mv -f "${tmp}" "${DP_DIR}/nerzie.json"

# Make nerzie the default profile. Its per-profile Keyboard Map carries the tab
# bindings (Cmd+Left=prev tab, Cmd+Right=next tab), which only apply when nerzie
# is the active profile. iTerm reads "Default Bookmark Guid" at launch and
# rewrites the plist on quit, so a write while it runs gets clobbered. This
# script is normally run FROM iTerm, so instead of asking for a manual step we
# leave a detached waiter that writes the key right after iTerm exits; the next
# launch then starts with nerzie as default. (Already-open windows keep their
# current profile either way — open a new tab to get nerzie.)
NERZIE_GUID="nerzie-dynamic-profile"
set_default_guid='defaults write com.googlecode.iterm2 "Default Bookmark Guid" -string "'"${NERZIE_GUID}"'"'
if pgrep -xq iTerm2; then
  nohup bash -c "while pgrep -xq iTerm2; do sleep 2; done; sleep 1; ${set_default_guid}" >/dev/null 2>&1 &
  disown
  set_default_note='iTerm2 is running — the default profile switches to "nerzie" automatically after you fully quit iTerm2 (Cmd+Q) once; relaunch and it is the default.'
else
  eval "${set_default_guid}"
  set_default_note='Default profile set to "nerzie" (applies next launch).'
fi

cat <<EOF
*************
iTerm2 dynamic profile installed as "nerzie".
- ${set_default_note}
- Cmd+Left/Right tab switching ships in the profile's key map — no preset import
  needed once nerzie is the default profile.
- Optional global/natural-text-selection bindings (apply to every profile):
  Settings → Keys → Key Bindings → Presets → Import → config/nerzie.itermkeymap.
*************
EOF
