-- =============================================================================
-- Migration 001 — Custom ENUM types
-- Must run before any table that references these types.
-- =============================================================================

-- User roles (mirrors src/types/technician.ts UserRole)
CREATE TYPE user_role AS ENUM (
  'platform_owner',
  'tenant_admin',
  'office_staff',
  'technician',
  'read_only_owner'
);

-- Work order status machine (mirrors src/types/work-order.ts WorkOrderStatus)
CREATE TYPE work_order_status AS ENUM (
  'new',
  'assigned',
  'in_progress',
  'completed',
  'needs_follow_up',
  'estimate_needed',
  'cancelled'
);

-- Priority (mirrors src/types/work-order.ts Priority)
CREATE TYPE priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Service category (mirrors src/types/work-order.ts ServiceCategory)
CREATE TYPE service_category AS ENUM (
  'weekly_pool_maintenance',
  'pool_repair',
  'pool_inspection_diagnostic',
  'filter_cleaning',
  'heater_service',
  'equipment_installation',
  'pool_remodel',
  'new_construction',
  'emergency_service',
  'other'
);

-- Estimate handoff state (mirrors src/types/work-order.ts EstimateHandoffStatus)
CREATE TYPE estimate_handoff_status AS ENUM (
  'not_needed',
  'flagged',
  'sent_to_ghl',
  'estimate_sent',
  'approved',
  'declined'
);

-- Visit status (mirrors src/types/visit.ts VisitStatus)
CREATE TYPE visit_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'skipped',
  'rescheduled',
  'cancelled'
);
