# Security Rules

- Never hardcode API keys, secrets, or tokens in code
- All secrets in .env — never in source control
- Validate all .env values at startup
- Verify GHL webhook signatures on every request
- Auth required on all non-public routes
- Role-based access enforced at API layer
- tenant_id filter on every database query
- PII (names, addresses, phones) handled carefully
- No customer-facing messages without client review
- Log security events (failed auth, invalid webhooks)
- API keys encrypted at rest for tenant GHL credentials
