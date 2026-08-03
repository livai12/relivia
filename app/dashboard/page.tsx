import { createClient } from "@/lib/supabase/server";
import { getOrCreatePatient } from "@/lib/getOrCreatePatient";
import TopNav from "@/components/TopNav";
import MonitoringChart from "@/components/MonitoringChart";
import Calendar from "@/components/Calendar";
import type { DailyCheckin } from "@/lib/types";
import { IconPill, IconFlame, IconAlertTriangle } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const patient = await getOrCreatePatient();

  const { data: checkinsRaw } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("patient_id", patient.id)
    .order("checkin_date", { ascending: true })
    .limit(14);

  const checkins = (checkinsRaw ?? []) as DailyCheckin[];
  const last7 = checkins.slice(-7);
  const adherence = last7.length
    ? Math.round((last7.filter((c) => c.medication_taken).length / last7.length) * 100)
    : 0;
  const flagCount = checkins.filter((c) => c.behavior_change_flag).length;

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav patientName={patient.name} patientAge={patient.age} />
      <div className="flex-1 px-[5vw] py-8 max-w-[1180px] mx-auto w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="text-2xl font-extrabold mb-1">Halo</h2>
            <p className="text-sm text-soft">Ini gambaran {checkins.length} hari terakhir pemantauan {patient.name}.</p>
          </div>
          {flagCount > 0 && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-tint text-amber-deep font-bold text-xs">
              <IconAlertTriangle size={13} /> Perlu perhatian lebih
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={<IconPill size={20} />} iconBg="bg-primary-light" iconColor="text-primary" value={`${adherence}%`} label="Kepatuhan obat 7 hari" />
          <StatCard icon={<IconFlame size={20} />} iconBg="bg-green-tint" iconColor="text-green" value={String(checkins.length)} label="Hari tercatat" />
          <StatCard icon={<IconAlertTriangle size={20} />} iconBg="bg-amber-tint" iconColor="text-amber-deep" value={String(flagCount)} label="Hari ditandai berubah" />
        </div>

        <div className="card mb-5">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <h3 className="font-extrabold text-base">Grafik Pemantauan</h3>
            <div className="flex gap-4 text-xs text-soft font-medium">
              <span className="flex items-center gap-1.5"><i className="w-2.5 h-0.5 bg-primary inline-block" /> Mood</span>
              <span className="flex items-center gap-1.5"><i className="w-2.5 h-0.5 bg-amber inline-block" /> Tidur</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-green inline-block" /> Obat diminum</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red inline-block" /> Terlewat</span>
            </div>
          </div>
          <MonitoringChart checkins={checkins} />
        </div>

        <div className="card mb-5">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <h3 className="font-extrabold text-base">Kalender Pencatatan</h3>
            <span className="text-xs text-faint font-medium">Klik tanggal untuk lompat ke catatannya</span>
          </div>
          <Calendar checkins={checkins} />
        </div>

        <div className="card">
          <div className="px-6 py-5 border-b border-border">
            <h3 className="font-extrabold text-base">Log Harian</h3>
          </div>
          <ul>
            {checkins.length === 0 && (
              <li className="px-6 py-8 text-sm text-soft text-center">Belum ada catatan harian.</li>
            )}
            {checkins.slice().reverse().map((c) => (
              <li key={c.id} id={`log-${c.checkin_date}`} className="grid grid-cols-[82px_1fr_auto] gap-3.5 px-6 py-3.5 border-t border-border/60 first:border-t-0 items-start">
                <div className="text-xs text-faint font-bold pt-0.5">{c.checkin_date}</div>
                <div className="text-sm leading-relaxed">
                  <div className="flex gap-1.5 mb-1 flex-wrap">
                    {c.behavior_change_flag && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-tint text-red-deep">berubah dari pola</span>
                    )}
                    {!c.medication_taken && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-tint text-red-deep">obat terlewat</span>
                    )}
                  </div>
                  {c.free_text_note}
                </div>
                <div className={`w-2 h-2 rounded-full mt-1.5 ${c.medication_taken ? "bg-green" : "bg-red"}`} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, iconColor, value, label }: { icon: React.ReactNode; iconBg: string; iconColor: string; value: string; label: string }) {
  return (
    <div className="card flex items-center gap-4 px-5 py-5">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-none ${iconBg} ${iconColor}`}>{icon}</div>
      <div>
        <div className="text-2xl font-extrabold tracking-tight">{value}</div>
        <div className="text-xs text-soft font-medium">{label}</div>
      </div>
    </div>
  );
}
