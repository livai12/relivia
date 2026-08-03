"use client";

import type { DailyCheckin } from "@/lib/types";

const DOW = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function Calendar({ checkins }: { checkins: DailyCheckin[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate = new Map(checkins.map((c) => [c.checkin_date, c]));

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push(<div key={`e${i}`} className="aspect-square" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const entry = byDate.get(dateStr);
    const isToday = dateStr === now.toISOString().slice(0, 10);
    let cls = "aspect-square rounded-[10px] flex flex-col items-center justify-center text-xs font-bold bg-bg text-soft";
    if (entry) cls = "aspect-square rounded-[10px] flex flex-col items-center justify-center text-xs font-bold bg-primary-light text-primary-dark cursor-pointer hover:bg-primary-tint transition";
    if (entry?.behavior_change_flag) cls = "aspect-square rounded-[10px] flex flex-col items-center justify-center text-xs font-bold bg-red-tint text-[#C1442B] cursor-pointer hover:bg-[#F3D3C3] transition";
    if (isToday) cls += " ring-2 ring-primary ring-inset";

    cells.push(
      <div
        key={dateStr}
        className={cls}
        onClick={
          entry
            ? () => {
                const el = document.getElementById(`log-${dateStr}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("flash-highlight");
                  setTimeout(() => el.classList.remove("flash-highlight"), 1200);
                }
              }
            : undefined
        }
      >
        {d}
        {entry && <span className="w-1 h-1 rounded-full bg-current mt-0.5" />}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-1.5 px-6 pt-4 pb-5">
      {DOW.map((d) => (
        <div key={d} className="text-center text-[10.5px] font-bold text-faint pb-1">{d}</div>
      ))}
      {cells}
    </div>
  );
}
