#!/usr/bin/env bash

echo ""
echo "➡ Rendering from templates"
./render.sh
echo ""
echo "➡ Preparing to serve locally"
firebase serve --only hosting
echo ""
echo "✅ Done!"
