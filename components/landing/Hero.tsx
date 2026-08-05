import Link from "next/link";
import Reveal from "@/components/landing/Reveal";

const badges = [
  { label: "AI Supported" },
  { label: "Privacy First" },
];

export default function Hero() {
  return (
    <header className="pt-32 md:pt-[168px] pb-20 md:pb-24 bg-bg bg-[radial-gradient(60%_50%_at_82%_8%,rgba(139,92,246,0.10),transparent_70%)]">
      <div className="max-w-[1160px] mx-auto px-5 md:px-8 grid md:grid-cols-2 gap-10 md:gap-14 items-center">
        <div>
          <h1 className="text-[clamp(30px,4.2vw,50px)] leading-[1.12] font-extrabold tracking-tight mb-4 mt-3">
            Catat hal kecil hari ini,<br />biar <span className="text-primary">psikiater</span> lihat<br />gambaran utuhnya.
          </h1>
          <p className="text-[16.5px] leading-relaxed text-soft max-w-[460px] mb-8">
            Relivia bantu kamu sebagai caregiver mencatat mood, tidur, dan obat dalam 2 menit sehari —
            lalu menyusunnya jadi rangkuman yang gampang dibawa ke ruang periksa.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-primary text-white font-semibold text-[15.5px] px-7 py-4 shadow-[0_8px_24px_-6px_rgba(139,92,246,0.55)] hover:-translate-y-px hover:bg-primary-deep hover:shadow-[0_12px_28px_-6px_rgba(139,92,246,0.65)] transition-all"
            >
              Mulai Sekarang
            </Link>
            <a
              href="#how"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border-[1.5px] border-border text-ink font-semibold text-[15.5px] px-7 py-4 hover:border-primary hover:text-primary-deep transition-colors"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-5">
            {badges.map((b) => (
              <span key={b.label} className="flex items-center gap-2 text-[13.5px] font-medium text-soft">
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        <Reveal className="!opacity-100 !translate-y-0">
          <DashboardMock />
        </Reveal>
      </div>
    </header>
  );
}

function DashboardMock() {
  return (
    <div className="relative bg-white border border-border rounded-[28px] shadow-card p-5 animate-float">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-accent to-primary" />
          <div>
            <strong className="block text-[13.5px]">Catatan Bu Sari</strong>
            <span className="text-xs text-soft/70">Hari ke-24 observasi</span>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-green bg-green-tint px-2.5 py-1.5 rounded-full">Terpantau baik</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary-light rounded-xl px-4 py-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-primary-deep/80">Mood</div>
          <div className="text-xl font-bold font-mono mt-1.5">Stabil</div>
          <div className="text-[11.5px] text-soft mt-0.5">3 hari berturut-turut</div>
        </div>
        <div className="bg-primary-light rounded-xl px-4 py-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-primary-deep/80">Rata-rata tidur</div>
          <div className="text-xl font-bold font-mono mt-1.5">6.4 jam</div>
          <div className="flex items-end gap-1 h-8 mt-2">
            {[40, 65, 50, 80, 55, 70, 60].map((h, i) => (
              <span key={i} className="flex-1 bg-primary/75 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-primary-light rounded-xl px-4 py-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-primary-deep/80">Konsumsi Obat</div>
          <div className="text-xl font-bold font-mono mt-1.5">6/7</div>
          <div className="text-[11.5px] text-soft mt-0.5">1 dosis terlewat Sel</div>
        </div>
        <div className="bg-primary-light rounded-xl px-4 py-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-primary-deep/80">Interaksi Sosial</div>
          <div className="text-xl font-bold font-mono mt-1.5">Rendah</div>
          <div className="text-[11.5px] text-soft mt-0.5">↓ dari minggu lalu</div>
        </div>

        <div className="col-span-2 bg-gradient-to-br from-[#FBF9FF] to-[#F3EEFF] border border-primary/20 rounded-xl px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-deep">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
            </svg>
            Rangkuman Klinis
          </div>
          <p className="text-[12.5px] leading-relaxed text-ink mt-2">
            Interaksi sosial menurun dan satu dosis terlewat minggu ini — perlu dibahas saat konsultasi berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
