"use server";

import { clearSession, createSession, isAuthed } from "../auth";

const EMAIL = "date@g.com";
const PASSWORD = "neverforget";

export async function login(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (email !== EMAIL || password !== PASSWORD) {
    return { ok: false, error: "Invalid email or password" };
  }
  await createSession();
  return { ok: true };
}

export async function logout(): Promise<void> {
  await clearSession();
}

/** Client activity → keeps cookie sliding. */
export async function touchSession(): Promise<void> {
  if (!(await isAuthed())) throw new Error("UNAUTHORIZED");
  await createSession();
}
