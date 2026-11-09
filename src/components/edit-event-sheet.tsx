"use client";

import { Check, Repeat, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateEvent } from "@/lib/actions/events";
import {
  type DayEvent,
  EVENT_TYPES,
  type EventType,
  TYPE_META,
} from "@/lib/types";
import { TypeIcon } from "./type-icon";

export function EditEventSheet({
  event,
  onClose,
  onSaved,
}: {
  event: DayEvent;
  onClose: () => void;
  onSaved: (event: DayEvent) => void;
}) {
  const [pending, start] = useTransition();
  const [type, setType] = useState<EventType>(event.type);
  const [recurring, setRecurring] = useState(event.recurring);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const date = String(fd.get("date") ?? "");
    if (!title || !date) {
      toast.error("Title and date required");
      return;
    }
    start(async () => {
      const res = await updateEvent(event.id, { title, date, type, recurring });
      if (!res.ok) {
        if (res.error === "SESSION_EXPIRED") {
          toast.error("Session expired");
          window.location.href = "/login";
          return;
        }
        toast.error(res.error ?? "Failed to update");
        return;
      }
      if (!res.event) {
        toast.error("Failed to update");
        return;
      }
      toast.success("Event updated");
      onSaved(res.event);
    });
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: backdrop click closes the sheet; keyboard users can use Cancel
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-slide-up w-full max-w-lg rounded-t-3xl border border-white/10 bg-surface p-5 shadow-2xl shadow-black/60 sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              Edit event
            </h2>
            <p className="mt-0.5 text-xs text-muted">{event.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${TYPE_META[type].accent}1a`,
                color: TYPE_META[type].accent,
              }}
            >
              <TypeIcon type={type} size={21} />
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-white/[0.06] hover:text-foreground"
            >
              <X size={17} />
            </button>
          </div>
        </div>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">
              Title
            </span>
            <input
              name="title"
              defaultValue={event.title}
              className="w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2.5 text-sm outline-none transition hover:border-white/[0.14] focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">
              Date
            </span>
            <input
              name="date"
              type="date"
              defaultValue={event.date}
              className="w-full rounded-xl border border-white/[0.08] bg-background px-3.5 py-2.5 text-sm outline-none transition hover:border-white/[0.14] focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 [color-scheme:dark]"
              required
            />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted">
              Type
            </span>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => {
                const m = TYPE_META[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      setRecurring(m.recurring);
                    }}
                    className={[
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95",
                      active
                        ? "text-[#071510]"
                        : "border border-white/[0.08] text-muted hover:text-foreground",
                    ].join(" ")}
                    style={active ? { backgroundColor: m.accent } : undefined}
                  >
                    <TypeIcon type={t} size={12} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            <span className="flex items-center gap-2 text-sm font-medium">
              <Repeat size={14} className="text-muted" />
              Repeats every year
            </span>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-white/[0.06] hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#071510] shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save changes"}
              {!pending && <Check size={15} strokeWidth={3} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
