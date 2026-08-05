import Reveal from "@/components/landing/Reveal";
import SectionHead from "@/components/landing/SectionHead";

const moodBars = [55, 70, 40, 60, 35, 50, 65, 30, 45, 58, 38, 48, 66, 42];

const meds = [
  { label: "Pagi — Risperidone", status: "Diminum", ok: true },
  { label: "Malam — Risperidone", status: "Terlewat", ok: false },
  { label: "Pagi — Vitamin B", status: "Diminum", ok: true },
];

export default function Showcase() {
  return (
    <section className="py-20 md:py-32">
      <div className="max-w-[1160px] mx-auto px-5 md:px-8">
        <Reveal>
          <SectionHead
            eyebrow="Tampilan Aplikasi"
            title="Satu dashboard untuk semua informasi penting"
            desc="Tren mood, pemantauan konsumsi obat, dan linimasa harian dalam satu tempat — dirancang ramah untuk caregiver."
          />
        </Reveal>
        <Reveal>
          <div className="bg-white border border-border rounded-[28px] shadow-card p-4 md:p-7">
            <div className="grid md:grid-cols-[1.3fr_1fr] gap-4">
              <div className="bg-bg border border-border rounded-xl px-5 py-[18px]">
                <h5 className="text-[12.5px] font-bold uppercase tracking-wide text-soft">Tren Mood — 14 Hari</h5>
                <div className="flex items-end gap-1.5 h-[70px] mt-4">
                  {moodBars.map((h, i) => (
                    <span key={i} className="flex-1 bg-primary rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>

              <div className="bg-bg border border-border rounded-xl px-5 py-[18px]">
                <h5 className="text-[12.5px] font-bold uppercase tracking-wide text-soft">Jadwal Minum Obat</h5>
                <ul className="mt-3.5 flex flex-col gap-2.5">
                  {meds.map((m) => (
                    <li key={m.label} className="flex justify-between items-center text-[13px]">
                      <span className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${m.ok ? "bg-green" : "bg-orange-500"}`} />
                        {m.label}
                      </span>
                      <strong>{m.status}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-bg border border-border rounded-xl px-5 py-[18px]">
                <h5 className="text-[12.5px] font-bold uppercase tracking-wide text-soft">Linimasa Observasi</h5>
                <ul className="mt-3.5 flex flex-col gap-2.5 text-[13px]">
                  <li>3 Agu — Mood stabil, tidur 6.5 jam</li>
                  <li>2 Agu — Sedikit sensitif, interaksi sosial dibatasi</li>
                  <li>1 Agu — Nafsu makan normal, obat tepat waktu</li>
                </ul>
              </div>

              <div className="bg-bg border border-border rounded-xl px-5 py-[18px]">
                <h5 className="text-[12.5px] font-bold uppercase tracking-wide text-soft">Informasi Pasien</h5>
                <ul className="mt-3.5 flex flex-col gap-2.5 text-[13px]">
                  <li>Didiagnosis sejak <strong>2022</strong></li>
                  <li>Caregiver Utama <strong>Anak Perempuan</strong></li>
                  <li>Siklus Konsultasi <strong>Tiap 3 Minggu</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
