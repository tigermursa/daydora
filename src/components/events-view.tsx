"use client";

import { LayoutList, Pencil, Plus, Search, Ticket, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteEvent, listEvents } from "@/lib/actions/events";
import { formatPretty, prepareEvents, todayISO } from "@/lib/date-utils";
import {
  type DayEvent,
  EVENT_TYPES,
  type EventType,
  TYPE_META,
} from "@/lib/types";
import { AddEventSheet } from "./add-event-sheet";
import { EditEventSheet } from "./edit-event-sheet";
import { TypeIcon } from "./type-icon";

type SortKey = "soonest" | "title" | "newest";

export function EventsView() {
  const [events, setEvents] = useState<DayEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DayEvent | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [sort, setSort] = useState<SortKey>("soonest");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await listEvents());
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const prepared = useMemo(
    () => (events ? prepareEvents(events, todayISO()) : []),
    [events],
  );

  const visible = useMemo(() => {
    let list = [...prepared];
    if (typeFilter !== "all") {
      list = list.filter((p) => p.event.type === typeFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.event.title.toLowerCase().includes(q));
    if (sort === "title")
      list.sort((a, b) => a.event.title.localeCompare(b.event.title));
    if (sort === "newest")
      list.sort(
        (a, b) =>
          new Date(b.event.createdAt).getTime() -
          new Date(a.event.createdAt).getTime(),
      );
    return list;
  }, [prepared, query, typeFilter, sort]);

  async function handleDelete(event: DayEvent) {
    if (!confirm(`Delete "${event.title}"?`)) return;
    setDeleting(event.id);
    const res = await deleteEvent(event.id);
    setDeleting(null);
    if (!res.ok) {
      toast.error(res.error ?? "Failed to delete");
      return;
    }
    toast.success("Event deleted");
    setEvents((prev) => prev?.filter((e) => e.id !== event.id) ?? null);
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
              <LayoutList size={22} />
            </span>
            All events
          </h1>
          <p className="mt-2 text-sm text-muted">
            {prepared.length} event{prepared.length === 1 ? "" : "s"} · manage,
            edit and keep them in sync
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#071510] shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={3} />
          Add event
        </button>
      </div>

      {/* controls */}
      {prepared.length > 0 && (
        <div
          className="animate-fade-up space-y-3"
          style={{ animationDelay: "50ms" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events…"
                className="w-full rounded-2xl border border-white/[0.07] bg-surface/80 py-3 pl-10 pr-4 text-sm outline-none backdrop-blur transition placeholder:text-muted/60 hover:border-white/10 focus:border-emerald-400/50"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-2xl border border-white/[0.07] bg-surface/80 px-3 py-3 text-sm outline-none backdrop-blur focus:border-emerald-400/50"
              aria-label="Sort events"
            >
              <option value="soonest">Soonest first</option>
              <option value="title">A → Z</option>
              <option value="newest">Newest added</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                typeFilter === "all"
                  ? "bg-emerald-500 text-[#071510]"
                  : "border border-white/[0.07] text-muted hover:text-foreground",
              ].join(" ")}
            >
              All
            </button>
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
                className={[
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  typeFilter === t
                    ? "text-[#071510]"
                    : "border border-white/[0.07] text-muted hover:text-foreground",
                ].join(" ")}
                style={
                  typeFilter === t
                    ? { backgroundColor: TYPE_META[t].accent }
                    : undefined
                }
              >
                <TypeIcon type={t} size={12} />
                {TYPE_META[t].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && !events && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[76px] animate-pulse rounded-2xl bg-surface"
            />
          ))}
        </div>
      )}

      {events && prepared.length === 0 && (
        <div className="animate-fade-up rounded-3xl border border-dashed border-white/10 bg-surface/50 px-6 py-14 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-emerald-300">
            <Ticket size={28} />
          </span>
          <p className="mt-5 text-lg font-bold tracking-tight">No events yet</p>
          <p className="mt-1 text-sm text-muted">
            Add your first date and start counting down.
          </p>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#071510] shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
          >
            <Plus size={16} strokeWidth={3} />
            Add event
          </button>
        </div>
      )}

      {visible.length > 0 && (
        <ul className="space-y-2.5">
          {visible.map(({ event, nextDate, days }, i) => (
            <li
              key={event.id}
              style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
              className="animate-fade-up group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-surface/80 p-3 backdrop-blur transition hover:-translate-y-0.5 hover:border-white/10 hover:bg-surface-2/70 hover:shadow-xl sm:p-4"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${TYPE_META[event.type].accent}1a`,
                  color: TYPE_META[event.type].accent,
                }}
              >
                <TypeIcon type={event.type} size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{event.title}</div>
                <div className="mt-0.5 text-xs text-muted">
                  {formatPretty(nextDate)} · {TYPE_META[event.type].label}
                  {event.recurring ? " · yearly" : ""}
                </div>
              </div>
              <span
                className={[
                  "shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-extrabold",
                  days === 0
                    ? "bg-emerald-500 text-[#071510]"
                    : "bg-white/[0.05] text-muted",
                ].join(" ")}
              >
                {days === 0
                  ? "Today"
                  : days < 0
                    ? `${Math.abs(days)}d ago`
                    : `${days}d`}
              </span>
              <span className="hidden shrink-0 gap-1 sm:flex">
                <button
                  type="button"
                  onClick={() => setEditing(event)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-white/[0.07] hover:text-foreground"
                >
                  <Pencil size={13} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(event)}
                  disabled={deleting === event.id}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  {deleting === event.id ? "…" : "Delete"}
                </button>
              </span>
              <span className="flex shrink-0 gap-1 sm:hidden">
                <button
                  type="button"
                  onClick={() => setEditing(event)}
                  aria-label="Edit"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-muted"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(event)}
                  aria-label="Delete"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] text-muted"
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {prepared.length > 0 && visible.length === 0 && (
        <p className="py-8 text-center text-sm text-muted">
          No events match your filters.
        </p>
      )}

      {adding && (
        <AddEventSheet onClose={() => setAdding(false)} onCreated={refresh} />
      )}
      {editing && (
        <EditEventSheet
          event={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setEvents(
              (prev) =>
                prev?.map((e) => (e.id === updated.id ? updated : e)) ?? null,
            );
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
