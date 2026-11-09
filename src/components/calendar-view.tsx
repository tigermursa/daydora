"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Lightbulb,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listEvents } from "@/lib/actions/events";
import { formatPretty, parseISO, todayISO } from "@/lib/date-utils";
import { type DayEvent, EVENT_TYPES, TYPE_META } from "@/lib/types";
import { TypeIcon } from "./type-icon";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface Cell {
  date: string;
  dayNum: number;
  current: boolean;
}

function buildMonth(y: number, m: number): Cell[] {
  const startWeekday = new Date(y, m - 1, 1).getDay();
  const daysThisMonth = new Date(y, m, 0).getDate();
  const prevDays = new Date(y, m - 1, 0).getDate();
  const cells: Cell[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = prevDays - i;
    const mm = m === 1 ? 12 : m - 1;
    const yy = m === 1 ? y - 1 : y;
    cells.push({ date: iso(yy, mm, d), dayNum: d, current: false });
  }
  for (let d = 1; d <= daysThisMonth; d++) {
    cells.push({ date: iso(y, m, d), dayNum: d, current: true });
  }
  let next = 1;
  while (cells.length < 42) {
    const mm = m === 12 ? 1 : m + 1;
    const yy = m === 12 ? y + 1 : y;
    cells.push({ date: iso(yy, mm, next), dayNum: next, current: false });
    next++;
  }
  return cells;
}

function occursOn(e: DayEvent, cellDate: string): boolean {
  if (!e.recurring) return e.date === cellDate;
  const eo = parseISO(e.date);
  const co = parseISO(cellDate);
  if (eo.m !== co.m) return false;
  if (eo.d === co.d) return true;
  if (eo.m === 2 && eo.d === 29 && co.d === 28) {
    return new Date(co.y, co.m, 0).getDate() === 28;
  }
  return false;
}

export function CalendarView() {
  const [events, setEvents] = useState<DayEvent[]>([]);
  const today = useMemo(todayISO, []);
  const now = useMemo(() => parseISO(today), [today]);
  const [view, setView] = useState({ y: now.y, m: now.m });
  const [selected, setSelected] = useState(today);

  const refresh = useCallback(async () => {
    try {
      setEvents(await listEvents());
    } catch {
      toast.error("Failed to load calendar");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cells = useMemo(() => buildMonth(view.y, view.m), [view]);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    for (const cell of cells) {
      const list = events.filter((e) => occursOn(e, cell.date));
      if (list.length) map.set(cell.date, list);
    }
    return map;
  }, [events, cells]);

  const selectedEvents = eventsByDay.get(selected) ?? [];
  const monthCount = eventsByDay.size;

  function move(delta: number) {
    setView((v) => {
      let m = v.m + delta;
      let y = v.y;
      if (m < 1) {
        m = 12;
        y--;
      }
      if (m > 12) {
        m = 1;
        y++;
      }
      return { y, m };
    });
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="animate-fade-up flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
              <CalendarDays size={22} />
            </span>
            Calendar
          </h1>
          <p className="mt-2 text-sm text-muted">
            {monthCount} day{monthCount === 1 ? "" : "s"} with events this month
            · {events.length} total
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.07] bg-surface/80 p-1.5 backdrop-blur">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-white/[0.07] active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              setView({ y: now.y, m: now.m });
              setSelected(today);
            }}
            className="rounded-xl bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/25"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-white/[0.07] active:scale-95"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* legend */}
      <div
        className="animate-fade-up flex flex-wrap gap-1.5"
        style={{ animationDelay: "40ms" }}
      >
        {EVENT_TYPES.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-surface/70 px-2.5 py-1.5 text-[11px] font-medium text-muted"
          >
            <TypeIcon
              type={t}
              size={12}
              style={{ color: TYPE_META[t].accent }}
            />
            {TYPE_META[t].label}
          </span>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        {/* month grid */}
        <div
          className="animate-fade-up overflow-hidden rounded-3xl border border-white/[0.07] bg-surface/70 shadow-xl backdrop-blur"
          style={{ animationDelay: "60ms" }}
        >
          <div className="border-b border-white/[0.05] px-5 py-4 text-center">
            <span className="text-lg font-extrabold tracking-tight">
              {new Date(view.y, view.m - 1, 1).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-px bg-white/[0.04]">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="bg-surface px-1 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-muted"
              >
                {w}
              </div>
            ))}
            {cells.map((c) => {
              const evs = eventsByDay.get(c.date) ?? [];
              const isToday = c.date === today;
              const isSelected = c.date === selected;
              return (
                <button
                  key={c.date}
                  type="button"
                  onClick={() => setSelected(c.date)}
                  className={[
                    "group relative flex min-h-[74px] flex-col items-stretch gap-1 p-1.5 text-left transition sm:min-h-[88px] sm:p-2",
                    c.current ? "bg-surface" : "bg-surface/40",
                    isSelected
                      ? "z-10 bg-emerald-500/[0.14] shadow-[inset_0_0_0_2px_#2ee06f]"
                      : "hover:bg-white/[0.04]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-6 w-6 items-center justify-center self-start rounded-full text-xs font-bold transition",
                      isToday
                        ? "bg-emerald-500 text-[#071510] shadow-md shadow-emerald-500/40"
                        : c.current
                          ? "text-foreground"
                          : "text-muted/50",
                    ].join(" ")}
                  >
                    {c.dayNum}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    {evs.slice(0, 2).map((e) => (
                      <span
                        key={e.id}
                        className="truncate rounded-md px-1.5 py-0.5 text-[9px] font-semibold leading-tight sm:text-[10px]"
                        style={{
                          backgroundColor: `${TYPE_META[e.type].accent}26`,
                          color: TYPE_META[e.type].accent,
                        }}
                      >
                        {e.title}
                      </span>
                    ))}
                    {evs.length > 2 && (
                      <span className="px-1 text-[9px] font-medium text-muted">
                        +{evs.length - 2} more
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* day detail */}
        <aside
          className="animate-fade-up rounded-3xl border border-white/[0.07] bg-surface/70 p-5 backdrop-blur lg:sticky lg:top-24"
          style={{ animationDelay: "100ms" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
            {selected === today ? "Today" : "Selected day"}
          </p>
          <h2 className="mt-1.5 text-base font-extrabold">
            {formatPretty(selected)}
          </h2>

          {selectedEvents.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-muted">
                <CloudSun size={22} />
              </span>
              <p className="mt-3 text-sm font-medium">No events this day</p>
              <p className="mt-1 text-xs text-muted">
                Tap another date or add a new event.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {selectedEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${TYPE_META[e.type].accent}1a`,
                      color: TYPE_META[e.type].accent,
                    }}
                  >
                    <TypeIcon type={e.type} size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{e.title}</div>
                    <div className="text-xs text-muted">
                      {TYPE_META[e.type].label}
                      {e.recurring ? " · yearly" : ""}
                    </div>
                  </div>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: TYPE_META[e.type].accent }}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 rounded-2xl bg-emerald-500/[0.08] p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Lightbulb size={13} />
              Tip
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Colored pills show your events on each day. The solid circle means
              this is happening today.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
