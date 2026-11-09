"use server";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { clearSession, createSession, getSession } from "../auth";
import { type UserDoc, usersCollection } from "../mongodb";

const scryptAsync = promisify(scrypt);

async function getUserByEmail(email: string) {
  const users = await usersCollection();
  return users.findOne({ email });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password, salt, 32)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    const [salt, hashHex] = stored.split(":");
    if (!salt || !hashHex) return false;
    const key = (await scryptAsync(password, salt, 32)) as Buffer;
    const expected = Buffer.from(hashHex, "hex");
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

export async function signup(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 1) return { ok: false, error: "Name is required" };
  if (name.length > 40)
    return { ok: false, error: "Name is too long (max 40)" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: "Enter a valid email" };
  if (password.length < 6)
    return { ok: false, error: "Password must be at least 6 characters" };

  try {
    const users = await usersCollection();
    const existing = await users.findOne({ email });
    if (existing)
      return { ok: false, error: "An account with this email already exists" };

    const doc: UserDoc = {
      name,
      email,
      passwordHash: await hashPassword(password),
      createdAt: new Date(),
    };
    const res = await users.insertOne(doc);
    await createSession(res.insertedId.toString(), email);
    return { ok: true };
  } catch (e) {
    // unique index may catch a race — still report a friendly error
    if (e instanceof Error && e.message.includes("duplicate"))
      return { ok: false, error: "An account with this email already exists" };
    return { ok: false, error: "Something went wrong, try again" };
  }
}

export async function login(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password)
    return { ok: false, error: "Email and password are required" };

  let user: Awaited<ReturnType<typeof getUserByEmail>>;
  try {
    user = await getUserByEmail(email);
  } catch {
    return { ok: false, error: "Something went wrong, try again" };
  }

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: "Invalid email or password" };
  }
  await createSession(user._id.toString(), email);
  return { ok: true };
}

export async function logout(): Promise<void> {
  await clearSession();
}

/** Client activity → keeps cookie sliding. */
export async function touchSession(): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  await createSession(session.uid, session.email);
}
