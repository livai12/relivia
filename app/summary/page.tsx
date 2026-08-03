import { createClient } from "@/lib/supabase/server";
import { getOrCreatePatient } from "@/lib/getOrCreatePatient";
import TopNav from "@/components/TopNav";
import SummaryClient from "@/components/SummaryClient";
import type { AiInsight, DailyCheckin } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const supabase = createClient();
  const patient = await getOrCreatePatient();

  const { data: latest } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("patient_id", patient.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: checkinsRaw } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("patient_id", patient.id)
    .order("checkin_date", { ascending: true })
    .limit(30);

  const checkins = (checkinsRaw ?? []) as DailyCheckin[];
  const insight = latest as AiInsight | null;

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav patientName={patient.name} patientAge={patient.age} />
      <div className="flex-1 px-[5vw] py-8">
        <div className="max-w-[1180px] mx-auto mb-6">
          <h2 className="text-2xl font-extrabold mb-1">Ringkasan Konsultasi</h2>
          <p className="text-sm text-soft">Halaman ini yang kamu tunjukkan ke psikiater — cetak atau unduh sebagai PDF.</p>
        </div>
        <div className="max-w-[1180px] mx-auto">
          <SummaryClient checkins={checkins} insight={insight} patientName={patient.name} />
        </div>
      </div>
    </div>
  );
}
