/**
 * Server-only — never import in client components.
 * Avatars bucket is public; getPublicUrl() returns a stable CDN URL.
 */

import { db } from "@/lib/db/client";

const AVATAR_BUCKET = process.env.AVATAR_BUCKET ?? "avatars";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateAvatarFile(file: Blob): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Unsupported file type. Use JPEG, PNG, or WebP.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "File too large. Maximum size is 5 MB.";
  }
  return null;
}

export async function uploadAvatar(
  userId: string,
  file: Blob,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  // Remove existing avatars for this user before uploading the new one
  const { data: existing } = await db.storage
    .from(AVATAR_BUCKET)
    .list(userId);

  if (existing?.length) {
    await db.storage
      .from(AVATAR_BUCKET)
      .remove(existing.map((f) => `${userId}/${f.name}`))
      .catch(() => null);
  }

  const { error } = await db.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`[storage] Avatar upload failed: ${error.message}`);

  const { data } = db.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteAvatar(userId: string): Promise<void> {
  const { data: existing } = await db.storage
    .from(AVATAR_BUCKET)
    .list(userId);

  if (existing?.length) {
    await db.storage
      .from(AVATAR_BUCKET)
      .remove(existing.map((f) => `${userId}/${f.name}`));
  }
}
