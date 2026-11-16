#!/usr/bin/env bash
# Raise the app version everywhere (index.html + js imports ?v=, sw.js V, js/version.js VERSION, HANDOFF.md line).
# Usage: tools/bump.sh 33     (run from the repo root). Then add the change log entry in js/version.js yourself.
set -e
NEW="$1"; OLD=$(grep -oP "VERSION = '\K\d+" js/version.js)
[ -n "$NEW" ] || { echo "usage: tools/bump.sh <new version>  (current $OLD)"; exit 1; }
sed -i "s/?v=$OLD/?v=$NEW/g" index.html js/*.js
sed -i "s/const V = '$OLD'/const V = '$NEW'/" sw.js
sed -i "s/VERSION = '$OLD'/VERSION = '$NEW'/" js/version.js
sed -i "s/The current version is \`$OLD\`/The current version is \`$NEW\`/" HANDOFF.md
for f in js/*.js sw.js; do node --check "$f"; done
echo "v$OLD -> v$NEW. Left with ?v=$OLD: $(grep -l "?v=$OLD" index.html js/*.js 2>/dev/null | tr '\n' ' ')"
