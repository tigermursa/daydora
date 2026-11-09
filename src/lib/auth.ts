import { cookies } from "next/headers";

const COOKIE = "daydora_session";
const TTL_SECONDS = 20 * 60;
const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";

interface SessionData {
  uid: string;
  email: string;
  exp: number;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function sign(data: SessionData): Promise<string> {
  const payload = btoa(JSON.stringify(data));
  return `${payload}.${await hmac(payload)}`;
}

async function verify(token: string): Promise<SessionData | null> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if ((await hmac(payload)) !== sig) return null;
  try {
    const data = JSON.parse(atob(payload)) as SessionData;
    if (
      typeof data.uid === "string" &&
      typeof data.email === "string" &&
      typeof data.exp === "number" &&
      Date.now() <= data.exp
    ) {
      return data;
    }
  } catch {}
  return null;
}

export async function createSession(uid: string, email: string) {
  const token = await sign({
    uid,
    email,
    exp: Date.now() + TTL_SECONDS * 1000,
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getSession(): Promise<{
  uid: string;
  email: string;
} | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const data = await verify(token);
  return data ? { uid: data.uid, email: data.email } : null;
}

export async function isAuthed(): Promise<boolean> {
  return (await getSession()) !== null;
}

export async function requireAuth(): Promise<{ uid: string; email: string }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  await createSession(session.uid, session.email); // sliding renewal
  return session;
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
