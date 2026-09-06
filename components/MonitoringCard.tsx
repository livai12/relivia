"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAutoMonitor } from "@/components/AutoMonitorProvider";
import {
  backendBaseUrl,
  enableBackgroundSync,
  healthAvailability,
  isNative,
  requestHealthPermissions,
} from "@/lib/nativeBridge";

/**
 * Monitoring onboarding card (PRD §10):
 *
 *   Connect Health Data → Health Connect permission →
 *   Notification permission → Background sync → Monitoring Active
 *
 * If Health Connect is unavailable the card reports
 * "Monitoring health data unavailable" — caregiver check-in and all other
 * features keep working (graceful degradation).
 */
export default function MonitoringCard({ patientId }: { patientId: string }) {
  const { monitoringActive, setMonitoringActive } = useAutoMonitor();
  const [native, setNative] = useState<boolean | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const n = await isNative();
      if (cancelled) return;
      setNative(n);
      if (n) {
        try {
          const a = await healthAvailability();
          if (!cancelled) setAvailable(a?.available ?? false);
        } catch {
          if (!cancelled) setAvailable(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConnect() {
    setBusy(true);
    setMessage(null);
    try {
      const onNative = await isNative();

      if (onNative) {
        // 1. Health Connect permission (explicit, PRD §10)
        const perm = await requestHealthPermissions();
        if (!perm.allGranted) {
          setMessage(
            "Izin Health Connect belum lengkap. Monitoring health data unavailable — kamu tetap bisa memakai check-in harian."
          );
          return;
        }
        // 2. Schedule background worker with the caregiver's session token
        //    (worker authenticates via Authorization: Bearer, PRD §11).
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Sesi login tidak ditemukan. Login ulang.");
        const scheduled = await enableBackgroundSync({
          backendUrl: backendBaseUrl(),
          patientId,
          token,
        });
        if (!scheduled) throw new Error("Gagal menjadwalkan background sync.");
        // 3. Notification permission (best effort — trigger also has in-app banner)
        try {
          if ("Notification" in window && Notification.permission === "default") {
            await Notification.requestPermission();
          }
        } catch {
          /* ignore */
        }
        setMonitoringActive(true);
        setMessage("✅ Monitoring aktif. Data akan disinkronkan otomatis di background.");
      } else {
        // Web demo: no native layer — monitoring runs via manual/simulation sync.
        setMonitoringActive(true);
        setMessage(
          "✅ Monitoring simulasi aktif di browser. Di APK Android, langkah ini akan menghubungkan Health Connect asli."
        );
      }
    } catch (e) {
      setMessage(
        e instanceof Error && e.message === "Monitoring health data unavailable"
          ? "Monitoring health data unavailable — kamu tetap bisa memakai check-in harian dan fitur lain."
          : `Gagal mengaktifkan monitoring: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5 mb-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-faint mb-1">
            Automatic Monitoring
          </div>
          <div className="font-extrabold">
            {monitoringActive ? "🟢 Monitoring Aktif" : "⚪ Monitoring Belum Aktif"}
          </div>
        </div>
        {!monitoringActive && (
          <button
            onClick={handleConnect}
            disabled={busy}
            className="text-sm font-bold px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition disabled:opacity-60"
          >
            {busy ? "Menghubungkan…" : "🔗 Connect Health Data"}
          </button>
        )}
      </div>

      <p className="text-xs text-soft leading-relaxed">
        {native === true && available === false
          ? "Health Connect tidak tersedia di perangkat ini. Monitoring health data unavailable — check-in harian tetap berfungsi."
          : native === true
            ? "Menghubungkan akan meminta izin Health Connect, notifikasi, dan menjadwalkan sinkronisasi background tiap 6 jam."
            : "Kamu membuka Relivia di browser: sinkronisasi berjalan saat halaman /health dibuka atau lewat tombol simulasi. Di APK Android, sinkronisasi berjalan otomatis di background via Health Connect."}
      </p>

      {message && (
        <div
          className={`text-sm rounded-xl px-4 py-3 mt-3 ${
            message.startsWith("✅")
              ? "bg-green-tint text-green-deep"
              : "bg-amber-tint text-amber-deep"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
