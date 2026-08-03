"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sharePost } from "@/app/community/actions";

export default function ShareStoryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!text.trim()) {
      setError("Tulis dulu ceritanya ya");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await sharePost(text);
      setText("");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "Gagal membagikan cerita, coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        Bagikan Cerita
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[110] p-5" onClick={() => setOpen(false)}>
      <div className="card w-full max-w-[480px] p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-extrabold mb-1.5">Bagikan pengalamanmu</h3>
        <p className="text-xs text-soft mb-4 leading-relaxed">
          Cerita ini bisa dilihat caregiver lain di Komunitas. Jangan sertakan info identitas pasien secara detail ya.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ceritakan momen atau cara yang membantu kamu sebagai caregiver…"
          className="w-full min-h-[120px] rounded-2xl border-2 border-border p-3.5 text-sm focus:outline-none focus:border-primary"
          maxLength={2000}
        />
        {error && <p className="text-sm text-red-deep bg-red-tint rounded-lg px-3 py-2 mt-2">{error}</p>}
        <div className="flex justify-end gap-2.5 mt-3.5">
          <button onClick={() => setOpen(false)} className="text-sm font-bold text-soft hover:text-ink px-3 py-2.5">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? "Mengirim…" : "Bagikan"}
          </button>
        </div>
      </div>
    </div>
  );
}
