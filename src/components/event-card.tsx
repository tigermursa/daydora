"use client";

import { CalendarDays, Repeat } from "lucide-react";
import type { PreparedEvent } from "@/lib/date-utils";
import { formatCountdown, formatPretty } from "@/lib/date-utils";
import { TYPE_META } from "@/lib/types";
import { TypeIcon } from "./type-icon";

export function EventCard({
  prepared,
  highlight,
  dim,
  index = 0,
}: {
  prepared: PreparedEvent;
  highlight?: boolean;
  dim?: boolean;
  index?: number;
}) {
  const { event, nextDate, days } = prepared;
  const meta = TYPE_META[event.type];

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
      className={[
        "group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:gap-4 sm:p-5 animate-fade-up",
        highlight
          ? "border-emerald-400/25 bg-gradient-to-r from-emerald-400/[0.10] via-surface to-surface shadow-lg shadow-emerald-500/10"
          : "border-white/[0.06] bg-surface/80 backdrop-blur hover:border-white/10 hover:bg-surface-2/70",
        dim ? "opacity-60 hover:opacity-90" : "",
      ].join(" ")}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: meta.accent }}
      />
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
        style={{
          backgroundColor: `${meta.accent}1a`,
          border: `1px solid ${meta.accent}35`,
          color: meta.accent,
        }}
      >
        <TypeIcon type={event.type} size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-bold tracking-tight">{event.title}</h3>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${meta.accent}1f`,
              color: meta.accent,
            }}
          >
            {meta.label}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted sm:text-[13px]">
          <CalendarDays size={13} className="shrink-0" />
          {formatPretty(nextDate)}
          {event.recurring && (
            <span className="ml-1 flex items-center gap-1 text-[11px]">
              <Repeat size={11} />
              yearly
            </span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <div
          className={[
            "inline-flex min-w-[60px] flex-col items-center rounded-xl px-2 py-1.5",
            days === 0
              ? "bg-emerald-500 text-[#071510] shadow-md shadow-emerald-500/30"
              : "bg-white/[0.04]",
          ].join(" ")}
        >
          <span className="text-sm font-extrabold leading-none">
            {days === 0 ? "Today" : `${Math.abs(days)}d`}
          </span>
          <span
            className={`mt-0.5 text-[10px] font-medium ${
              days === 0 ? "text-[#071510]/75" : "text-muted"
            }`}
          >
            {formatCountdown(days)}
          </span>
        </div>
      </div>
    </article>
  );
}
