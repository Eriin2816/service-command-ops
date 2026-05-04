# Integration Blueprint — GHL Integration

All GHL API and webhook integration decisions are documented here.
Never implement GHL integration without documenting it in this folder first.

## Key Principle
GHL is the source of truth for contacts, conversations, pipeline, and calendars.
ServiceOps reads from GHL and writes back only status updates, not full records.
