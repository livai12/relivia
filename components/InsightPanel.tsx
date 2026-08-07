"use client";

import { useState } from "react";
import type { AiInsight } from "@/lib/types";
import { IconPill, IconMoon, IconUsers, IconEdit, IconSparkle, IconAlertTriangle } from "@/components/Icons";

const FACTOR_ICONS = [IconPill, IconMoon, IconUsers, IconEdit, IconPill];

export default function InsightPanel({ patientName, latest }: { patientName: string; latest: AiInsight | null }) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<AiInsight | null>(latest);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insight", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Terjadi kesalahan.");
        return;
      }
      setInsight(json.insight);
    } catch (e) {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  const badgeLabel =
    insight?.risk_category === "high" ? "Perlu Perhatian (Tinggi)"
    : insight?.risk_category === "medium" ? "Perlu Perhatian (Sedang)"
    : "Stabil";

  return (
    <>
      <div className="rounded-3xl p-6 md:p-9 mb-6 text-white flex items-center justify-between gap-5 flex-wrap bg-gradient-to-br from-primary to-[#4E7FF0]">
        <div>
          <h3 className="text-xl font-extrabold mb-2">Siap dianalisis</h3>
          <p className="text-sm text-primary-tint max-w-[420px] leading-relaxed">
            Relivia merangkum pola dari catatan harian {patientName} — bukan diagnosis, bukan prediksi.
            Hanya pola yang layak dibicarakan bareng psikiater.
          </p>
        </div>
        <button onClick={generate} disabled={loading} className="w-full sm:w-auto justify-center bg-white text-primary-dark font-bold rounded-full px-6 py-3.5 hover:bg-[#F2F6FF] disabled:opacity-70 inline-flex items-center gap-2">
          {loading ? "Menganalisis…" : (
            <>
              {insight ? "Buat ulang Insight" : "Buat Insight"} <IconSparkle size={15} />
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 mb-5 bg-primary-light rounded-2xl px-5 py-4">
          <div className="w-[18px] h-[18px] border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-primary-dark">Meracik insight dari 14 hari catatan…</span>
        </div>
      )}

      {error && <div className="text-sm text-red-deep bg-red-tint rounded-xl px-4 py-3 mb-5">{error}</div>}

      {insight && !loading && (
        <div>
          <span className="inline-flex items-center gap-2 px-[18px] py-2.5 rounded-full font-extrabold text-sm mb-5 bg-amber-tint text-amber-deep">
            <IconAlertTriangle size={14} /> Kategori: {badgeLabel}
          </span>
          <div className="grid sm:grid-cols-2 gap-3.5 mb-5">
            {insight.contributing_factors.map((f, i) => {
              const Icon = FACTOR_ICONS[i % FACTOR_ICONS.length];
              return (
                <div key={i} className="card px-[18px] py-4 text-sm leading-relaxed flex gap-3">
                  <div className="w-[30px] h-[30px] rounded-lg bg-red-tint text-red-deep flex items-center justify-center flex-none">
                    <Icon size={16} />
                  </div>
                  <div>{f}</div>
                </div>
              );
            })}
          </div>
          <div className="bg-primary-light rounded-2xl px-[22px] py-5 text-sm leading-relaxed mb-4">
            <b className="text-primary-dark">Ringkasan untuk psikiater: </b>
            {insight.summary_text}
          </div>
          <div className="text-xs text-soft bg-bg rounded-xl px-4 py-3.5 leading-relaxed">
            Relivia menyusun ulang pengamatan caregiver menjadi rangkuman terstruktur. Ini bukan diagnosis
            maupun prediksi relaps — keputusan klinis tetap sepenuhnya di tangan psikiater yang menangani.
          </div>
        </div>
      )}
    </>
  );
}
