# Outbound Sync to GHL

## When ServiceOps Calls GHL API

### Job Completed
- Endpoint: PUT /opportunities/{id}
- Update: opportunity status or custom field
- Trigger: Work order marked Complete

### Estimate Needed
- Endpoint: POST /opportunities/{id}/tasks OR update pipeline stage
- Trigger: Technician flags estimate needed
- Creates a task in GHL assigned to office staff

### Review Request (Future)
- Endpoint: Trigger GHL workflow via API
- Trigger: Job marked complete + configured delay

## Rate Limiting
- GHL API has rate limits — implement backoff
- Use queue for outbound calls to avoid hitting limits
