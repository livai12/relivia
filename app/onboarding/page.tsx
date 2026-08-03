"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import { completeOnboarding } from "./actions";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [caregiverName, setCaregiverName] = useState("");
  const [city, setCity] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function goStep1() {
    if (!caregiverName.trim() || !city.trim()) {
      setError("Nama kamu dan kota wajib diisi ya");
      return;
    }
    setError(null);
    setStep(1);
  }

  async function handleSubmit() {
    if (!patientName.trim() || !patientAge) {
      setError("Nama dan umur pasien wajib diisi ya");
      return;
    }
    const age = parseInt(patientAge, 10);
    if (isNaN(age) || age < 1 || age > 120) {
      setError("Umur pasien belum valid");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await completeOnboarding({ caregiverName, city, patientName, patientAge: age });
    } catch (e: any) {
      setError(e.message ?? "Gagal menyimpan, coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6 py-10">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-2.5 mb-7">
          <Logo size={30} />
          <span className="font-extrabold text-lg">Relivia</span>
        </div>

        <div className="flex gap-1.5 mb-7">
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 0 ? "bg-primary" : "bg-border"}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-border"}`} />
        </div>

        {step === 0 && (
          <div className="animate-[rise_0.3s_ease]">
            <div className="text-xs font-bold text-primary mb-2">LANGKAH 1 DARI 2</div>
            <h1 className="text-xl font-extrabold mb-1.5">Kenalan dulu yuk</h1>
            <p className="text-sm text-soft mb-6">Data ini muncul di Komunitas kalau kamu berbagi cerita nanti.</p>

            <label className="block text-xs font-bold text-soft mb-1.5">Nama kamu (caregiver)</label>
            <input
              value={caregiverName}
              onChange={(e) => setCaregiverName(e.target.value)}
              placeholder="Contoh: Ratna"
              className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-primary"
            />

            <label className="block text-xs font-bold text-soft mb-1.5">Kota domisili</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Contoh: Surabaya"
              className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm mb-2 focus:outline-none focus:border-primary"
            />

            {error && <p className="text-sm text-red-deep bg-red-tint rounded-lg px-3 py-2 mt-3">{error}</p>}

            <button onClick={goStep1} className="btn-primary w-full justify-center mt-5">
              Lanjut
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-[rise_0.3s_ease]">
            <div className="text-xs font-bold text-primary mb-2">LANGKAH 2 DARI 2</div>
            <h1 className="text-xl font-extrabold mb-1.5">Sekarang tentang pasien</h1>
            <p className="text-sm text-soft mb-6">Relivia saat ini memantau satu pasien per akun caregiver.</p>

            <label className="block text-xs font-bold text-soft mb-1.5">Nama pasien</label>
            <input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Contoh: Dimas"
              className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-primary"
            />

            <label className="block text-xs font-bold text-soft mb-1.5">Umur pasien</label>
            <input
              type="number"
              min={1}
              max={120}
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              placeholder="Contoh: 25"
              className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm mb-2 focus:outline-none focus:border-primary"
            />

            {error && <p className="text-sm text-red-deep bg-red-tint rounded-lg px-3 py-2 mt-3">{error}</p>}

            <div className="flex items-center gap-3 mt-5">
              <button onClick={() => setStep(0)} className="text-sm font-bold text-soft hover:text-ink px-2">
                Kembali
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 justify-center disabled:opacity-60">
                {submitting ? "Menyimpan…" : "Mulai pantau"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
