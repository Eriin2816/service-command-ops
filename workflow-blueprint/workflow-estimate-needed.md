# Workflow: Estimate Needed

## Trigger
Technician flags "Estimate Needed" during or after a visit

## Steps
1. Technician taps "Estimate Needed" button
2. System prompts for brief description
3. Visit saved with estimate_flagged = true
4. Work order status → ESTIMATE_NEEDED
5. Office staff notified in dashboard
6. ServiceOps calls GHL API → creates task on opportunity or changes pipeline stage
7. Office staff follows up with customer via GHL conversations

## Edge Cases
- GHL opportunity not linked → log, alert admin
- Estimate later approved → update GHL opportunity
