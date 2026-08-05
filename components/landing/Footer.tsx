import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-[1160px] mx-auto px-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-2 font-bold text-[16.5px]">
            <span className="relative w-[26px] h-[26px] rounded-[9px] bg-gradient-to-br from-primary to-primary-deep">
              <span className="absolute inset-[7px] rounded-[5px] bg-white/85" />
            </span>
            Relivia
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 md:gap-[26px]">
            <a href="#features" className="text-[13.5px] text-soft hover:text-ink">Fitur</a>
            <a href="#how" className="text-[13.5px] text-soft hover:text-ink">Cara Kerja</a>
            <a href="#faq" className="text-[13.5px] text-soft hover:text-ink">FAQ</a>
            <Link href="/privacy" className="text-[13.5px] text-soft hover:text-ink">Kebijakan Privasi</Link>
            <Link href="/terms" className="text-[13.5px] text-soft hover:text-ink">Syarat & Ketentuan</Link>
            <Link href="/contact" className="text-[13.5px] text-soft hover:text-ink">Kontak</Link>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-[12.5px] text-soft/70">
          © 2026 Relivia. Bukan alat diagnosis. Selalu konsultasikan dengan profesional kesehatan jiwa berlisensi.
        </div>
      </div>
    </footer>
  );
}
