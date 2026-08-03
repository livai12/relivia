"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrCreatePatient } from "@/lib/getOrCreatePatient";
import { revalidatePath } from "next/cache";

export type CheckinInput = {
  mood: number;
  sleep_quality: number;
  social_interaction: number;
  medication_taken: boolean;
  free_text_note: string;
};

export async function submitCheckin(input: CheckinInput) {
  const supabase = createClient();
  const patient = await getOrCreatePatient();
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("daily_checkins").upsert(
    {
      patient_id: patient.id,
      checkin_date: today,
      mood: input.mood,
      sleep_quality: input.sleep_quality,
      social_interaction: input.social_interaction,
      medication_taken: input.medication_taken,
      free_text_note: input.free_text_note || null,
    },
    { onConflict: "patient_id,checkin_date" }
  );

  if (error) throw error;

  revalidatePath("/dashboard");
  revalidatePath("/checkin");
  return { ok: true };
}
