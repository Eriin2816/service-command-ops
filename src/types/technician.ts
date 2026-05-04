// Technician Types — Placeholder

export enum UserRole {
  PLATFORM_OWNER = "platform_owner",
  TENANT_ADMIN = "tenant_admin",
  OFFICE_STAFF = "office_staff",
  TECHNICIAN = "technician",
  READ_ONLY_OWNER = "read_only_owner",
}

export interface Technician {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateTechnicianInput = Omit<Technician, "id" | "created_at" | "updated_at">;
export type UpdateTechnicianInput = Partial<CreateTechnicianInput>;
