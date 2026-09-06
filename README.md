# Relivia

Caregiver daily check-ins → structured clinical signal for psikiater. Next.js App Router
+ Supabase (auth + Postgres) + Gemini API (used for insight summaries), deployable straight to Vercel.

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** → jalankan seluruh isi file `supabase/schema.sql` (termasuk tabel
   `patients`, `daily_checkins`, `ai_insights`, `profiles`, `community_posts`, trigger
   verifikasi otomatis, dan fungsi `increment_helpful`). Skrip aman dijalankan ulang.
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
- `GEMINI_API_KEY` — dari [Google AI Studio](https://aistudio.google.com/app/apikey).

## 4. Tambahkan foto

Landing saat ini dipakai tanpa foto eksternal — hanya butuh `public/logo.png` (sudah ada).
File-file lama seperti `public/images/README.md` beserta daftar `hero-caregiver.jpg` /
`consult-warm.jpg` tidak lagi direferensikan oleh kode dan bisa diabaikan.

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
  login/                 Login, signup, layar "cek email", tombol resend, dan Google OAuth
  onboarding/            Isi profil pasien pertama kali sebelum masuk dashboard
  auth/callback/          Route handler yang menukar code jadi session
  dashboard/              Grafik pemantauan, kalender pencatatan, log harian (data asli)
  checkin/                Wizard catatan harian (5 langkah) — mood, tidur, interaksi, medikasi, catatan
  insight/                Tombol "Buat Insight" -> panggil Gemini API -> simpan ke ai_insights
  summary/                Selector periode (1/3 minggu, 1 bulan) + unduh PDF asli (jsPDF)
  community/              Feed lintas-user asli: baca semua post, tulis post sendiri, vote "membantu"
  api/insight/route.ts    Endpoint server-side yang memanggil Gemini (gemini-3.1-flash-lite)
lib/
  news.ts                 Scraper: ambil RSS Google News utk keyword "caregiver" + og:image tiap artikel
  getOrCreatePatient.ts    Auto-provision profil pasien (MVP: 1 caregiver = 1 pasien)
  getOrCreateProfile.ts    Auto-provision profil publik caregiver (untuk fitur Komunitas)
  supabase/                Client & server Supabase (mengikuti pola @supabase/ssr)
supabase/schema.sql        Skema tabel + RLS + trigger verifikasi otomatis + fungsi increment_helpful
components/
  landing/                 Halaman beranda modular: LandingNavbar, Hero, Features, HowItWorks, dst
  TopNav.tsx               Navbar sticky pasca-login dengan pill beranimasi (framer-motion)
  CheckinWizard.tsx        Wizard 5 langkah untuk catatan harian
  MonitoringChart.tsx / Calendar.tsx / InsightPanel.tsx / SummaryClient.tsx
  CommunityFeed.tsx / ShareStoryForm.tsx / SosButton.tsx / Icons.tsx / Logo.tsx
```

## Cara kerja fitur-fitur baru

**Insight AI (Gemini)** — `app/api/insight/route.ts` mengambil 14 catatan terakhir
(lama ke terbaru), lalu meminta `gemini-3.1-flash-lite` mengembalikan JSON ketat:
`risk_category` (`low`/`medium`/`high`), `contributing_factors`, dan `clinical_summary`
— tanpa skor/angka risiko, tanpa diagnosis. Butuh minimal 3 hari catatan; kalau kurang,
API menolak dengan pesan yang jelas. Error Gemini diparse aslinya: kunci salah, model
tidak tersedia, kuota/rate-limit habis (ditandai sendiri), atau layanan sibuk. Transient
failure (429 / 5xx) dicoba ulang sampai 3× dengan exponential backoff. Hasil valid
disimpan ke `ai_insights`.

**Register & Login** — signup dibuat se-"senyaman" mungkin: kalau Supabase disetel
dengan "Confirm email" mati (demo), user langsung masuk otomatis (fallback
`signInWithPassword`) tanpa buka email. Kalau "Confirm email" tetap aktif, user
diarahkan ke layar "Cek email" dengan tombol resend, dan alamat redirect konfirmasi
diarahkan ke `/auth/callback`. Pendaftaran sukses ditandai lewat `sessionStorage`
sehingga onboarding menampilkan banner "Pendaftaran berhasil!". Setelah login, user
baru yang belum mengisi nama/umur pasien dilempar ke `/onboarding` (kartu flip dengan
framer-motion) sebelum dashboard terbuka.

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

## Automatic Monitoring & Android (Capacitor)

Alur otomatis: Health Connect → background sync → baseline personal →
deteksi perubahan → Relivia Agent → notifikasi → tap → pertanyaan agent →
jawaban → re-analisis → Clinical Insight → Consultation Brief.

1. Jalankan migrasi `supabase/migrations/02_auto_monitoring.sql` setelah `schema.sql`.
2. Deploy web ke Vercel, isi `server.url` di `capacitor.config.ts` dengan URL deploy.
3. `npm run build:android` (build + `npx cap sync android`), buka `npx cap open android`,
   lalu build APK dari Android Studio (butuh Android SDK + Health Connect di perangkat).
4. Demo tanpa perangkat: halaman `/health` → "Seed 7 Hari Baseline" → "Simulasi Hari
   Perubahan" → pipeline otomatis jalan (deteksi + sesi agent + notifikasi), buka `/agent`
   untuk menjawab pertanyaan dan melihat insight.

File kunci: `android/app/src/main/java/com/relivia/app/` (plugin `ReliviaHealthPlugin`,
`HealthSyncWorker` 6-jam, `HealthConnectReader`, `NotificationHelper`),
`lib/autoTrigger.ts`, `lib/nativeBridge.ts`, `lib/healthSyncQueue.ts`,
`app/api/health-sync/route.ts`, `app/api/agent/session/[id]/route.ts`,
`app/api/notifications/dispatch/route.ts`, `components/AutoMonitorProvider.tsx`.

