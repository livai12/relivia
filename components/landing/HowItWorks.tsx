import Reveal from "@/components/landing/Reveal";
import SectionHead from "@/components/landing/SectionHead";

const STEPS = [
  { n: 1, title: "Catat Harian", desc: "Caregiver mencatat mood, tidur, dan nafsu makan kurang dari dua menit." },
  { n: 2, title: "Pantau Obat", desc: "Tiap dosis dicatat untuk melacak tingkat kepatuhan minum obat." },
  { n: 3, title: "Analisis Tren", desc: "Sistem memproses riwayat catatan secara berkala di latar belakang." },
  { n: 4, title: "Rangkuman AI", desc: "Hasil analisis berupa rangkuman perkembangan kondisi siap dibaca." },
  { n: 5, title: "Konsultasi", desc: "Serahkan rangkuman cetak tersebut langsung ke psikiater Anda." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 md:py-32 scroll-mt-24">
      <div className="max-w-[1160px] mx-auto px-5 md:px-8">
        <Reveal>
          <SectionHead eyebrow="Cara Kerja" title="Dari pengamatan 2 menit harian ke konsultasi yang terarah" />
        </Reveal>
        <div className="relative grid md:grid-cols-5 gap-6 md:gap-0">
          <div className="hidden md:block absolute top-[21px] left-[10%] right-[10%] h-px bg-[repeating-linear-gradient(to_right,theme(colors.border)_0_6px,transparent_6px_12px)]" />
          {STEPS.map((s) => (
            <Reveal key={s.n}>
              <div className="relative z-10 flex flex-col items-center text-center px-2.5 group">
                <div className="w-[42px] h-[42px] rounded-full bg-white border-[1.5px] border-border flex items-center justify-center font-mono text-[13px] text-primary-deep mb-4 transition-all group-hover:border-primary group-hover:shadow-[0_0_0_5px_rgba(139,92,246,0.1)]">
                  {s.n}
                </div>
                <h4 className="text-[14.5px] font-bold text-ink">{s.title}</h4>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-soft">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
