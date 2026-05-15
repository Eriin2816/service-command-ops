// Role Permissions Configuration

import { UserRole } from "@/types/technician";

export interface RolePermissions {
  canViewAllWorkOrders: boolean;
  canCreateWorkOrders: boolean;
  canAssignTechnicians: boolean;
  canViewAllProperties: boolean;
  canEditProperties: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canManageTenants: boolean;
  canViewOwnJobsOnly: boolean;
}

export const rolePermissions: Record<UserRole, RolePermissions> = {
  [UserRole.PLATFORM_OWNER]: {
    canViewAllWorkOrders: true,
    canCreateWorkOrders: true,
    canAssignTechnicians: true,
    canViewAllProperties: true,
    canEditProperties: true,
    canViewReports: true,
    canManageSettings: true,
    canManageTenants: true,
    canViewOwnJobsOnly: false,
  },
  [UserRole.TENANT_ADMIN]: {
    canViewAllWorkOrders: true,
    canCreateWorkOrders: true,
    canAssignTechnicians: true,
    canViewAllProperties: true,
    canEditProperties: true,
    canViewReports: true,
    canManageSettings: true,
    canManageTenants: false,
    canViewOwnJobsOnly: false,
  },
  [UserRole.OFFICE_STAFF]: {
    canViewAllWorkOrders: true,
    canCreateWorkOrders: true,
    canAssignTechnicians: true,
    canViewAllProperties: true,
    canEditProperties: true,
    canViewReports: true,
    canManageSettings: false,
    canManageTenants: false,
    canViewOwnJobsOnly: false,
  },
  [UserRole.TECHNICIAN]: {
    canViewAllWorkOrders: false,
    canCreateWorkOrders: false,
    canAssignTechnicians: false,
    canViewAllProperties: false,
    canEditProperties: false,
    canViewReports: false,
    canManageSettings: false,
    canManageTenants: false,
    canViewOwnJobsOnly: true,
  },
  [UserRole.READ_ONLY_OWNER]: {
    canViewAllWorkOrders: true,
    canCreateWorkOrders: false,
    canAssignTechnicians: false,
    canViewAllProperties: true,
    canEditProperties: false,
    canViewReports: true,
    canManageSettings: false,
    canManageTenants: false,
    canViewOwnJobsOnly: false,
  },
};
