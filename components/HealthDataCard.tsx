"use client";

import { useState } from "react";

type HealthMetric = {
  metric: string;
  today_value: number | null;
  today_unit: string | null;
  baseline_value: number | null;
  change_percent: number | null;
  has_data: boolean;
};

const METRIC_CONFIG: Record<string, { label: string; icon: string; unit_display: string }> = {
  sleep_hours: { label: "Durasi Tidur", icon: "🌙", unit_display: "jam" },
  steps: { label: "Langkah / Aktivitas", icon: "🏃", unit_display: "langkah" },
  heart_rate: { label: "Detak Jantung", icon: "❤️", unit_display: "bpm" },
};

export default function HealthDataCard({
  metrics,
  patientId,
}: {
  metrics: HealthMetric[];
  patientId: string;
}) {
  const [syncing, setSyncing] = useState(false);
  const [seedingBaseline, setSeedingBaseline] = useState(false);
  const [seedingChange, setSeedingChange] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/patient/${patientId}/baseline`);
      if (!res.ok) throw new Error("Gagal sinkronisasi");
      setMessage("Baseline berhasil diperbarui.");
    } catch (e) {
      setMessage(String(e));
    } finally {
      setSyncing(false);
    }
  }

  async function seedDemo(scenario: "baseline_week" | "change_day") {
    const setter = scenario === "baseline_week" ? setSeedingBaseline : setSeedingChange;
    setter(true);
    setMessage(null);
    try {
      const res = await fetch("/api/health-sync", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId, scenario }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal");
      if (scenario === "baseline_week") {
        setMessage(
          `✅ Data baseline 7 hari berhasil di-seed (${json.seeded} records).`
        );
        // Refresh baseline calculation
        await fetch(`/api/patient/${patientId}/baseline`);
      } else {
        // Day-8 demo: detection + agent already ran automatically (PRD §37).
        // Fire the trigger notification like the native layer would.
        if (json.notification?.sessionId) {
          try {
            const { notifyAgent } = await import("@/lib/nativeBridge");
            await notifyAgent({
              type: json.notification.type,
              sessionId: json.notification.sessionId,
            });
          } catch {
            /* in-app banner via AutoMonitorProvider polling covers this */
          }
        }
        setMessage(
          json.agentSessionId
            ? `✅ Perubahan terdeteksi otomatis — sesi investigasi dibuat (Agent analysis ${json.agentError ? "unavailable" : "berjalan"}). Buka /agent untuk melihat pertanyaan Relivia.`
            : `✅ Data perubahan hari ini berhasil di-seed (${json.seeded} records). Reload untuk melihat perubahan.`
        );
        await fetch(`/api/patient/${patientId}/baseline`);
      }
    } catch (e) {
      setMessage(String(e));
    } finally {
      setter(false);
    }
  }

  return (
    <div>
      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        {metrics.map((m) => {
          const cfg = METRIC_CONFIG[m.metric] ?? { label: m.metric, icon: "📊", unit_display: "" };
          const isDown = (m.change_percent ?? 0) < 0;
          const isUp = (m.change_percent ?? 0) > 0;
          const isNeutral = m.change_percent === 0 || m.change_percent === null;
          const isChange = Math.abs(m.change_percent ?? 0) >= 15;

          return (
            <div key={m.metric} className={`card p-5 border-2 transition ${isChange ? (isDown ? "border-red/40" : "border-amber/40") : "border-transparent"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{cfg.icon}</span>
                {m.change_percent !== null && (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    isDown && isChange ? "bg-red-tint text-red-deep" :
                    isUp && isChange ? "bg-amber-tint text-amber-deep" :
                    "bg-bg text-faint"
                  }`}>
                    {isDown ? "▼" : isUp ? "▲" : "→"} {Math.abs(m.change_percent)}%
                  </span>
                )}
              </div>
              <div className="text-2xl font-extrabold mb-0.5">
                {m.has_data && m.today_value !== null
                  ? `${m.today_value} ${cfg.unit_display}`
                  : <span className="text-faint text-lg">—</span>}
              </div>
              <div className="text-xs text-soft font-medium mb-1">{cfg.label}</div>
              {m.baseline_value !== null && (
                <div className="text-[11px] text-faint">
                  Baseline: {m.baseline_value} {cfg.unit_display}
                  {m.change_percent !== null && isChange && (
                    <span className={isDown ? " text-red-deep font-semibold" : " text-amber-deep font-semibold"}>
                      {" "}· {isDown ? "Menurun" : "Meningkat"} dari baseline
                    </span>
                  )}
                </div>
              )}
              {!m.has_data && (
                <div className="text-[11px] text-faint italic mt-1">Belum ada data hari ini</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback message */}
      {message && (
        <div className={`text-sm rounded-xl px-4 py-3 mb-4 ${
          message.startsWith("✅") ? "bg-green-tint text-green-deep" : "bg-red-tint text-red-deep"
        }`}>
          {message}
        </div>
      )}

      {/* Sync & Demo Controls */}
      <div className="card p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-faint mb-3">
          Simulasi Health Connect
        </div>
        <p className="text-xs text-soft mb-4 leading-relaxed">
          Karena app berjalan di web, Health Connect Android disimulasikan.
          Gunakan tombol di bawah untuk demo scenario PRD (Day 1–7 baseline + Day 8 perubahan).
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => seedDemo("baseline_week")}
            disabled={seedingBaseline}
            className="text-sm font-semibold px-4 py-2.5 rounded-xl border-2 border-border hover:border-primary/40 transition disabled:opacity-60"
          >
            {seedingBaseline ? "Seeding…" : "🌱 Seed 7 Hari Baseline"}
          </button>
          <button
            onClick={() => seedDemo("change_day")}
            disabled={seedingChange}
            className="text-sm font-semibold px-4 py-2.5 rounded-xl border-2 border-amber/50 bg-amber-tint text-amber-deep hover:border-amber transition disabled:opacity-60"
          >
            {seedingChange ? "Seeding…" : "⚡ Simulasi Hari Perubahan"}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-sm font-semibold px-4 py-2.5 rounded-xl border-2 border-primary/30 bg-primary-light text-primary hover:border-primary transition disabled:opacity-60"
          >
            {syncing ? "Menghitung…" : "🔄 Hitung Ulang Baseline"}
          </button>
        </div>
      </div>
    </div>
  );
}
