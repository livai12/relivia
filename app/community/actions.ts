"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/getOrCreateProfile";
import { revalidatePath } from "next/cache";

export async function sharePost(body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Cerita tidak boleh kosong");
  if (trimmed.length > 2000) throw new Error("Cerita terlalu panjang (maks 2000 karakter)");

  const profile = await getOrCreateProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("community_posts")
    .insert({ author_id: profile.id, body: trimmed });

  if (error) throw error;

  revalidatePath("/community");
  return { ok: true };
}

export async function markHelpful(postId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("increment_helpful", { post_id: postId });
  if (error) throw error;

  revalidatePath("/community");
  return { ok: true };
}

export async function updateDisplayName(name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) throw new Error("Nama tidak valid");

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", user.id);

  if (error) throw error;

  revalidatePath("/community");
  return { ok: true };
}
