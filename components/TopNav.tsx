"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconHome, IconEdit, IconSparkle, IconFileText, IconUsers } from "@/components/Icons";
import Logo from "@/components/Logo";
import SosButton from "@/components/SosButton";

const items = [
  { href: "/dashboard", label: "Dasbor", Icon: IconHome },
  { href: "/checkin", label: "Catatan Harian", Icon: IconEdit },
  { href: "/insight", label: "Insight Klinis", Icon: IconSparkle },
  { href: "/summary", label: "Ringkasan", Icon: IconFileText },
  { href: "/community", label: "Komunitas", Icon: IconUsers },
];

export default function TopNav({ patientName, patientAge }: { patientName: string; patientAge?: number | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between px-7 py-3.5 bg-white border-b border-border sticky top-0 z-20 flex-wrap gap-3">
      <div className="flex items-center gap-7 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="font-extrabold text-lg">Relivia</span>
        </div>
        <nav className="flex gap-1 bg-bg rounded-full p-1 overflow-x-auto">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                  active ? "bg-primary text-white shadow-pop" : "text-soft hover:text-ink"
                }`}
              >
                <item.Icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <SosButton />
        <div className="flex items-center gap-2.5 bg-bg border border-border rounded-full pl-1.5 pr-3.5 py-1.5">
          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
            {patientName.charAt(0)}
          </div>
          <div className="leading-tight">
            <p className="text-xs font-bold m-0">{patientName}{patientAge ? `, ${patientAge}` : ""}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-xs font-semibold text-soft hover:text-red-deep">
          Keluar
        </button>
      </div>
    </div>
  );
}
