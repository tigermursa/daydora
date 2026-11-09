import { cookies } from "next/headers";

const COOKIE = "daydora_session";
const TTL_SECONDS = 20 * 60;
const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";

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

async function sign(exp: number): Promise<string> {
  const payload = btoa(JSON.stringify({ exp }));
  return `${payload}.${await hmac(payload)}`;
}

async function verify(token: string): Promise<boolean> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if ((await hmac(payload)) !== sig) return false;
  try {
    const data = JSON.parse(atob(payload)) as { exp: number };
    return typeof data.exp === "number" && Date.now() <= data.exp;
  } catch {
    return false;
  }
}

export async function createSession() {
  const token = await sign(Date.now() + TTL_SECONDS * 1000);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function isAuthed(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? verify(token) : false;
}

export async function requireAuth() {
  if (!(await isAuthed())) throw new Error("UNAUTHORIZED");
  await createSession(); // sliding renewal
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
