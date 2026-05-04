#!/bin/bash
# Create scaffold zip
cd "$(dirname "$0")/.."
FOLDER_NAME=$(basename "$(pwd)")
OUTPUT="../${FOLDER_NAME}-scaffold.zip"
zip -r "$OUTPUT" . --exclude "node_modules/*" --exclude ".next/*" --exclude ".git/*"
echo "Zip created: $OUTPUT"
