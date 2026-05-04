// GHL API Client — Placeholder
// Implement in Phase 5

export const GHL_API_BASE = process.env.GHL_API_BASE_URL ?? "https://services.leadconnectorhq.com";

// TODO: Implement authenticated GHL API client
// TODO: Handle token refresh
// TODO: Handle rate limiting
export async function ghlFetch(path: string, options?: RequestInit) {
  throw new Error("GHL client not yet implemented — Phase 5");
}
