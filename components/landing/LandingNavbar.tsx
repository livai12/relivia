"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const links = [
  { href: "#features", label: "Fitur" },
  { href: "#how", label: "Cara Kerja" },
  { href: "#insight", label: "AI Insight" },
  { href: "#faq", label: "FAQ" },
  { href: "#trust", label: "Tentang Kami" },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
      <div className="w-full max-w-3xl">
        <nav
          className={`flex items-center justify-between gap-3 rounded-full border border-border/80 bg-white/80 backdrop-blur-xl pl-5 pr-2 py-2.5 transition-shadow duration-300 ${
            scrolled ? "shadow-[0_8px_30px_rgba(31,41,55,0.14)]" : "shadow-card"
          }`}
        >
          <Link href="/" className="flex items-center gap-2 font-bold text-[16.5px] tracking-tight shrink-0">
            <Image
              src="/logo.png"
              alt="Logo Relivia"
              width={30}
              height={30}
              className="rounded-lg"
              priority
            />
            <span className="text-ink">Relivia</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-soft px-3.5 py-2 rounded-full hover:text-ink hover:bg-primary-light transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-semibold text-soft hover:text-ink px-3.5 py-2.5"
            >
              Masuk
            </Link>
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex text-sm font-semibold bg-primary text-white rounded-full px-5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:bg-primary-deep hover:shadow-[0_8px_20px_rgba(139,92,246,0.35)] transition-all"
            >
              Mulai
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Tutup menu" : "Buka menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="md:hidden w-11 h-11 -mr-1.5 flex items-center justify-center rounded-full text-ink hover:bg-primary-light active:bg-primary-light transition-colors"
            >
              {open ? (
                <svg className="w-5 h-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        <div
          id="mobile-menu"
          className={`md:hidden ${open ? "block" : "hidden"}`}
        >
          <div className="mt-3 rounded-3xl border border-border bg-white p-3 shadow-[0_8px_30px_rgba(31,41,55,0.18)]">
            <nav className="flex flex-col gap-0.5">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-[15px] font-semibold text-ink hover:bg-primary-light transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="my-3 h-px bg-border" />
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-center rounded-full border-[1.5px] border-border px-5 py-3 text-[15px] font-semibold text-ink hover:border-primary hover:text-primary-deep transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="text-center rounded-full bg-primary px-5 py-3 text-[15px] font-semibold text-white shadow-pop hover:bg-primary-deep transition-colors"
              >
                Mulai Sekarang
              </Link>
            </div>
          </div>
        </div>
      </div>

      {open && <div className="fixed inset-0 z-[-1] md:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}
