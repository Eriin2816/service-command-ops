import { type NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/api-auth";
import { db } from "@/lib/db/client";
import { uploadAvatar, deleteAvatar, validateAvatarFile } from "@/lib/storage/avatars";

// ---------------------------------------------------------------------------
// POST /api/profile/avatar
// Accepts multipart/form-data with a `file` field.
// Uploads to Supabase Storage (avatars bucket), updates users.avatar_url.
// Returns { data: { url: string } }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.id;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 422 });
  }

  const validationError = validateAvatarFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 });
  }

  const filename = file instanceof File ? file.name : `avatar-${Date.now()}.jpg`;

  let publicUrl: string;
  try {
    publicUrl = await uploadAvatar(userId, file, filename);
  } catch (err) {
    console.error("[api] POST /api/profile/avatar upload:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const { error: dbError } = await db
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (dbError) {
    console.error("[api] POST /api/profile/avatar db:", dbError);
    return NextResponse.json({ error: "Failed to save avatar" }, { status: 500 });
  }

  return NextResponse.json({ data: { url: publicUrl } }, { status: 200 });
}

// ---------------------------------------------------------------------------
// DELETE /api/profile/avatar
// Removes avatar from storage and clears users.avatar_url.
// ---------------------------------------------------------------------------

export async function DELETE(_request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const userId = auth.session.user.id;

  try {
    await deleteAvatar(userId);
  } catch (err) {
    console.error("[api] DELETE /api/profile/avatar storage:", err);
    return NextResponse.json({ error: "Failed to delete avatar" }, { status: 500 });
  }

  const { error: dbError } = await db
    .from("users")
    .update({ avatar_url: null })
    .eq("id", userId);

  if (dbError) {
    console.error("[api] DELETE /api/profile/avatar db:", dbError);
    return NextResponse.json({ error: "Failed to clear avatar" }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
