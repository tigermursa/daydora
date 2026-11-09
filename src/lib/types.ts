export const EVENT_TYPES = [
  "birthday",
  "anniversary",
  "special_day",
  "important_day",
  "death_day",
  "exam",
  "meeting",
  "trip",
  "festival",
  "reminder",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const TYPE_META: Record<
  EventType,
  { label: string; accent: string; recurring: boolean }
> = {
  birthday: {
    label: "Birthday",
    accent: "#f472b6",
    recurring: true,
  },
  anniversary: {
    label: "Anniversary",
    accent: "#c084fc",
    recurring: true,
  },
  special_day: {
    label: "Special Day",
    accent: "#facc15",
    recurring: true,
  },
  important_day: {
    label: "Important Day",
    accent: "#38bdf8",
    recurring: true,
  },
  death_day: {
    label: "Remembrance",
    accent: "#a3a3a3",
    recurring: true,
  },
  exam: { label: "Exam", accent: "#f97316", recurring: false },
  meeting: {
    label: "Meeting",
    accent: "#22d3ee",
    recurring: false,
  },
  trip: { label: "Trip", accent: "#4ade80", recurring: false },
  festival: {
    label: "Festival",
    accent: "#fb7185",
    recurring: true,
  },
  reminder: {
    label: "Reminder",
    accent: "#fbbf24",
    recurring: false,
  },
  other: { label: "Other", accent: "#94a3b8", recurring: false },
};

export interface DayEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: EventType;
  recurring: boolean;
  createdAt: string;
}

export interface EventInput {
  title: string;
  date: string;
  type: EventType;
  recurring: boolean;
}
