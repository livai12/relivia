import Link from "next/link";
import Reveal from "@/components/landing/Reveal";

export default function FinalCTA() {
  return (
    <section className="pt-20 md:pt-24 pb-24 md:pb-32 text-center">
      <div className="max-w-[1160px] mx-auto px-5 md:px-8">
        <Reveal>
          <h2 className="mt-3 text-[clamp(28px,4vw,42px)] font-extrabold tracking-tight text-ink max-w-[620px] mx-auto">
            Mulai pantau perkembangan kesehatan jiwa dengan lebih baik hari ini
          </h2>
        </Reveal>
        <Reveal>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center mt-7 rounded-full bg-primary text-white font-semibold text-[15.5px] px-7 py-4 shadow-[0_8px_24px_-6px_rgba(139,92,246,0.55)] hover:-translate-y-px hover:bg-primary-deep transition-all"
          >
            Mulai Sekarang
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
