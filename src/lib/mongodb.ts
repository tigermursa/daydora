import { type Collection, MongoClient, type ObjectId } from "mongodb";
import type { EventType } from "./types";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI env missing");

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export interface EventDoc {
  _id?: ObjectId;
  userId?: string; // legacy docs (pre-multi-user) may not have one
  title: string;
  date: string;
  type: EventType;
  recurring: boolean;
  createdAt: Date;
}

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string; // always stored lowercase
  passwordHash: string; // "salt:hash" (scrypt)
  createdAt: Date;
}

function getClient(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri as string, { maxPoolSize: 5 });
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

let eventsIndexReady = false;

export async function eventsCollection(): Promise<Collection<EventDoc>> {
  const client = await getClient();
  const col = client.db().collection<EventDoc>("events");
  if (!eventsIndexReady) {
    await col.createIndex({ userId: 1, createdAt: -1 });
    eventsIndexReady = true;
  }
  return col;
}

let usersIndexReady = false;

export async function usersCollection(): Promise<Collection<UserDoc>> {
  const client = await getClient();
  const col = client.db().collection<UserDoc>("users");
  if (!usersIndexReady) {
    await col.createIndex({ email: 1 }, { unique: true });
    usersIndexReady = true;
  }
  return col;
}
