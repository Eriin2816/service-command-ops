export type TeamMemberRole = 'tenant_admin' | 'office_staff' | 'read_only_owner' | 'platform_owner'

export interface TeamMember {
  id: string
  tenant_id: string
  name: string
  email: string
  phone: string | null
  role: TeamMemberRole
  is_active: boolean
  created_at: string
}

export const ROLE_LABELS: Record<TeamMemberRole, string> = {
  platform_owner: 'Platform Owner',
  tenant_admin: 'Admin',
  office_staff: 'Office Staff',
  read_only_owner: 'Read-Only',
}

export const ROLE_DESCRIPTIONS: Record<TeamMemberRole, string> = {
  platform_owner: 'Full platform access across all tenants',
  tenant_admin: 'Full access including settings and team management',
  office_staff: 'Create and manage work orders, properties, and visits',
  read_only_owner: 'View dashboard and reports only — cannot create or modify',
}

export const ASSIGNABLE_ROLES: TeamMemberRole[] = ['tenant_admin', 'office_staff', 'read_only_owner']
