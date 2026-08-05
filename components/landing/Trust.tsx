import Reveal from "@/components/landing/Reveal";
import SectionHead from "@/components/landing/SectionHead";

const TRUST = [
  {
    title: "Berdasarkan Data Riil",
    desc: "Dirancang berfokus pada pemantauan perilaku terstruktur, bukan sekadar tebakan atau penilaian umum.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Privasi Utuh",
    desc: "Seluruh data pasien aman dan tersimpan privat di bawah akun Anda, tidak pernah dibagikan tanpa izin.",
    icon: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z",
  },
  {
    title: "Mendukung Komunikasi Klinis",
    desc: "Membantu Anda menyampaikan info yang lebih akurat ke psikiater, bukan untuk mendiagnosis sendiri.",
    icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8",
  },
];

export default function Trust() {
  return (
    <section id="trust" className="pt-14 md:pt-[70px] pb-20 md:pb-32 scroll-mt-24">
      <div className="max-w-[1160px] mx-auto px-5 md:px-8">
        <Reveal>
          <SectionHead eyebrow="Komitmen Relivia" title="Dirancang untuk mendukung pendampingan, bukan menggantikannya" />
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {TRUST.map((t) => (
            <Reveal key={t.title}>
              <div className="text-center px-[26px] py-9 rounded-[20px] bg-primary-light h-full">
                <div className="w-[46px] h-[46px] rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-[0_4px_12px_rgba(139,92,246,0.15)]">
                  <svg className="w-[22px] h-[22px] text-primary-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                  </svg>
                </div>
                <h4 className="text-[16px] font-bold text-ink">{t.title}</h4>
                <p className="mt-2 text-[13.5px] leading-relaxed text-soft">{t.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
