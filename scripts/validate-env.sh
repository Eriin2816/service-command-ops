#!/bin/bash
# Validate required environment variables
echo "Checking environment variables..."

REQUIRED_VARS=(
  "NEXT_PUBLIC_APP_NAME"
  "NEXT_PUBLIC_APP_URL"
  "GHL_API_BASE_URL"
  "GHL_LOCATION_ID"
  "GHL_WEBHOOK_SECRET"
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
)

MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "ERROR: Missing required environment variables:"
  for var in "${MISSING[@]}"; do
    echo "  - $var"
  done
  exit 1
else
  echo "All required environment variables are set."
fi
