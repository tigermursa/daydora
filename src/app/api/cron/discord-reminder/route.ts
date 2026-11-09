import { timingSafeEqual } from "node:crypto";
import { nextOccurrence } from "@/lib/date-utils";
import { eventsCollection, usersCollection } from "@/lib/mongodb";
import { TYPE_META } from "@/lib/types";

// Cron runs on server time (UTC), but "today" must follow the user's
// timezone, otherwise a 12 AM Dhaka hit would check yesterday's date.
const TIMEZONE = "Asia/Dhaka";
// Discord notification sudhu mursalin.ph@gmail.com-er dates-er jonno jabe,
// baki kono user-er jonno jabe na. Email DB te lowercase store hoy
// (signup/login-e toLowerCase kora hoy), tai ekhaneo lowercase rakha holo.
// Env override rakhini — onno email set holeo sudhu ei email-er jonnoi jabe.
const OWNER_EMAIL = "mursalin.ph@gmail.com";

function todayInTimezone(timezone = TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const url = new URL(request.url);
  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const key = bearer || url.searchParams.get("key") || "";
  return key.length > 0 && safeEqual(key, secret);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return Response.json(
      { ok: false, error: "CRON_SECRET env missing" },
      { status: 500 },
    );
  }
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const today =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : todayInTimezone();
  const dryRun = url.searchParams.get("dryRun") === "1";

  const col = await eventsCollection();
  const users = await usersCollection();

  // Sudhu OWNER_EMAIL-er dates — baki user-der event ekdom ignore.
  const owner = await users.findOne(
    { email: OWNER_EMAIL },
    { projection: { _id: 1, name: 1, email: 1 } },
  );
  if (!owner) {
    return Response.json({
      ok: true,
      date: today,
      timezone: TIMEZONE,
      count: 0,
      notified: false,
      ownerEmail: OWNER_EMAIL,
    });
  }
  const ownerId = owner._id.toString();
  const all = await col.find({ userId: ownerId }).toArray();

  // An event "is today" when its next occurrence (yearly roll-forward for
  // recurring events) lands exactly on today — same rule as the home page.
  const todays = all
    .filter((e) => nextOccurrence(e.date, e.recurring, today) === today)
    .sort((a, b) => a.title.localeCompare(b.title));

  // No dates today -> no notification, cron still gets a 200.
  if (todays.length === 0) {
    return Response.json({
      ok: true,
      date: today,
      timezone: TIMEZONE,
      count: 0,
      notified: false,
    });
  }

  const ownerLabel = `${owner.name} (${owner.email})`;
  const lines: string[] = [];
  for (const e of todays) {
    const type = TYPE_META[e.type]?.label ?? e.type;
    lines.push(`• **${e.title}** (${type}) — ${ownerLabel}`);
  }

  const header = `📅 **Daydora — ${todays.length} date${
    todays.length === 1 ? "" : "s"
  } today** (${today})`;
  // Discord content limit is 2000 chars; truncate rather than fail.
  let content = `${header}\n${lines.join("\n")}`;
  if (content.length > 1900) {
    content = `${content.slice(0, 1900)}\n…`;
  }

  const events = todays.map((e) => ({
    title: e.title,
    type: e.type,
    date: e.date,
    recurring: e.recurring,
    userId: e.userId ?? null,
  }));

  if (dryRun) {
    return Response.json({
      ok: true,
      date: today,
      timezone: TIMEZONE,
      count: todays.length,
      notified: false,
      dryRun: true,
      message: content,
      events,
    });
  }

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    return Response.json(
      { ok: false, error: "DISCORD_WEBHOOK_URL env missing" },
      { status: 500 },
    );
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    return Response.json(
      { ok: false, error: `Discord webhook failed (${res.status})` },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    date: today,
    timezone: TIMEZONE,
    count: todays.length,
    notified: true,
    events,
  });
}
