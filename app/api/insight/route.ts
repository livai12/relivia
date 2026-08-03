import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreatePatient } from "@/lib/getOrCreatePatient";

const SYSTEM_PROMPT = `You are a clinical documentation assistant for a caregiver-facing app called Relivia.
You do NOT diagnose or predict relapse. You summarize caregiver observations and highlight
notable changes for a psychiatrist's reference.

Rules:
- Never output a numeric risk score or percentage.
- risk_category must be exactly one of: "low", "medium", "high".
- contributing_factors: 3-5 short bullet strings in Bahasa Indonesia, each referencing a concrete
  pattern in the data provided (do not invent facts not present in the input).
- clinical_summary: 2-3 sentences in Bahasa Indonesia, written for a psychiatrist, plain and factual.
- Respond with ONLY strict JSON matching this shape, no markdown, no preamble:
  {"risk_category": "low" | "medium" | "high", "contributing_factors": string[], "clinical_summary": string}`;

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const patient = await getOrCreatePatient();

  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("patient_id", patient.id)
    .order("checkin_date", { ascending: true })
    .limit(14);

  if (!checkins || checkins.length < 3) {
    return NextResponse.json(
      { error: "Butuh minimal 3 hari catatan sebelum insight bisa dibuat." },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY belum diset di environment variables." },
      { status: 500 }
    );
  }

  const inputData = checkins.map((c) => ({
    date: c.checkin_date,
    mood: c.mood,
    sleep_quality: c.sleep_quality,
    social_interaction: c.social_interaction,
    medication_taken: c.medication_taken,
    note: c.free_text_note,
  }));

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `14-day caregiver observation data (JSON):\n${JSON.stringify(inputData, null, 2)}` },
      ],
    }),
  });

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text();
    return NextResponse.json({ error: "Gagal memanggil Anthropic API", detail }, { status: 502 });
  }

  const data = await anthropicRes.json();
  const rawText: string = data.content?.find((b: any) => b.type === "text")?.text ?? "{}";

  let parsed: { risk_category: string; contributing_factors: string[]; clinical_summary: string };
  try {
    parsed = JSON.parse(rawText.trim());
  } catch {
    return NextResponse.json({ error: "AI mengembalikan format yang tidak bisa dibaca.", raw: rawText }, { status: 502 });
  }

  const { data: saved, error } = await supabase
    .from("ai_insights")
    .insert({
      patient_id: patient.id,
      risk_category: parsed.risk_category,
      contributing_factors: parsed.contributing_factors,
      summary_text: parsed.clinical_summary,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ insight: saved });
}
