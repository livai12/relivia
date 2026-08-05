import Reveal from "@/components/landing/Reveal";
import SectionHead from "@/components/landing/SectionHead";

const FEATURES = [
  {
    title: "Observasi Harian",
    desc: "Pencatatan cepat dalam 2 menit untuk mood, tidur, nafsu makan, dan interaksi sosial — praktis untuk rutinitas harian.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Pemantauan Obat",
    desc: "Catat dosis obat yang diminum atau terlewat dan pantau kepatuhan konsumsi obat dari minggu ke minggu.",
    icon: "M9 3h6l1 4H8l1-4zM7 7h10l1 13a1 1 0 01-1 1H7a1 1 0 01-1-1L7 7z",
  },
  {
    title: "AI Rangkuman Klinis",
    desc: "AI menganalisis riwayat catatan harian dan merangkum perubahan penting dalam bahasa sederhana — bukan diagnosis medis.",
    icon: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  },
  {
    title: "Ringkasan Konsultasi",
    desc: "Laporan ringkas 1 halaman yang siap cetak untuk diserahkan langsung ke psikiater saat sesi konsultasi tiba.",
    icon: "M9 12h6m-6 4h6M7 3h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z",
  },
  {
    title: "Tren Perilaku",
    desc: "Grafik visual untuk mood, tidur, dan pola interaksi membantu mendeteksi perubahan sebelum mencapai fase kritis.",
    icon: "M3 17l6-6 4 4 8-8M21 7v6",
  },
  {
    title: "Autentikasi Google Aman",
    desc: "Masuk aman sekali ketuk lewat Google. Data pasien terenkripsi dan bersifat privat hanya untuk akun Anda.",
    icon: "M12 15a3 3 0 003-3V7a3 3 0 10-6 0v5a3 3 0 003 3zm5-3a5 5 0 01-10 0M12 19v3",
  },
];

export default function Features() {
  return (
    <section id="features" className="pt-24 md:pt-28 pb-10 scroll-mt-24">
      <div className="max-w-[1160px] mx-auto px-5 md:px-8">
        <Reveal>
          <SectionHead
            eyebrow="Fitur Utama"
            title="Semua yang dibutuhkan caregiver, tanpa kerumitan"
            desc="Enam alat yang dirancang khusus untuk mengubah pengamatan sehari-hari menjadi informasi berharga yang dapat dipahami psikiater."
          />
        </Reveal>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <Reveal key={f.title}>
              <div className="h-full bg-white border border-border rounded-[20px] p-6 md:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-card hover:border-primary/25">
                <div className="w-[42px] h-[42px] rounded-xl bg-primary-light flex items-center justify-center mb-[18px]">
                  <svg className="w-5 h-5 text-primary-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-[17px] font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-soft">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
