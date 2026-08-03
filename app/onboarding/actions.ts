"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type OnboardingInput = {
  patientName: string;
  patientAge: number;
  caregiverName: string;
  city: string;
};

export async function completeOnboarding(input: OnboardingInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!input.patientName.trim() || !input.caregiverName.trim() || !input.city.trim()) {
    throw new Error("Semua field wajib diisi");
  }
  if (!input.patientAge || input.patientAge < 1 || input.patientAge > 120) {
    throw new Error("Umur pasien tidak valid");
  }

  const { data: existingPatient } = await supabase
    .from("patients")
    .select("id")
    .eq("caregiver_id", user.id)
    .maybeSingle();

  if (existingPatient) {
    const { error } = await supabase
      .from("patients")
      .update({ name: input.patientName.trim(), age: input.patientAge })
      .eq("id", existingPatient.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("patients")
      .insert({ caregiver_id: user.id, name: input.patientName.trim(), age: input.patientAge });
    if (error) throw error;
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: input.caregiverName.trim(), city: input.city.trim() })
      .eq("id", user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("profiles")
      .insert({ id: user.id, display_name: input.caregiverName.trim(), city: input.city.trim() });
    if (error) throw error;
  }

  redirect("/dashboard");
}
