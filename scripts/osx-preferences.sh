#!/usr/bin/env bash -eux

# ~/osx.sh — Originally from https://mths.be/osx

# Ask for the administrator password upfront
sudo -v

# Keep-alive: update existing `sudo` time stamp until `osx.sh` has finished
while true; do
  sudo -n true
  sleep 60
  kill -0 "$$" || exit
done 2>/dev/null &

###############################################################################
# General UI/UX #
###############################################################################

# Disable the sound effects on boot
sudo nvram SystemAudioVolume=" "

# Check for software updates daily, not just once per week
defaults write com.apple.SoftwareUpdate ScheduleFrequency -int 1

# Trackpad: tap-to-click, and map the bottom-right CORNER to secondary (right) click.
# Multitouch prefs are read only from the per-user -currentHost (ByHost) domain and
# must be written as the user (not sudo). Changes apply after logout/restart.
defaults write com.apple.AppleMultitouchTrackpad Clicking -bool true
defaults -currentHost write NSGlobalDomain com.apple.mouse.tapBehavior -int 1
defaults write NSGlobalDomain com.apple.mouse.tapBehavior -int 1

# Built-in trackpad
defaults -currentHost write com.apple.AppleMultitouchTrackpad TrackpadRightClick -bool false
defaults -currentHost write com.apple.AppleMultitouchTrackpad TrackpadCornerSecondaryClick -int 2
# Magic / Bluetooth trackpad
defaults -currentHost write com.apple.driver.AppleBluetoothMultitouch.trackpad TrackpadRightClick -bool false
defaults -currentHost write com.apple.driver.AppleBluetoothMultitouch.trackpad TrackpadCornerSecondaryClick -int 2
# Global secondary-click enable + corner behavior
defaults -currentHost write NSGlobalDomain com.apple.trackpad.enableSecondaryClick -bool true
defaults -currentHost write NSGlobalDomain com.apple.trackpad.trackpadCornerClickBehavior -int 1

###############################################################################
# Screen #
###############################################################################

# Require password immediately after sleep or screen saver begins
defaults write com.apple.screensaver askForPassword -int 1
defaults write com.apple.screensaver askForPasswordDelay -int 0

# Sleep after n minutes
sudo systemsetup -setdisplaysleep 10
sudo systemsetup -setcomputersleep 10

# Save screenshots to the Pictures/Screenshots
mkdir -p ${HOME}/Pictures/Screenshots
defaults write com.apple.screencapture location -string "${HOME}/Pictures/Screenshots"

# Set Desktop as the default location for new Finder windows
# For other paths, use `PfLo` and `file:///full/path/here/`
defaults write com.apple.finder NewWindowTarget -string "PfDe"
defaults write com.apple.finder NewWindowTargetPath -string "file://${HOME}/"

# Finder: show hidden files by default
defaults write com.apple.finder AppleShowAllFiles -bool true

# Finder: show all filename extensions
defaults write NSGlobalDomain AppleShowAllExtensions -bool true

# Finder: show status bar
defaults write com.apple.finder ShowStatusBar -bool true

# Finder: show path bar
defaults write com.apple.finder ShowPathbar -bool true

# Disable the warning when changing a file extension
defaults write com.apple.finder FXEnableExtensionChangeWarning -bool false

###############################################################################
# Dock, Dashboard, and hot corners#
###############################################################################

# Enable highlight hover effect for the grid view of a stack (Dock)
defaults write com.apple.dock mouse-over-hilite-stack -bool true

# Set the icon size of Dock items to 36 pixels
defaults write com.apple.dock tilesize -int 36

# Change minimize/maximize window effect
defaults write com.apple.dock mineffect -string "scale"

# Automatically hide and show the Dock
defaults write com.apple.dock autohide -bool true

# Remove the auto-hide delay and speed up the show/hide animation
defaults write com.apple.dock autohide-delay -float 0
defaults write com.apple.dock autohide-time-modifier -float 0.4

# Minimize windows into their application's icon
defaults write com.apple.dock minimize-to-application -bool true

# Don't show recently used apps in the Dock
defaults write com.apple.dock show-recents -bool false

# Don't automatically rearrange Spaces based on most recent use
defaults write com.apple.dock mru-spaces -bool false

###############################################################################
# Activity Monitor#
###############################################################################

# Show the main window when launching Activity Monitor
defaults write com.apple.ActivityMonitor OpenMainWindow -bool true

# Visualize CPU usage in the Activity Monitor Dock icon
defaults write com.apple.ActivityMonitor IconType -int 5

# Show all processes in Activity Monitor
defaults write com.apple.ActivityMonitor ShowCategory -int 0

# Sort Activity Monitor results by CPU usage
defaults write com.apple.ActivityMonitor SortColumn -string "CPUUsage"
defaults write com.apple.ActivityMonitor SortDirection -int 0

# Associate source code-like files with VS Code
# https://alexpeattie.com/blog/associate-source-code-files-with-editor-in-macos-using-duti/
curl "https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml" |
  yq -r "to_entries | (map(.value.extensions) | flatten) - [null] | unique | .[]" |
  xargs -L 1 -I "{}" duti -s com.microsoft.VSCode {} all

# Show hidden files in Finder
defaults write com.apple.finder AppleShowAllFiles -boolean true

# Apply what we can without a logout.
for app in Finder Dock SystemUIServer; do killall "$app" 2>/dev/null || true; done

echo "NOTE: trackpad corner right-click takes effect after you log out and back in."
