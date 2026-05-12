// Tenant Types

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ghl_location_id?: string;
  ghl_api_token_encrypted?: string;
  is_active: boolean;
  plan?: string;
  created_at: string;
  updated_at: string;
}

export type CreateTenantInput = Omit<Tenant, "id" | "created_at" | "updated_at">;
export type UpdateTenantInput = Partial<CreateTenantInput>;
