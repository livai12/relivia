import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Every caregiver gets a lightweight public profile the first time they touch
 * a community feature (viewing or posting). display_name defaults to the
 * local part of their email since we don't collect a real name at signup —
 * it can be changed later from the community page.
 */
export async function getOrCreateProfile(): Promise<Profile> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing as Profile;

  const defaultName = user.email ? user.email.split("@")[0] : "Caregiver";

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ id: user.id, display_name: defaultName })
    .select("*")
    .single();

  if (error) throw error;
  return created as Profile;
}
