/**
 * Shared Relivia Agent core (PRD §16–§19).
 *
 * Single source of truth for the investigation prompt, Gemini call, and
 * response parsing — used by both the manual /api/agent/investigate route
 * and the automatic pipeline (lib/autoTrigger.ts) so behavior is identical.
 *
 * Safety rules are part of the system prompt: never diagnose, never predict
 * relapse, never give medication advice (PRD out-of-scope).
 */

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

export const AGENT_SYSTEM_PROMPT = `You are Relivia Agent, an AI that helps caregivers of schizophrenia patients monitor behavioral changes.

CRITICAL SAFETY RULES — NEVER VIOLATE:
- NEVER use words like "relapse", "kambuh", "diagnosis", "terdiagnosis"
- NEVER state the patient is definitely deteriorating
- NEVER give medication advice
- ALWAYS include a note that this is not a clinical diagnosis
- Use phrases like "meaningful change from baseline", "pattern worth discussing with a psychiatrist"

YOUR ROLE:
You investigate changes in patient behavior data. Given the current context:
1. Determine if you have enough information to generate a clinical insight
2. If NOT enough info: generate ONE focused follow-up question to ask the caregiver
3. If enough info: generate the clinical insight

ALWAYS respond with ONLY valid JSON, no markdown, in this exact format:

If you need more information:
{
  "needs_more_info": true,
  "question": "Your focused question in Bahasa Indonesia",
  "question_focus": "what specific gap this question addresses"
}

If you have enough information:
{
  "needs_more_info": false,
  "insight": {
    "summary": "2-3 sentence summary in Bahasa Indonesia",
    "detected_changes": ["change description 1", "change description 2"],
    "related_factors": ["factor 1", "factor 2"],
    "monitoring_points": ["what to watch 1", "what to watch 2"],
    "interpretation": "1-2 sentence interpretation in Bahasa Indonesia, factual and non-alarmist",
    "context_notes": "context from caregiver answers if any"
  }
}`;

export const DEFAULT_QUESTION =
  "Apakah pasien akhir-akhir ini lebih sering menghindari interaksi dengan orang lain di sekitarnya?";
export const DEFAULT_QUESTION_FOCUS = "social_withdrawal";

export type AgentInsight = {
  summary: string;
  detected_changes: string[];
  related_factors: string[];
  monitoring_points: string[];
  interpretation: string;
  context_notes: string;
};

export type AgentDecision = {
  needs_more_info: boolean;
  question?: string;
  question_focus?: string;
  insight?: AgentInsight;
};

/** Strict PRD §31: Gemini failure throws — callers must NOT fabricate insights. */
export async function callGeminiInvestigate(contextText: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: AGENT_SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: contextText }] }],
      generationConfig: { maxOutputTokens: 1200, temperature: 0.3 },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? ""
  );
}

/** Parse agent JSON; falls back to one default question when unparseable. */
export function parseAgentDecision(raw: string): AgentDecision {
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as AgentDecision;
  } catch {
    return {
      needs_more_info: true,
      question: DEFAULT_QUESTION,
      question_focus: DEFAULT_QUESTION_FOCUS,
    };
  }
}
