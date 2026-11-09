import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { isAuthed } from "@/lib/auth";

// The session cookie is read on every request, so this segment blocks
// prerendering instead of streaming a static shell (Cache Components).
export const instant = false;

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthed())) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
