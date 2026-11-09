import { type Collection, MongoClient, type ObjectId } from "mongodb";
import type { EventType } from "./types";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI env missing");

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export interface EventDoc {
  _id?: ObjectId;
  title: string;
  date: string;
  type: EventType;
  recurring: boolean;
  createdAt: Date;
}

function getClient(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri as string, { maxPoolSize: 5 });
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

export async function eventsCollection(): Promise<Collection<EventDoc>> {
  const client = await getClient();
  return client.db().collection<EventDoc>("events");
}
