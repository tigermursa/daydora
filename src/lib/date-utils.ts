import type { DayEvent } from "./types";

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month 1-based
}

function safeYear(iso: string, year: number): string {
  const { m, d } = parseISO(iso);
  const day = Math.min(d, daysInMonth(year, m));
  return `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Today বা তার পরের occurrence (recurring হলে yearly advance)। */
export function nextOccurrence(
  dateStr: string,
  recurring: boolean,
  todayStr: string,
): string {
  if (!recurring) return dateStr;
  const year = parseISO(todayStr).y;
  let candidate = safeYear(dateStr, year);
  if (candidate < todayStr) candidate = safeYear(dateStr, year + 1);
  return candidate;
}

/** দিন সংখ্যা (UTC-safe, DST-proof)। */
export function diffDays(fromISO: string, toISO: string): number {
  const a = parseISO(fromISO);
  const b = parseISO(toISO);
  const t1 = Date.UTC(a.y, a.m - 1, a.d);
  const t2 = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((t2 - t1) / 86_400_000);
}

export function formatPretty(iso: string): string {
  const { y, m, d } = parseISO(iso);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCountdown(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `in ${days} days`;
}

export interface PreparedEvent {
  event: DayEvent;
  nextDate: string;
  days: number;
}

export function prepareEvents(
  events: DayEvent[],
  today: string,
): PreparedEvent[] {
  const prepared = events.map((event) => {
    const nextDate = nextOccurrence(event.date, event.recurring, today);
    return { event, nextDate, days: diffDays(today, nextDate) };
  });
  prepared.sort((a, b) => {
    const aPast = a.days < 0;
    const bPast = b.days < 0;
    if (aPast !== bPast) return aPast ? 1 : -1;
    return aPast ? b.days - a.days : a.days - b.days;
  });
  return prepared;
}
