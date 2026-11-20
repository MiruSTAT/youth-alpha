#!/usr/bin/env bash
# Preview copy (fake local database) served on http://localhost:8766/, then run tests.
# Usage: tools/preview.sh                -> copy + serve only
#        tools/preview.sh t_v32_admins   -> copy + serve + run tests/t_v32_admins.py (several names allowed)
# Needs: python3 + playwright (pip), /usr/bin/google-chrome, three.module.min.js in $YA_VENDOR (default /tmp/npm3/).
set -e
cd "$(dirname "$0")/.."
export YA_VENDOR="${YA_VENDOR:-/tmp/npm3/}" YA_SHOTS="${YA_SHOTS:-/tmp/shots/}"
mkdir -p "$YA_SHOTS"
if [ ! -f "$YA_VENDOR/three.module.min.js" ]; then
  mkdir -p "$YA_VENDOR" && (cd "$YA_VENDOR" && npm i --silent three@0.170.0 >/dev/null && cp node_modules/three/build/three.module.min.js .)
fi
if [ ! -f "$YA_VENDOR/xlsx.full.min.js" ]; then   # v39: export tests route the SheetJS CDN file to this local copy
  (cd "$YA_VENDOR" && npm i --silent xlsx@0.18.5 >/dev/null && cp node_modules/xlsx/dist/xlsx.full.min.js .)
fi
rm -rf /tmp/prev && mkdir -p /tmp/prev
cp -r index.html sw.js manifest.json icon.svg icons css js sheets vendor HANDOFF.md /tmp/prev/
echo "window.YA_CONFIG = {};" > /tmp/prev/config.js
# v43: the whole background list is detached from stdout, so "tools/preview.sh … | tail" no longer waits for the server forever
(curl -s --noproxy '*' -m 3 -o /dev/null http://localhost:8766/ || setsid python3 -m http.server 8766 --directory /tmp/prev) </dev/null >/dev/null 2>&1 &
sleep 1
for t in "$@"; do echo "== $t"; timeout 500 python3 "tests/$t.py" 2>&1 | grep -v '^OK' | tail -15; done
