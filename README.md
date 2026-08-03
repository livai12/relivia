# Relivia

Caregiver daily check-ins → structured clinical signal for psikiater. Next.js App Router
+ Supabase (auth + Postgres) + Anthropic API, deployable straight to Vercel.

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** → jalankan seluruh isi file `supabase/schema.sql` (termasuk bagian
   `profiles`, `community_posts`, trigger verifikasi otomatis, dan fungsi `increment_helpful`).
3. Buka **Project Settings → API** → salin `Project URL` dan `anon public key`.
4. Buka **Authentication → Providers** → pastikan **Email** provider aktif (default sudah aktif).
   Untuk demo, matikan "Confirm email" di **Authentication → Settings** biar signup langsung bisa login.

## 2. Setup Google OAuth (untuk tombol "Lanjut dengan Google")

Ini butuh setup manual di dua tempat karena melibatkan kredensial pihak ketiga:

1. Di [Google Cloud Console](https://console.cloud.google.com), buat OAuth Client ID
   (tipe **Web application**). Authorized redirect URI diisi:
   `https://<project-ref>.supabase.co/auth/v1/callback`
2. Di Supabase dashboard → **Authentication → Providers → Google**, aktifkan dan isi
   Client ID + Client Secret dari langkah di atas.
3. Tambahkan URL aplikasi kamu (mis. `http://localhost:3000` dan domain Vercel kamu)
   ke **Authentication → URL Configuration → Redirect URLs**.

Tanpa langkah ini, tombol Google akan gagal dengan pesan error dari Supabase — bukan bug
di kode, tapi memang belum dikonfigurasi.

## 3. Setup environment variables

```bash
cp .env.example .env.local
```

Isi tiga variabel di `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` — dari Supabase.
- `ANTHROPIC_API_KEY` — dari [console.anthropic.com](https://console.anthropic.com).

## 4. Tambahkan foto

Lihat `public/images/README.md` — drop `hero-caregiver.jpg` dan `consult-warm.jpg` di sana
(foto berlisensi bebas, bukan hasil AI generate).

## 5. Jalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## 6. Deploy ke Vercel

```bash
npx vercel
```

Atau lewat dashboard: **Import Project** dari GitHub repo ini, lalu di **Environment Variables**
masukkan tiga variabel yang sama seperti `.env.local`. Deploy — selesai.

## Struktur

```
app/
  page.tsx              Landing — fetch berita caregiver dunia secara live (server-side)
  login/                 Login, signup, dan tombol Google OAuth
  auth/callback/          Route handler yang menukar OAuth code jadi session
  dashboard/              Grafik pemantauan, kalender pencatatan, log harian (data asli)
  checkin/                Wizard catatan harian (5 langkah)
  insight/                Tombol "Buat Insight" -> panggil Anthropic API -> simpan ke DB
  summary/                Selector periode (1/3 minggu, 1 bulan) + unduh PDF asli (jsPDF)
  community/              Feed lintas-user asli: baca semua post, tulis post sendiri, vote "membantu"
  api/insight/route.ts    Endpoint server-side yang memanggil Anthropic Messages API
lib/
  news.ts                 Scraper: ambil RSS Google News utk keyword "caregiver" + og:image tiap artikel
  getOrCreatePatient.ts    Auto-provision profil pasien (MVP: 1 caregiver = 1 pasien)
  getOrCreateProfile.ts    Auto-provision profil publik caregiver (untuk fitur Komunitas)
supabase/schema.sql        Skema tabel + RLS + trigger verifikasi otomatis + fungsi increment_helpful
components/                Nav, wizard, chart, kalender, SOS button, community feed, dst (client components)
```

## Cara kerja fitur-fitur baru

**Berita Caregiver Dunia** (`lib/news.ts`) — server-side fetch ke RSS publik Google News
(`news.google.com/rss/search?q=caregiver`), bukan API berbayar, jadi tidak butuh API key.
Tiap artikel di-fetch ulang secara ringan (cuma ambil `<head>`) untuk ambil `og:image`-nya.
Di-cache 1 jam lewat `revalidate: 3600` biar tidak membebani Google News tiap ada pengunjung.
Kalau fetch gagal (jaringan, rate limit, dsb), fallback ke pesan "belum bisa dimuat" — tidak
pernah menjatuhkan halaman landing.

**Komunitas** — `community_posts` dan `profiles` beneran bisa dibaca semua caregiver yang
login (RLS: `select` terbuka untuk semua `authenticated`), tapi cuma pemilik yang bisa
edit/hapus post miliknya sendiri. Badge "Terverifikasi" dihitung otomatis oleh trigger
Postgres (`update_caregiver_verification`) tiap kali caregiver menambah catatan harian —
begitu total catatan mereka tembus 14 hari, `profiles.is_verified` otomatis jadi `true`
tanpa perlu admin manual. Tombol "X orang merasa terbantu" memanggil fungsi Postgres
`increment_helpful` (SECURITY DEFINER) yang cuma boleh menambah angka, tidak bisa
mengubah isi post orang lain.

**Tombol Darurat (SOS)** — muncul di semua halaman lewat `SosButton`, langsung pakai
`tel:` link asli ke 119 (ambulans), 119 ext 8 (Sejiwa/hotline sehat jiwa Kemenkes), dan
nomor psikiater (ganti nomor placeholder di `components/SosButton.tsx` dengan nomor asli).

**Unduh PDF** — `SummaryClient.tsx` pakai `jspdf` di sisi client (bukan headless
browser di server, biar tetap ringan buat deploy di Vercel serverless) untuk generate
PDF asli dari data ringkasan sesuai periode yang dipilih caregiver.

## Catatan scope (dari strategi hackathon)

- Satu caregiver = satu pasien untuk MVP ini (lihat `lib/getOrCreatePatient.ts`).
- `risk_category` cuma "low/medium/high" — sengaja tidak ada angka persentase risiko,
  supaya tidak terbaca sebagai klaim diagnosis (lihat system prompt di `app/api/insight/route.ts`).
- Nomor psikiater di tombol SOS masih placeholder (`081234567890`) — wajib diganti sebelum
  demo/production sungguhan.
