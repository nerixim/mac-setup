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

cat <<'EOF'
*************
iTerm2 dynamic profile installed as "nerzie".
- Open iTerm2 → it appears under Preferences → Profiles automatically.
- Set it as default: Preferences → Profiles → select "nerzie" → Other Actions → Set as Default.
- Natural-text-selection / key mappings: Preferences → Keys → Presets → Import →
  config/nerzie.itermkeymap  (one-time; not expressible as a dynamic profile).
*************
EOF
