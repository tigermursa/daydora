import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/auth";
import { usersCollection } from "@/lib/mongodb";

// The session cookie is read on every request, so this segment blocks
// prerendering instead of streaming a static shell (Cache Components).
export const instant = false;

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  let user = { name: session.email.split("@")[0], email: session.email };
  try {
    if (ObjectId.isValid(session.uid)) {
      const users = await usersCollection();
      const doc = await users.findOne({ _id: new ObjectId(session.uid) });
      if (doc) user = { name: doc.name, email: doc.email };
    }
  } catch {
    /* keep email-prefix fallback */
  }
  return <AppShell user={user}>{children}</AppShell>;
}
