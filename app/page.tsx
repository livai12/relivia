import Link from "next/link";
import { IconCheck } from "@/components/Icons";
import Logo from "@/components/Logo";
import { fetchCaregiverNews } from "@/lib/news";

export const revalidate = 3600;

export default async function LandingPage() {
  const news = await fetchCaregiverNews(3);

  return (
    <main className="min-h-screen bg-bg bg-[radial-gradient(700px_500px_at_88%_8%,#DCE9FF,transparent_60%)]">
      <div className="px-[6vw] min-h-[92vh] flex items-center">
        <div className="grid md:grid-cols-2 gap-14 items-center max-w-[1180px] mx-auto w-full py-16">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <Logo size={34} />
              <span className="font-extrabold text-lg">Relivia</span>
            </div>

            <div className="inline-flex items-center gap-2 bg-white border border-border rounded-full pl-2 pr-3.5 py-1.5 text-xs font-semibold text-soft mb-6 shadow-card">
              <span className="w-5 h-5 rounded-full bg-green-tint text-green flex items-center justify-center">
                <IconCheck size={11} />
              </span>
              Dipakai bareng dr. Yudha, Sp.KJ
            </div>

            <h1 className="text-[clamp(32px,4.2vw,50px)] leading-[1.12] font-extrabold tracking-tight mb-4">
              Catat hal kecil hari ini,<br />biar <span className="text-primary">psikiater</span> lihat<br />gambaran utuhnya.
            </h1>
            <p className="text-[16.5px] leading-relaxed text-soft max-w-[460px] mb-8">
              Relivia bantu kamu sebagai caregiver mencatat mood, tidur, dan obat dalam 2 menit sehari —
              lalu menyusunnya jadi rangkuman yang gampang dibawa ke ruang periksa.
            </p>
            <div className="flex items-center gap-4 mb-6">
              <Link href="/dashboard" className="btn-primary">
                Mulai pantau
              </Link>
              <Link href="/login" className="font-semibold text-ink hover:text-primary px-1.5 py-3.5">
                Sudah punya akun? Masuk
              </Link>
            </div>
            <div className="flex items-center gap-3.5 flex-wrap">
              <Link href="/login?provider=google" className="inline-flex items-center gap-2.5 bg-white border-[1.5px] border-border rounded-full px-5 py-2.5 text-sm font-bold shadow-card hover:border-primary-tint hover:-translate-y-px transition">
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.3-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 6.5 29.5 4.5 24 4.5c-8 0-14.9 4.6-18.3 11.3z"/><path fill="#4CAF50" d="M24 44.5c5.4 0 10.3-2 13.9-5.3l-6.4-5.4C29.5 35.5 26.9 36.5 24 36.5c-5.3 0-9.7-3.1-11.4-7.5l-6.6 5.1C9.1 39.9 16 44.5 24 44.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.5-2.5 4.6-4.6 6l6.4 5.4C40.7 36.8 44.5 31 44.5 24c0-1.2-.1-2.4-.3-3.5z"/></svg>
                Daftar dengan Google
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-[28px] shadow-pop p-4 overflow-hidden">
            {/* Real photo asset — drop /public/images/hero-caregiver.jpg (see public/images/README.md) */}
            <img
              src="/images/hero-caregiver.jpg"
              alt="Caregiver mendampingi pasien lansia di lorong rumah sakit"
              className="w-full h-[380px] object-cover rounded-[20px] bg-primary-light"
            />
          </div>
        </div>
      </div>

      {/* Live news — scraped server-side from Google News RSS for "caregiver",
          each card enriched with a real og:image pulled from the article page. */}
      <div className="bg-[#14203A] px-[6vw] py-14">
        <div className="max-w-[1180px] mx-auto">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
            <h3 className="text-white font-extrabold text-lg">Berita Caregiver Dunia</h3>
            <span className="text-[#9FB6AB] text-xs">Live dari Google News, diperbarui tiap jam</span>
          </div>

          {news.length === 0 ? (
            <p className="text-[#B7CBC2] text-sm">
              Berita belum bisa dimuat saat ini — coba refresh halaman sebentar lagi.
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:-translate-y-0.5 transition block"
                >
                  <div className="h-32 bg-white/10">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#6B7690] text-xs">Tanpa gambar</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#CFE3D8] mb-2">{item.source || "Google News"}</div>
                    <h4 className="text-white text-sm font-bold leading-snug mb-2 line-clamp-3">{item.title}</h4>
                    <div className="text-[11px] text-[#7C9689]">{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : ""}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
