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
DP_DIR="${HOME}/Library/Application Support/iTerm2/DynamicProfiles"
mkdir -p "${DP_DIR}"
jq '. + {Name: "nerzie", Guid: "nerzie-dynamic-profile"} | {Profiles: [.]}' \
  "${BASEDIR}/../config/iterm-profile.json" >"${DP_DIR}/nerzie.json"

# Make nerzie the default profile. Its per-profile Keyboard Map carries the tab
# bindings (Cmd+Left=prev tab, Cmd+Right=next tab), which only apply when nerzie
# is the active profile. iTerm reads "Default Bookmark Guid" at launch and
# rewrites the plist on quit, so we can only set it safely while iTerm is closed;
# otherwise the running instance would clobber our write. Fall back to a one-line
# manual instruction in that case.
NERZIE_GUID="nerzie-dynamic-profile"
if pgrep -xq iTerm2; then
  set_default_note='iTerm2 is running — set the default by hand once: Settings → Profiles → nerzie → Other Actions → Set as Default. (Or fully quit iTerm and re-run `make iterm`.)'
else
  defaults write com.googlecode.iterm2 "Default Bookmark Guid" -string "${NERZIE_GUID}"
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
