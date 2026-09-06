import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

const BRIEF_SYSTEM_PROMPT = `You are Relivia, a clinical documentation assistant. Generate a structured Consultation Brief for a caregiver to share with their patient's psychiatrist.

RULES:
- Write in Bahasa Indonesia
- Be factual and concise, not alarmist
- NEVER use "relapse", "kambuh", or give diagnostic conclusions
- Always include disclaimer that this is not a clinical diagnosis
- Format: structured JSON only, no markdown

Respond with valid JSON:
{
  "key_changes": ["change 1", "change 2"],
  "caregiver_observation": "summary of what caregiver observed",
  "questions_for_consultation": ["question 1", "question 2"],
  "full_summary": "2-3 paragraph narrative in Bahasa Indonesia for the psychiatrist"
}`;

async function callGemini(context: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: BRIEF_SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: context }] }],
      generationConfig: { maxOutputTokens: 1500, temperature: 0.2 },
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
}

export async function GET(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { patientId } = params;

    // Verify ownership
    const { data: patient } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .eq("caregiver_id", user.id)
      .single();
    if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Get latest consultation brief
    const { data: brief } = await supabase
      .from("consultation_briefs")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ brief: brief ?? null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { patientId } = params;
    const body = await req.json().catch(() => ({}));
    const insight_id: string | undefined = body.insight_id;

    // Verify ownership
    const { data: patient } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .eq("caregiver_id", user.id)
      .single();
    if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch the referenced insight
    let insight = null;
    if (insight_id) {
      const { data } = await supabase
        .from("insights")
        .select("*")
        .eq("id", insight_id)
        .single();
      insight = data;
    } else {
      const { data } = await supabase
        .from("insights")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      insight = data;
    }

    // Fetch recent checkins for medication info
    const { data: checkins } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("patient_id", patientId)
      .order("checkin_date", { ascending: false })
      .limit(7);

    // Fetch baselines for comparison
    const { data: baselines } = await supabase
      .from("baselines")
      .select("*")
      .eq("patient_id", patientId);

    const baselineMap: Record<string, number> = {};
    for (const b of baselines ?? []) baselineMap[b.metric] = b.baseline_value;

    // Get related agent session
    let session = null;
    if (insight?.agent_session_id) {
      const { data } = await supabase
        .from("agent_sessions")
        .select("*")
        .eq("id", insight.agent_session_id)
        .single();
      session = data;
    }

    const medicationAdherence = checkins?.length
      ? Math.round((checkins.filter((c) => c.medication_taken).length / checkins.length) * 100)
      : null;

    const observationStart = checkins?.length
      ? checkins[checkins.length - 1]?.checkin_date
      : null;
    const observationEnd = checkins?.[0]?.checkin_date ?? null;

    const contextForGemini = `
Pasien: ${patient.name}
Periode observasi: ${observationStart ?? "-"} s/d ${observationEnd ?? "-"}

PERUBAHAN TERDETEKSI:
${(insight?.detected_changes ?? []).map((c: { metric: string; baseline: number; current: number; change_percent: number }) =>
  `- ${c.metric}: ${c.current} (baseline: ${c.baseline}, perubahan: ${c.change_percent > 0 ? "+" : ""}${c.change_percent}%)`
).join("\n") || "Tidak ada data perubahan tersedia."}

BASELINE PASIEN:
${Object.entries(baselineMap).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

FAKTOR TERKAIT:
${(insight?.related_factors ?? []).join(", ")}

POIN PEMANTAUAN:
${(insight?.monitoring_points ?? []).join(", ")}

KONTEKS DARI CAREGIVER:
${insight?.context_notes ?? "-"}

RINGKASAN INSIGHT:
${insight?.summary ?? "-"}

JAWABAN CAREGIVER SELAMA INVESTIGASI:
${(session?.caregiver_responses ?? []).join("; ") || "-"}

KEPATUHAN OBAT (7 hari terakhir): ${medicationAdherence != null ? medicationAdherence + "%" : "Tidak diketahui"}

Buat Consultation Brief yang komprehensif berdasarkan semua informasi di atas.
`;

    const rawGemini = await callGemini(contextForGemini);
    let briefData: {
      key_changes: string[];
      caregiver_observation: string;
      questions_for_consultation: string[];
      full_summary: string;
    };

    try {
      const cleaned = rawGemini.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      briefData = JSON.parse(cleaned);
    } catch {
      briefData = {
        key_changes: insight?.detected_changes?.map((c: { metric: string }) => c.metric) ?? [],
        caregiver_observation: insight?.context_notes ?? "-",
        questions_for_consultation: insight?.monitoring_points ?? [],
        full_summary: insight?.summary ?? "Terdapat perubahan dari pola biasanya pasien.",
      };
    }

    const baselineComparison: Record<string, { baseline: number; current: number; unit: string }> = {};
    for (const c of insight?.detected_changes ?? []) {
      const ch = c as { metric: string; baseline: number; current: number };
      baselineComparison[ch.metric] = {
        baseline: ch.baseline,
        current: ch.current,
        unit: "",
      };
    }

    const { data: savedBrief, error } = await supabase
      .from("consultation_briefs")
      .insert({
        patient_id: patientId,
        insight_id: insight?.id ?? null,
        observation_period_start: observationStart,
        observation_period_end: observationEnd,
        key_changes: briefData.key_changes,
        baseline_comparison: baselineComparison,
        caregiver_observation: briefData.caregiver_observation,
        medication_status: medicationAdherence != null ? `${medicationAdherence}% dari 7 hari` : "Tidak diketahui",
        questions_for_consultation: briefData.questions_for_consultation,
        full_content: briefData.full_summary,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ brief: savedBrief });
  } catch (err) {
    console.error("[consultation]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
