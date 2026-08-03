"use client";

import { useState, useMemo } from "react";
import type { DailyCheckin, AiInsight } from "@/lib/types";

const PERIODS = [
  { days: 7, label: "1 minggu" },
  { days: 21, label: "3 minggu" },
  { days: 30, label: "1 bulan" },
];

export default function SummaryClient({
  checkins,
  insight,
  patientName,
}: {
  checkins: DailyCheckin[];
  insight: AiInsight | null;
  patientName: string;
}) {
  const [periodDays, setPeriodDays] = useState(7);

  const slice = useMemo(() => {
    return checkins.slice(-Math.min(periodDays, checkins.length));
  }, [checkins, periodDays]);

  const adherence = slice.length
    ? Math.round((slice.filter((c) => c.medication_taken).length / slice.length) * 100)
    : 0;

  const periodLabel = PERIODS.find((p) => p.days === periodDays)?.label ?? "";
  const rangeLabel = slice.length ? `${slice[0].checkin_date} – ${slice[slice.length - 1].checkin_date}` : "-";
  const riskLabel = insight?.risk_category === "high" ? "Tinggi" : insight?.risk_category === "medium" ? "Sedang" : insight ? "Rendah" : "-";

  async function handleDownloadPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 48;
    let y = 60;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Ringkasan Konsultasi", marginX, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("RELIVIA - CATATAN CAREGIVER TERSTRUKTUR", marginX, y);
    doc.setTextColor(0);
    y += 30;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Pasien: ${patientName}`, marginX, y); y += 16;
    doc.text(`Periode: ${rangeLabel} (${periodLabel})`, marginX, y); y += 16;
    doc.text(`Kepatuhan obat periode ini: ${adherence}%`, marginX, y); y += 16;
    doc.text(`Kategori perhatian: ${riskLabel}`, marginX, y); y += 28;

    function section(title: string, body: string) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(title, marginX, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      const lines = doc.splitTextToSize(body, 500);
      doc.text(lines, marginX, y);
      y += lines.length * 14 + 18;
    }

    section(
      "Faktor yang teramati",
      insight?.contributing_factors?.length
        ? insight.contributing_factors.map((f, i) => `${i + 1}. ${f}`).join("\n")
        : "Belum ada insight yang dibuat untuk periode ini."
    );
    section(
      "Ringkasan klinis",
      insight?.summary_text ?? "-"
    );

    doc.setFontSize(8.5);
    doc.setTextColor(140);
    doc.text(
      "Disusun otomatis oleh Relivia. Bukan alat diagnosis - dokumen ini bahan diskusi, keputusan klinis sepenuhnya di tangan psikiater.",
      marginX,
      780,
      { maxWidth: 500 }
    );

    doc.save(`ringkasan-konsultasi-${patientName.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5 flex-wrap">
        <div className="flex gap-1 bg-bg border border-border rounded-full p-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setPeriodDays(p.days)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition ${
                periodDays === p.days ? "bg-primary text-white" : "text-soft hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button onClick={handleDownloadPdf} className="btn-primary text-sm" style={{ background: "#1B7A5C" }}>
          Unduh PDF
        </button>
      </div>

      <div className="card max-w-[720px] p-10">
        <div className="flex justify-between items-start pb-5 mb-6 border-b border-border">
          <div>
            <h3 className="text-xl font-extrabold mb-1">Ringkasan Konsultasi</h3>
            <div className="text-[11px] font-bold uppercase tracking-wide text-faint">Relivia · Catatan Caregiver Terstruktur</div>
          </div>
          <div className="text-right text-xs text-soft leading-relaxed">
            Periode: {rangeLabel} ({periodLabel})<br />
            Dicetak: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 mb-6">
          <div className="bg-bg rounded-xl px-4 py-3">
            <div className="text-xs text-soft font-medium">Pasien</div>
            <div className="text-base font-extrabold">{patientName}</div>
          </div>
          <div className="bg-bg rounded-xl px-4 py-3">
            <div className="text-xs text-soft font-medium">Kepatuhan obat periode ini</div>
            <div className="text-base font-extrabold">{adherence}%</div>
          </div>
          <div className="bg-bg rounded-xl px-4 py-3 col-span-2">
            <div className="text-xs text-soft font-medium">Kategori perhatian</div>
            <div className="text-base font-extrabold text-amber-deep">
              {insight ? riskLabel : "Belum ada insight — buat dulu di halaman Insight Klinis"}
            </div>
          </div>
        </div>

        {insight ? (
          <>
            <div className="mb-5">
              <h4 className="text-[11px] uppercase tracking-wide text-primary font-extrabold mb-2">Ringkasan klinis</h4>
              <p className="text-sm leading-relaxed">{insight.summary_text}</p>
            </div>
            <div className="mb-5">
              <h4 className="text-[11px] uppercase tracking-wide text-primary font-extrabold mb-2">Faktor yang teramati</h4>
              <p className="text-sm leading-relaxed">{insight.contributing_factors.join(" ")}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-soft">Belum ada insight yang dibuat untuk periode ini.</p>
        )}

        <div className="mt-6 pt-4 border-t border-dashed border-border text-[11px] text-faint leading-relaxed">
          Disusun otomatis oleh Relivia dari catatan caregiver periode terpilih. Bukan alat diagnosis — dokumen ini
          bahan diskusi, keputusan klinis sepenuhnya di tangan psikiater.
        </div>
      </div>
    </div>
  );
}
