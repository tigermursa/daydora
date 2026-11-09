// One-time migration: assign pre-account "orphan" events (no userId) to a
// registered user so they stay visible to that user only.
//
// Usage:
//   node scripts/migrate-events.mjs <email>
//
// Example:
//   node scripts/migrate-events.mjs you@example.com
//
// Run from the project root. Reads MONGODB_URI from .env.local.

import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

function loadEnv() {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  return env;
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/migrate-events.mjs <email>");
  process.exit(1);
}

const { MONGODB_URI } = loadEnv();
if (!MONGODB_URI) throw new Error("MONGODB_URI missing in .env.local");

const client = new MongoClient(MONGODB_URI);
await client.connect();
try {
  const db = client.db();
  const user = await db.collection("users").findOne({ email });
  if (!user) throw new Error(`No user found for ${email} — sign up first`);
  const res = await db
    .collection("events")
    .updateMany(
      { userId: { $exists: false } },
      { $set: { userId: String(user._id) } },
    );
  console.log(`Assigned ${res.modifiedCount} event(s) to ${email}`);
} finally {
  await client.close();
}
