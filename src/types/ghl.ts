// GHL (GoHighLevel) Integration Types — Placeholder
// These represent data shapes from GHL API/webhooks

export interface GHLContact {
  id: string;
  locationId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  tags?: string[];
  customFields?: GHLCustomField[];
  createdAt: string;
  updatedAt: string;
}

export interface GHLOpportunity {
  id: string;
  locationId: string;
  contactId: string;
  name: string;
  status: string;
  pipelineId: string;
  pipelineStageId: string;
  monetaryValue?: number;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GHLCalendarEvent {
  id: string;
  locationId: string;
  contactId: string;
  calendarId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  assignedUserId?: string;
}

export interface GHLCustomField {
  id: string;
  key: string;
  value: string | string[];
}

export interface GHLWebhookPayload {
  type: string;
  locationId: string;
  id: string;
  data: Record<string, unknown>;
  timestamp: string;
}
