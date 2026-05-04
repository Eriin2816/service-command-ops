# Project Overview — ServiceOps Command Center

ServiceOps Command Center is a field operations layer that integrates with GoHighLevel (GHL) to provide work order management, technician job routing, property profiles, and job completion reporting for local service businesses.

**First client:** Showtime Pool Service, California
**Future direction:** White-label SaaS for GHL users in field service industries

## Core Principle
GHL handles the front of the customer journey. ServiceOps handles everything after a customer is ready for field service.

## System Boundary
```
[Customer] → GHL (CRM, booking, comms) → ServiceOps (work order, field ops) → GHL (status update)
```

See docs/02-what-ghl-handles.md and docs/03-what-serviceops-handles.md for exact boundaries.
