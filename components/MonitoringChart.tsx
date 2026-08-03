"use client";

import type { DailyCheckin } from "@/lib/types";

export default function MonitoringChart({ checkins }: { checkins: DailyCheckin[] }) {
  const W = 900, H = 220, padL = 20, padR = 20, padT = 18, padB = 30;
  const n = checkins.length;
  const innerW = W - padL - padR;
  const stepX = n > 1 ? innerW / (n - 1) : 0;

  const x = (i: number) => padL + stepX * i;
  const y = (v: number) => H - padB - (v - 1) * ((H - padT - padB) / 4);

  if (n === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-soft">
        Belum ada catatan. Isi catatan harian pertama untuk mulai lihat grafiknya di sini.
      </div>
    );
  }

  const moodPts = checkins.map((c, i) => `${x(i)},${y(c.mood)}`).join(" ");
  const sleepPts = checkins.map((c, i) => `${x(i)},${y(c.sleep_quality)}`).join(" ");

  return (
    <div className="px-6 pt-4 pb-1">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-auto block">
        {[1, 2, 3, 4, 5].map((g) => (
          <line key={g} x1={padL} y1={y(g)} x2={W - padR} y2={y(g)} stroke="#E7ECF5" strokeWidth={1.5} />
        ))}
        {checkins.map(
          (c, i) =>
            c.behavior_change_flag && (
              <rect
                key={`f${i}`}
                x={x(i) - stepX / 2}
                y={padT}
                width={stepX}
                height={H - padT - padB}
                fill="#F2684B"
                opacity={0.06}
              />
            )
        )}
        <polyline points={sleepPts} fill="none" stroke="#F5A623" strokeWidth={2.5} strokeDasharray="5,4" strokeLinecap="round" />
        <polyline points={moodPts} fill="none" stroke="#2F6FED" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {checkins.map((c, i) => (
          <g key={`m${i}`}>
            {c.behavior_change_flag && <circle cx={x(i)} cy={y(c.mood)} r={7} fill="none" stroke="#F2684B" strokeWidth={1.6} />}
            <circle cx={x(i)} cy={y(c.mood)} r={3.5} fill="#2F6FED" />
          </g>
        ))}
        {checkins.map((c, i) => (
          <rect
            key={`t${i}`}
            x={x(i) - 4}
            y={H - 12}
            width={8}
            height={8}
            rx={2}
            fill={c.medication_taken ? "#33B189" : "#F2684B"}
          />
        ))}
      </svg>
      <div className="text-xs text-faint font-medium pb-4">
        {checkins[0].checkin_date} — {checkins[checkins.length - 1].checkin_date} ·{" "}
        {checkins.filter((c) => c.behavior_change_flag).length} hari ditandai berubah dari pola sebelumnya
      </div>
    </div>
  );
}
