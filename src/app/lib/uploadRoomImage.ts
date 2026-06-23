import { supabase } from "@/integrations/supabase/client";

const BUCKET = "room-images";

export async function uploadRoomImage(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image too large. Max 5 MB.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
