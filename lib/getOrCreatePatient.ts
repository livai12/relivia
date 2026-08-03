import { createClient } from "@/lib/supabase/server";
import type { Patient } from "@/lib/types";

/**
 * MVP scope: one caregiver -> one patient. If the logged-in caregiver
 * doesn't have a patient yet, create a default one so the app never
 * shows an empty "no patient" state during the demo.
 */
export async function getOrCreatePatient(): Promise<Patient> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("patients")
    .select("*")
    .eq("caregiver_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing) return existing as Patient;

  const { data: created, error } = await supabase
    .from("patients")
    .insert({ caregiver_id: user.id, name: "Pasien Baru", note: null })
    .select("*")
    .single();

  if (error) throw error;
  return created as Patient;
}
