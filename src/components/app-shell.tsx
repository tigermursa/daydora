"use client";

import {
  CalendarCheck2,
  CalendarDays,
  Home,
  LayoutList,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { logout, touchSession } from "@/lib/actions/auth";

const NAV = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/events", label: "Events", Icon: LayoutList },
  { href: "/calendar", label: "Calendar", Icon: CalendarDays },
];

const KEY = "daydora:lastActivity";
const TTL_MS = 20 * 60 * 1000;
const TOUCH_INTERVAL = 2 * 60 * 1000;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const lastTouch = useRef(0);

  useEffect(() => {
    localStorage.setItem(KEY, String(Date.now()));
    lastTouch.current = Date.now();

    let lastEvent = 0;
    function onActivity() {
      const now = Date.now();
      if (now - lastEvent < 1000) return;
      lastEvent = now;
      localStorage.setItem(KEY, String(now));

      if (now - lastTouch.current > TOUCH_INTERVAL) {
        lastTouch.current = now;
        touchSession().catch(() => {});
      }
    }

    window.addEventListener("click", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity, { passive: true });
    window.addEventListener("mousemove", onActivity, { passive: true });

    const iv = setInterval(async () => {
      const ts = Number(localStorage.getItem(KEY) || 0);
      if (ts && Date.now() - ts <= TTL_MS) return;
      localStorage.removeItem(KEY);
      setBusy(true);
      toast.info("Session expired — sign in again");
      try {
        await logout();
      } catch {}
      window.location.href = "/login";
    }, 15_000);

    return () => {
      window.removeEventListener("click", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("mousemove", onActivity);
      clearInterval(iv);
    };
  }, []);

  async function handleLogout() {
    setBusy(true);
    localStorage.removeItem(KEY);
    try {
      await logout();
    } catch {}
    window.location.href = "/login";
  }

  return (
    <div className="relative min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#071510]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="group flex shrink-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-[#071510] shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-105">
              <CalendarCheck2 size={22} strokeWidth={2.5} />
            </span>
            <span className="leading-tight">
              <span className="block text-[17px] font-bold tracking-tight">
                Daydora
              </span>
              <span className="hidden text-[11px] text-muted sm:block">
                Dates that matter
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-2xl border border-white/5 bg-white/[0.03] p-1 md:flex">
            {NAV.map(({ href, label, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                    active
                      ? "bg-emerald-500 text-[#071510] shadow-md shadow-emerald-500/25"
                      : "text-muted hover:bg-white/5 hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon size={16} strokeWidth={2.25} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-muted transition hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-10 md:pt-8">
        {children}
      </main>

      <footer className="hidden border-t border-white/5 py-5 text-center text-xs text-muted/70 md:block">
        Daydora — never miss a date that matters.
      </footer>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[1.4rem] border border-white/10 bg-[#0d241b]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl md:hidden">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition",
                active ? "bg-emerald-500/15 text-emerald-300" : "text-muted",
              ].join(" ")}
            >
              <Icon size={19} strokeWidth={2.25} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
