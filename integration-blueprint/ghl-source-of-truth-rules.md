# GHL Source of Truth Rules

1. GHL owns all contact records — ServiceOps never creates duplicate contacts
2. ServiceOps stores only GHL contact ID, not full contact data
3. GHL owns conversation history — ServiceOps does not touch SMS/email
4. GHL owns pipeline and opportunity stages — ServiceOps mirrors only when needed
5. GHL owns calendar/appointments — ServiceOps receives appointment data via webhook
6. ServiceOps may update GHL opportunity status when job is completed
7. ServiceOps may create a GHL task when estimate is needed
8. Never batch-import contacts from GHL into ServiceOps DB
