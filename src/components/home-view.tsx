"use client";

import {
  CalendarDays,
  Clock,
  History,
  Hourglass,
  PartyPopper,
  Plus,
  Repeat,
  Search,
  Star,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listEvents } from "@/lib/actions/events";
import { formatPretty, prepareEvents, todayISO } from "@/lib/date-utils";
import type { DayEvent } from "@/lib/types";
import { AddEventSheet } from "./add-event-sheet";
import { EventCard } from "./event-card";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeView() {
  const [events, setEvents] = useState<DayEvent[] | null>(null);
  const [today, setToday] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await listEvents());
      setToday(todayISO());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      if (msg.includes("UNAUTHORIZED")) {
        toast.error("Session expired");
        window.location.href = "/login";
        return;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const prepared = useMemo(
    () => (events ? prepareEvents(events, today) : []),
    [events, today],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prepared;
    return prepared.filter((p) => p.event.title.toLowerCase().includes(q));
  }, [prepared, query]);

  const todays = filtered.filter((p) => p.days === 0);
  const upcoming = filtered.filter((p) => p.days > 0);
  const past = filtered.filter((p) => p.days < 0);
  const nextSoon = upcoming[0];
  const stats = [
    {
      Icon: Ticket,
      label: "Total events",
      value: prepared.length,
      tint: "text-sky-300 bg-sky-400/10 border-sky-400/20",
    },
    {
      Icon: PartyPopper,
      label: "Happening today",
      value: prepared.filter((p) => p.days === 0).length,
      tint: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    },
    {
      Icon: Hourglass,
      label: "In next 30 days",
      value: prepared.filter((p) => p.days > 0 && p.days <= 30).length,
      tint: "text-amber-300 bg-amber-400/10 border-amber-400/20",
    },
    {
      Icon: Repeat,
      label: "Yearly repeats",
      value: prepared.filter((p) => p.event.recurring).length,
      tint: "text-purple-300 bg-purple-400/10 border-purple-400/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section
        className="animate-fade-up relative overflow-hidden rounded-3xl border border-white/[0.06] bg-surface p-6 sm:p-8"
        style={{ animationDelay: "0ms" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <Clock size={14} />
              {greeting()}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your dates, never missed.
            </h1>
            <p className="mt-2 text-sm text-muted">
              {formatPretty(today)} · {prepared.length} event
              {prepared.length === 1 ? "" : "s"} in your life
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/calendar"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold transition hover:bg-white/[0.08]"
            >
              <CalendarDays size={16} />
              Calendar
            </Link>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#071510] shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={3} />
              Add event
            </button>
          </div>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ Icon, label, value, tint }, i) => (
            <div
              key={label}
              style={{ animationDelay: `${(i + 1) * 60}ms` }}
              className="animate-fade-up rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-4"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${tint}`}
              >
                <Icon size={15} />
              </span>
              <div className="mt-3 text-2xl font-extrabold leading-none">
                {value}
              </div>
              <div className="mt-1.5 text-xs font-medium text-muted">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Next up spotlight */}
      {!loading && nextSoon && !query && (
        <section className="animate-fade-up" style={{ animationDelay: "80ms" }}>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300">
            <Star size={13} className="fill-emerald-300" />
            Next up
          </p>
          <EventCard prepared={nextSoon} highlight />
        </section>
      )}

      {/* search */}
      {!loading && prepared.length > 0 && (
        <div className="relative max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your dates…"
            className="w-full rounded-2xl border border-white/[0.07] bg-surface/80 py-3 pl-10 pr-4 text-sm outline-none backdrop-blur transition placeholder:text-muted/60 hover:border-white/10 focus:border-emerald-400/50"
          />
        </div>
      )}

      {loading && !events && (
        <div className="space-y-3">
          {[
            ["sk-1", "w-full"],
            ["sk-2", "w-11/12"],
            ["sk-3", "w-10/12"],
            ["sk-4", "w-full"],
          ].map(([id, w]) => (
            <div
              key={id}
              className={`h-24 animate-pulse rounded-2xl bg-surface ${w}`}
            />
          ))}
        </div>
      )}

      {!loading && prepared.length === 0 && (
        <div className="animate-fade-up rounded-3xl border border-dashed border-white/10 bg-surface/50 px-6 py-14 text-center">
          <span className="animate-float mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-emerald-300">
            <CalendarDays size={30} />
          </span>
          <h2 className="mt-5 text-xl font-bold tracking-tight">
            No dates yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Add a birthday, anniversary, or deadline — Daydora will keep
            counting down for you, every single year.
          </p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#071510] shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={3} />
            Add your first event
          </button>
        </div>
      )}

      {!loading && query && filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">
          No matches for “{query}”. Try another search.
        </p>
      )}

      {todays.length > 0 && (
        <Section title="Today" Icon={PartyPopper} accent>
          {todays.map((p, i) => (
            <EventCard key={p.event.id} prepared={p} highlight index={i} />
          ))}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming" Icon={Hourglass}>
          {upcoming.map((p, i) => (
            <EventCard key={p.event.id} prepared={p} index={i} />
          ))}
        </Section>
      )}

      {past.length > 0 && (
        <Section title="Past" Icon={History}>
          {past.map((p, i) => (
            <EventCard key={p.event.id} prepared={p} dim index={i} />
          ))}
        </Section>
      )}

      {showAdd && (
        <AddEventSheet onClose={() => setShowAdd(false)} onCreated={refresh} />
      )}
    </div>
  );
}

function Section({
  title,
  Icon,
  accent,
  children,
}: {
  title: string;
  Icon: React.ElementType;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={`mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${
          accent ? "text-emerald-300" : "text-muted"
        }`}
      >
        <Icon size={13} />
        {title}
        <span className="h-px flex-1 bg-white/[0.06]" />
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
