# Workflow: Job Completion

## Trigger
Technician marks visit as Complete in mobile view

## Steps
1. Technician taps "Mark Complete"
2. System checks checklist completion (warn if incomplete items)
3. System saves completion timestamp
4. Visit status → COMPLETED
5. Work order status → COMPLETED (if all visits done)
6. Completion report generated (photos, notes, checklist)
7. ServiceOps calls GHL API → update opportunity status
8. If review request configured → trigger GHL workflow

## Edge Cases
- Checklist not fully completed → prompt technician
- GHL API call fails → queue for retry, log error
- Multiple visits in work order → only close WO when all done
