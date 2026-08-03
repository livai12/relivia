import { createClient } from "@/lib/supabase/server";
import { getOrCreatePatient } from "@/lib/getOrCreatePatient";
import TopNav from "@/components/TopNav";
import InsightPanel from "@/components/InsightPanel";
import type { AiInsight } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InsightPage() {
  const supabase = createClient();
  const patient = await getOrCreatePatient();

  const { data: latest } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("patient_id", patient.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav patientName={patient.name} patientAge={patient.age} />
      <div className="flex-1 px-[5vw] py-8 max-w-[1180px] mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold mb-1">Insight Klinis</h2>
          <p className="text-sm text-soft">Satu klik, catatan harian jadi pola yang siap dibawa ke psikiater.</p>
        </div>
        <InsightPanel patientName={patient.name} latest={(latest as AiInsight) ?? null} />
      </div>
    </div>
  );
}
