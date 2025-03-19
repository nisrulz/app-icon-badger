#!/usr/bin/env bash

read -p "❓  Specify version?   " version
echo ""
echo "➡ Rendering from templates"
./render.sh
echo ""
echo "➡ Deploying to Firebase Hosting"
firebase deploy -m $version
echo ""
echo "✅ Done!"
