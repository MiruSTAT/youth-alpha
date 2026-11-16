#!/usr/bin/env bash
# Copy the published repo + HANDOFF.md to the owner's Desktop folder "Youth Alpha" (HANDOFF.md section 10b).
# Run with device_bash on the owner's PC AFTER pushing, once ~/Desktop is connected (device_request_folder_access ["~/Desktop"]).
# Overwrites with cat (deleting is not allowed there); prints the version that landed.
set -e
cd "$HOME" && rm -rf ya && git clone -q --depth 1 https://github.com/MiruSTAT/youth-alpha.git ya && cd ya
D="$HOME/mnt/Desktop/Youth Alpha"; mkdir -p "$D/app"
for f in $(git ls-files); do mkdir -p "$D/app/$(dirname "$f")"; cat "$f" > "$D/app/$f"; done
cat HANDOFF.md > "$D/HANDOFF.md"
echo "copied $(git log --oneline -1) · $(grep -o "VERSION = '[0-9]*'" js/version.js)"
