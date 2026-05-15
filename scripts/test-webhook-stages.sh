#!/usr/bin/env bash
# test-webhook-stages.sh
# Sends test OpportunityStatusChange webhook payloads for each Showtime pipeline stage.
# Run against the local dev server (no signature verification in dev mode).
#
# Usage:
#   chmod +x scripts/test-webhook-stages.sh
#   ./scripts/test-webhook-stages.sh
#
# Prerequisites:
#   - Dev server running: npm run dev (http://localhost:3000)
#   - GHL_LOCATION_TO_TENANT set in .env.local so tenant resolves
#   - At least one Property in DB with a known ghl_contact_id

set -euo pipefail

BASE_URL="${WEBHOOK_URL:-http://localhost:3000/api/ghl/webhooks}"
LOCATION_ID="${GHL_LOCATION_ID:-E4ii6h4R7wnvKtaBaA1l}"
CONTACT_ID="${TEST_CONTACT_ID:-TEST_CONTACT_001}"
OPP_ID_PREFIX="test-opp-$(date +%s)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

send_webhook() {
  local test_name="$1"
  local payload="$2"
  local expected="$3"

  echo -e "\n${YELLOW}── Test: ${test_name} ──${NC}"
  echo "Payload stage: $(echo "$payload" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pipelineStage',{}).get('name','N/A'))" 2>/dev/null || echo "(see payload)")"

  HTTP_STATUS=$(curl -s -o /tmp/wh_response.json -w "%{http_code}" \
    -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d "$payload")

  RESPONSE=$(cat /tmp/wh_response.json)

  if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ HTTP 200 — ${expected}${NC}"
    echo "  Response: $RESPONSE"
  else
    echo -e "${RED}✗ HTTP $HTTP_STATUS — Expected 200${NC}"
    echo "  Response: $RESPONSE"
  fi

  sleep 1
}

echo "=== GHL Pipeline Stage Webhook Tests ==="
echo "Target: $BASE_URL"
echo "Location: $LOCATION_ID"
echo ""

# ─── Test 1: Diagnosis Booked → work order created (pool_inspection_diagnostic) ───
OPP1="${OPP_ID_PREFIX}-diagnosis"
send_webhook \
  "1. Diagnosis Booked → WO created (pool_inspection_diagnostic)" \
  "{
    \"type\": \"OpportunityStatusChange\",
    \"locationId\": \"${LOCATION_ID}\",
    \"id\": \"${OPP1}\",
    \"name\": \"Test Diagnosis — John Smith Pool\",
    \"status\": \"open\",
    \"pipelineStage\": {\"id\": \"stage-001\", \"name\": \"Diagnosis Booked\"},
    \"contact\": {\"id\": \"${CONTACT_ID}\", \"name\": \"John Smith\"}
  }" \
  "WO created with category=pool_inspection_diagnostic"

# ─── Test 2: Diagnosis Completed → WO status updated to completed ───────────
send_webhook \
  "2. Diagnosis Completed → WO status → completed" \
  "{
    \"type\": \"OpportunityStatusChange\",
    \"locationId\": \"${LOCATION_ID}\",
    \"id\": \"${OPP1}\",
    \"status\": \"open\",
    \"pipelineStage\": {\"id\": \"stage-002\", \"name\": \"Diagnosis Completed\"},
    \"contact\": {\"id\": \"${CONTACT_ID}\"}
  }" \
  "WO status updated to completed"

# ─── Test 3: Estimate Sent → estimate_handoff_status flagged ────────────────
send_webhook \
  "3. Estimate Sent → estimate flagged on WO" \
  "{
    \"type\": \"OpportunityStatusChange\",
    \"locationId\": \"${LOCATION_ID}\",
    \"id\": \"${OPP1}\",
    \"status\": \"open\",
    \"pipelineStage\": {\"id\": \"stage-003\", \"name\": \"Estimate Sent\"},
    \"contact\": {\"id\": \"${CONTACT_ID}\"}
  }" \
  "estimate_handoff_status = estimate_sent"

# ─── Test 4: Estimate Approved → new WO created (pool_repair) ───────────────
OPP2="${OPP_ID_PREFIX}-approved"
send_webhook \
  "4. Estimate Approved → new WO created (pool_repair)" \
  "{
    \"type\": \"OpportunityStatusChange\",
    \"locationId\": \"${LOCATION_ID}\",
    \"id\": \"${OPP2}\",
    \"name\": \"Test Approved Job — John Smith Pool\",
    \"status\": \"open\",
    \"pipelineStage\": {\"id\": \"stage-005\", \"name\": \"Estimate Approved\"},
    \"contact\": {\"id\": \"${CONTACT_ID}\"}
  }" \
  "WO created with category=pool_repair"

# ─── Test 5: In Progress → WO status → in_progress ──────────────────────────
send_webhook \
  "5. In Progress → WO status → in_progress" \
  "{
    \"type\": \"OpportunityStatusChange\",
    \"locationId\": \"${LOCATION_ID}\",
    \"id\": \"${OPP2}\",
    \"status\": \"open\",
    \"pipelineStage\": {\"id\": \"stage-008\", \"name\": \"In Progress\"},
    \"contact\": {\"id\": \"${CONTACT_ID}\"}
  }" \
  "WO status updated to in_progress"

# ─── Test 6: Completed/Won → WO status → completed ──────────────────────────
send_webhook \
  "6. Completed/Won → WO status → completed" \
  "{
    \"type\": \"OpportunityStatusChange\",
    \"locationId\": \"${LOCATION_ID}\",
    \"id\": \"${OPP2}\",
    \"status\": \"won\",
    \"pipelineStage\": {\"id\": \"stage-009\", \"name\": \"Completed/Won\"},
    \"contact\": {\"id\": \"${CONTACT_ID}\"}
  }" \
  "WO status updated to completed"

# ─── Test 7: Invoice Sent → no action (logged only) ─────────────────────────
send_webhook \
  "7. Invoice Sent → no action (logged)" \
  "{
    \"type\": \"OpportunityStatusChange\",
    \"locationId\": \"${LOCATION_ID}\",
    \"id\": \"${OPP2}\",
    \"status\": \"open\",
    \"pipelineStage\": {\"id\": \"stage-006\", \"name\": \"Invoice Sent\"},
    \"contact\": {\"id\": \"${CONTACT_ID}\"}
  }" \
  "No DB change — log only"

# ─── Test 8: New Lead → no action (logged only) ─────────────────────────────
send_webhook \
  "8. New Lead → no action (logged)" \
  "{
    \"type\": \"OpportunityStatusChange\",
    \"locationId\": \"${LOCATION_ID}\",
    \"id\": \"${OPP_ID_PREFIX}-lead\",
    \"status\": \"open\",
    \"pipelineStage\": {\"id\": \"stage-000\", \"name\": \"New Lead\"},
    \"contact\": {\"id\": \"${CONTACT_ID}\"}
  }" \
  "No DB change — log only"

echo -e "\n=== Tests complete ==="
echo "Check dev server logs for processing output."
echo "Verify DB state:"
echo "  - WO with ghl_trigger_stage='Diagnosis Booked' created"
echo "  - WO with ghl_trigger_stage='Estimate Approved' created"
echo "  - Diagnosis WO status = completed (after test 2)"
echo "  - Approved Job WO status = completed (after test 6)"
echo "  - Diagnosis WO estimate_handoff_status = estimate_sent (after test 3)"
