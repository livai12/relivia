import Reveal from "@/components/landing/Reveal";

const CHIPS = [
  { k: "MOOD", v: "Cenderung Cemas, 4×" },
  { k: "TIDUR", v: "Rata-rata 5,1 jam" },
  { k: "INTERAKSI", v: "Menarik Diri" },
  { k: "NAFSU MAKAN", v: "Menurun" },
  { k: "OBAT", v: "Terlewat 2×" },
  { k: "AKTIVITAS", v: "Rendah di sebagian besar hari" },
];

export default function InsightSection() {
  return (
    <section id="insight" className="relative mx-4 md:mx-5 my-0 py-20 md:py-28 rounded-[24px] md:rounded-[40px] bg-ink text-white overflow-hidden scroll-mt-24">
      <div className="pointer-events-none absolute -top-[30%] -right-[10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.35),transparent_65%)]" />
      <div className="relative max-w-[1160px] mx-auto px-5 md:px-8">
        <Reveal>
          <div className="max-w-[640px] mx-auto text-center mb-10 md:mb-14">
            <h2 className="mt-3.5 text-[clamp(28px,3.6vw,40px)] font-bold tracking-tight text-white">
              Tiga puluh hari catatan. Satu rangkuman penting untuk dibawa saat konsultasi.
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-white/60">
              Caregiver tidak butuh tumpukan data untuk di-scroll — mereka butuh poin-poin penting yang benar-benar berubah.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-[1fr_90px_1fr] gap-2 items-center max-w-[980px] mx-auto">
          <Reveal>
            <span className="block text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4">
              30 Hari Catatan Mentah
            </span>
            <div className="flex flex-col gap-2.5">
              {CHIPS.map((c, i) => (
                <div
                  key={c.k}
                  className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] animate-drift"
                  style={{ animationDelay: `${i * 0.35}s` }}
                >
                  <span className="font-mono text-[11.5px] text-white/55">{c.k}</span>
                  <span className="font-semibold">{c.v}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="flex items-center justify-center h-full rotate-90 md:rotate-0 my-1.5 md:my-0">
            <svg className="w-[70px] h-[140px] opacity-50" viewBox="0 0 70 140" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M5 5 L65 5 L40 65 L40 130 M30 130 L40 130 L40 65 L65 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Reveal>

          <Reveal>
            <span className="block text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4">
              Satu Rangkuman Klinis AI
            </span>
            <div className="bg-gradient-to-br from-primary/15 to-white/[0.03] border border-primary/40 rounded-2xl p-6">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent mb-3.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
                </svg>
                Dihasilkan oleh AI
              </span>
              <p className="text-[15px] leading-relaxed text-white/90">
                Selama seminggu terakhir, terpantau adanya penurunan durasi tidur dan berkurangnya interaksi sosial.
                Perubahan perilaku ini berbeda dari periode observasi sebelumnya dan dapat menjadi bahan diskusi penting untuk
                konsultasi psikiatri berikutnya.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <p className="text-center mt-11 text-[13px] text-white/45 max-w-[520px] mx-auto">
            Relivia tidak pernah mendiagnosis pasien dan tidak menggantikan peran psikiater.
            Seluruh keputusan klinis tetap sepenuhnya berada di tangan profesional kesehatan jiwa berlisensi.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
