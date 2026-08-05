"use client";

import { useState } from "react";
import Reveal from "@/components/landing/Reveal";
import SectionHead from "@/components/landing/SectionHead";

const FAQS = [
  {
    q: "Apa itu Relivia?",
    a: "Relivia adalah platform web yang membantu caregiver dari orang dengan skizofrenia untuk mencatat observasi harian, memantau konsumsi obat, dan menghasilkan rangkuman berbasis AI untuk dibawa saat konsultasi ke psikiater.",
  },
  {
    q: "Apakah Relivia bisa mendiagnosis skizofrenia?",
    a: "Tidak. Relivia tidak pernah mendiagnosis, memprediksi kekambuhan, ataupun merekomendasikan resep obat. Platform ini hanya merangkum catatan harian untuk mempermudah diskusi Anda dengan psikiater profesional.",
  },
  {
    q: "Untuk siapa Relivia dirancang?",
    a: "Bagi caregiver keluarga — seperti orang tua, pasangan, saudara, atau kerabat dekat — yang mendampingi dan merawat orang dengan skizofrenia sehari-hari.",
  },
  {
    q: "Apakah data saya aman?",
    a: "Sangat aman. Autentikasi menggunakan akun Google resmi dan seluruh data observasi dilindungi dengan sistem kontrol akses tingkat baris (Row-Level Security) yang ketat.",
  },
  {
    q: "Apakah AI ini bisa menggantikan peran dokter/psikiater?",
    a: "Tidak. Relivia dirancang untuk melengkapi dan memperkuat komunikasi klinis antara caregiver dan psikiater, bukan menggantikannya. Keputusan medis sepenuhnya tetap berada di tangan profesional kesehatan jiwa.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="pt-10 pb-20 md:pb-32 scroll-mt-24">
      <div className="max-w-[1160px] mx-auto px-5 md:px-8">
        <Reveal>
          <SectionHead eyebrow="FAQ" title="Pertanyaan yang sering diajukan" />
        </Reveal>
        <div className="max-w-[720px] mx-auto flex flex-col gap-2.5">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q}>
                <div className={`bg-white border rounded-2xl px-6 transition-colors ${isOpen ? "border-primary/30" : "border-border"}`}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-[18px] text-left font-semibold text-[15.5px] text-ink"
                    aria-expanded={isOpen}
                  >
                    {item.q}
                    <svg
                      className={`w-[22px] h-[22px] shrink-0 text-primary-deep transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="pb-5 text-[14.5px] leading-relaxed text-soft max-w-[600px]">{item.a}</div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
