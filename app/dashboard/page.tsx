import { createClient } from "@/lib/supabase/server";
import { getOrCreatePatient } from "@/lib/getOrCreatePatient";
import TopNav from "@/components/TopNav";
import MonitoringChart from "@/components/MonitoringChart";
import Calendar from "@/components/Calendar";
import Link from "next/link";
import type { DailyCheckin } from "@/lib/types";
import { IconPill, IconFlame, IconAlertTriangle, IconSparkle } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const patient = await getOrCreatePatient();

  const { data: checkinsRaw } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("patient_id", patient.id)
    .order("checkin_date", { ascending: false })
    .limit(14);

  const checkins = ((checkinsRaw ?? []) as DailyCheckin[]).reverse();
  const last7 = checkins.slice(-7);
  const adherence = last7.length
    ? Math.round((last7.filter((c) => c.medication_taken).length / last7.length) * 100)
    : 0;
  const flagCount = checkins.filter((c) => c.behavior_change_flag).length;

  // Today's check-in
  const today = new Date().toISOString().slice(0, 10);
  const todayCheckin = checkins.find((c) => c.checkin_date === today) ?? null;

  // Health data today
  const { data: todayHealth } = await supabase
    .from("health_data")
    .select("*")
    .eq("patient_id", patient.id)
    .eq("recorded_at", today);

  // Baselines
  const { data: baselines } = await supabase
    .from("baselines")
    .select("*")
    .eq("patient_id", patient.id);

  const baselineMap: Record<string, number> = {};
  for (const b of baselines ?? []) baselineMap[b.metric] = b.baseline_value;

  const healthMap: Record<string, { value: number; unit: string }> = {};
  for (const d of todayHealth ?? []) healthMap[d.data_type] = { value: d.value, unit: d.unit };

  // Change detection summary
  const { data: recentChanges } = await supabase
    .from("detected_changes")
    .select("*")
    .eq("patient_id", patient.id)
    .gte("detected_at", new Date(Date.now() - 86400000 * 2).toISOString())
    .order("detected_at", { ascending: false })
    .limit(5);

  // Active agent session
  const { data: activeSession } = await supabase
    .from("agent_sessions")
    .select("*")
    .eq("patient_id", patient.id)
    .in("status", ["investigating", "waiting_for_caregiver"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Latest insight
  const { data: latestInsight } = await supabase
    .from("insights")
    .select("*")
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasChanges = (recentChanges ?? []).length > 0;
  const hasInsight = !!latestInsight;

  let changeStatus: "normal" | "change_detected" | "investigating" | "insight_ready" = "normal";
  if (hasInsight) changeStatus = "insight_ready";
  else if (activeSession) changeStatus = "investigating";
  else if (hasChanges) changeStatus = "change_detected";

  const STATUS_CONFIG = {
    normal: { label: "Tidak ada perubahan signifikan", color: "bg-green-tint text-green-deep", dot: "bg-green" },
    change_detected: { label: "Perubahan terdeteksi", color: "bg-amber-tint text-amber-deep", dot: "bg-amber" },
    investigating: { label: "Agent sedang menginvestigasi", color: "bg-primary-light text-primary-dark", dot: "bg-primary animate-pulse" },
    insight_ready: { label: "Insight siap ditinjau", color: "bg-green-tint text-green-deep", dot: "bg-green" },
  };
  const statusCfg = STATUS_CONFIG[changeStatus];

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav patientName={patient.name} patientAge={patient.age} />
      <div className="flex-1 px-4 md:px-[5vw] py-8 max-w-[1180px] mx-auto w-full">

        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="text-2xl font-extrabold mb-1">Halo 👋</h2>
            <p className="text-sm text-soft">Ini gambaran {checkins.length} hari terakhir pemantauan {patient.name}.</p>
          </div>
        </div>

        {/* Patient Card + Change Status */}
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          {/* Patient Card */}
          <div className="card flex items-center gap-4 px-5 py-5">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-lg flex-none">
              {patient.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold truncate">{patient.name}</div>
              {patient.age && <div className="text-xs text-soft">{patient.age} tahun</div>}
              <div className="text-[11px] text-faint mt-0.5">
                {todayCheckin ? `Check-in hari ini: ${today}` : "Belum check-in hari ini"}
              </div>
            </div>
            <Link href="/checkin" className="text-xs font-bold text-primary hover:underline flex-none">
              {todayCheckin ? "Edit" : "Check-in"}
            </Link>
          </div>

          {/* Change Status */}
          <div className="card px-5 py-5 flex flex-col justify-between">
            <div className="text-xs font-bold text-faint uppercase tracking-wide mb-3">Status Pemantauan</div>
            <div className={`inline-flex items-center gap-2 self-start px-3.5 py-2 rounded-full font-bold text-sm mb-4 ${statusCfg.color}`}>
              <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </div>
            {changeStatus === "change_detected" && (
              <Link href="/agent" className="btn-primary text-sm py-2.5 text-center rounded-xl">
                Lihat Status Monitoring →
              </Link>
            )}
            {changeStatus === "investigating" && (
              <Link href="/agent" className="btn-primary text-sm py-2.5 text-center rounded-xl">
                Lihat Investigasi →
              </Link>
            )}
            {changeStatus === "insight_ready" && (
              <Link href="/insight" className="text-sm font-bold text-green-deep hover:underline">
                Lihat Insight →
              </Link>
            )}
          </div>
        </div>

        {/* Today's Health Overview */}
        {(todayHealth ?? []).length > 0 && (
          <div className="card mb-5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-extrabold text-base">Data Kesehatan Hari Ini</h3>
              <Link href="/health" className="text-xs font-semibold text-primary hover:underline">Lihat semua →</Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {(["sleep_hours", "steps", "heart_rate"] as const).map((metric) => {
                const d = healthMap[metric];
                const baseline = baselineMap[metric];
                const labels: Record<string, { name: string; icon: string; unit: string }> = {
                  sleep_hours: { name: "Tidur", icon: "🌙", unit: "jam" },
                  steps: { name: "Langkah", icon: "🏃", unit: "langkah" },
                  heart_rate: { name: "Detak Jantung", icon: "❤️", unit: "bpm" },
                };
                const cfg = labels[metric];
                let changePercent: number | null = null;
                if (d && baseline) changePercent = Math.round(((d.value - baseline) / baseline) * 1000) / 10;
                const isDown = (changePercent ?? 0) < -14;

                return (
                  <div key={metric} className="px-5 py-4">
                    <div className="text-xs text-soft font-medium mb-1">{cfg.icon} {cfg.name}</div>
                    <div className="text-xl font-extrabold">
                      {d ? `${d.value} ${cfg.unit}` : <span className="text-faint text-base">—</span>}
                    </div>
                    {changePercent !== null && Math.abs(changePercent) >= 15 && (
                      <div className={`text-[11px] font-bold mt-0.5 ${isDown ? "text-red-deep" : "text-amber-deep"}`}>
                        {isDown ? "▼" : "▲"} {Math.abs(changePercent)}% dari baseline
                      </div>
                    )}
                    {changePercent !== null && Math.abs(changePercent) < 15 && (
                      <div className="text-[11px] text-faint mt-0.5">Dalam rentang normal</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={<IconPill size={20} />} iconBg="bg-primary-light" iconColor="text-primary" value={`${adherence}%`} label="Kepatuhan obat 7 hari" />
          <StatCard icon={<IconFlame size={20} />} iconBg="bg-green-tint" iconColor="text-green" value={String(checkins.length)} label="Hari tercatat" />
          <StatCard icon={<IconAlertTriangle size={20} />} iconBg="bg-amber-tint" iconColor="text-amber-deep" value={String(flagCount)} label="Hari ditandai berubah" />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link href="/checkin" className="btn-primary text-sm">📝 Catatan Harian</Link>
          <Link href="/health" className="text-sm font-semibold px-5 py-3 rounded-full border-2 border-border hover:border-primary/40 transition">📊 Data Kesehatan</Link>
          {latestInsight && (
            <Link href="/insight" className="text-sm font-semibold px-5 py-3 rounded-full border-2 border-green/40 bg-green-tint text-green-deep hover:border-green transition">
              <IconSparkle size={14} className="inline mr-1" /> Lihat Insight
            </Link>
          )}
        </div>

        {/* Chart */}
        <div className="card mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-5 border-b border-border">
            <h3 className="font-extrabold text-base">Grafik Pemantauan</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-soft font-medium">
              <span className="flex items-center gap-1.5"><i className="w-2.5 h-0.5 bg-primary inline-block" /> Mood</span>
              <span className="flex items-center gap-1.5"><i className="w-2.5 h-0.5 bg-amber inline-block" /> Tidur</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-green inline-block" /> Obat diminum</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red inline-block" /> Terlewat</span>
            </div>
          </div>
          <MonitoringChart checkins={checkins} />
        </div>

        {/* Calendar */}
        <div className="card mb-5">
          <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-border">
            <h3 className="font-extrabold text-base">Kalender Pencatatan</h3>
            <span className="text-xs text-faint font-medium hidden sm:block">Klik tanggal untuk lompat ke catatannya</span>
          </div>
          <Calendar checkins={checkins} />
        </div>

        {/* Log */}
        <div className="card">
          <div className="px-4 sm:px-6 py-5 border-b border-border">
            <h3 className="font-extrabold text-base">Log Harian</h3>
          </div>
          <ul>
            {checkins.length === 0 && (
              <li className="px-4 sm:px-6 py-8 text-sm text-soft text-center">Belum ada catatan harian.</li>
            )}
            {checkins.slice().reverse().map((c) => (
              <li key={c.id} id={`log-${c.checkin_date}`} className="grid grid-cols-[70px_1fr_auto] sm:grid-cols-[82px_1fr_auto] gap-3 px-4 sm:px-6 py-3.5 border-t border-border/60 first:border-t-0 items-start">
                <div className="text-xs text-faint font-bold pt-0.5">{c.checkin_date}</div>
                <div className="text-sm leading-relaxed">
                  <div className="flex gap-1.5 mb-1 flex-wrap">
                    {c.behavior_change_flag && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-tint text-red-deep">berubah dari pola</span>
                    )}
                    {!c.medication_taken && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-tint text-red-deep">obat terlewat</span>
                    )}
                    {c.behavior_change && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-tint text-amber-deep">perubahan perilaku</span>
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
