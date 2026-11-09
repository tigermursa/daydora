"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "../auth";
import { type EventDoc, eventsCollection } from "../mongodb";
import {
  type DayEvent,
  EVENT_TYPES,
  type EventInput,
  TYPE_META,
} from "../types";

function serialize(doc: EventDoc & { _id: ObjectId }): DayEvent {
  return {
    id: doc._id.toString(),
    title: doc.title,
    date: doc.date,
    type: doc.type,
    recurring: doc.recurring,
    createdAt: doc.createdAt.toISOString(),
  };
}

function validate(input: EventInput): string | null {
  if (!input.title?.trim()) return "Title is required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return "Invalid date";
  if (!EVENT_TYPES.includes(input.type)) return "Invalid event type";
  return null;
}

export async function listEvents(): Promise<DayEvent[]> {
  const { uid: userId } = await requireAuth();
  const col = await eventsCollection();
  // STRICT ISOLATION: a user only ever sees rows tagged with their own
  // userId. Docs without a userId (created before multi-user accounts
  // existed) are invisible to everyone — assign them to an account once via
  // `node scripts/migrate-events.mjs <email>` instead of auto-claiming.
  const docs = await col.find({ userId }).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => serialize(d as EventDoc & { _id: ObjectId }));
}

export async function createEvent(
  input: EventInput,
): Promise<{ ok: boolean; error?: string; event?: DayEvent }> {
  let userId: string;
  try {
    ({ uid: userId } = await requireAuth());
  } catch {
    return { ok: false, error: "SESSION_EXPIRED" };
  }
  const err = validate(input);
  if (err) return { ok: false, error: err };
  const col = await eventsCollection();
  const doc: EventDoc = {
    userId,
    title: input.title.trim(),
    date: input.date,
    type: input.type,
    recurring: input.recurring ?? TYPE_META[input.type].recurring,
    createdAt: new Date(),
  };
  const res = await col.insertOne(doc);
  return { ok: true, event: serialize({ ...doc, _id: res.insertedId }) };
}

export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<{ ok: boolean; error?: string; event?: DayEvent }> {
  let userId: string;
  try {
    ({ uid: userId } = await requireAuth());
  } catch {
    return { ok: false, error: "SESSION_EXPIRED" };
  }
  const err = validate(input);
  if (err) return { ok: false, error: err };
  if (!ObjectId.isValid(id)) return { ok: false, error: "Invalid id" };
  const col = await eventsCollection();
  const updated = await col.findOneAndUpdate(
    { _id: new ObjectId(id), userId },
    {
      $set: {
        title: input.title.trim(),
        date: input.date,
        type: input.type,
        recurring: input.recurring,
      },
    },
    { returnDocument: "after" },
  );
  if (!updated) return { ok: false, error: "Event not found" };
  return {
    ok: true,
    event: serialize(updated as EventDoc & { _id: ObjectId }),
  };
}

export async function deleteEvent(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  let userId: string;
  try {
    ({ uid: userId } = await requireAuth());
  } catch {
    return { ok: false, error: "SESSION_EXPIRED" };
  }
  if (!ObjectId.isValid(id)) return { ok: false, error: "Invalid id" };
  const col = await eventsCollection();
  await col.deleteOne({ _id: new ObjectId(id), userId });
  return { ok: true };
}
