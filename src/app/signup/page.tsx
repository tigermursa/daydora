import { Cake, CalendarCheck2, Gem, GraduationCap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { isAuthed } from "@/lib/auth";

export const metadata = { title: "Sign up · Daydora" };
// Reads the session cookie, so opt out of static shell prerendering.
export const instant = false;

const FEATURES = [
  { Icon: Cake, label: "Birthdays", tint: "text-pink-400" },
  { Icon: Gem, label: "Anniversaries", tint: "text-purple-400" },
  { Icon: GraduationCap, label: "Exams", tint: "text-orange-400" },
];

export default async function SignupPage() {
  if (await isAuthed()) redirect("/");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="animate-fade-up w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500 text-[#071510] shadow-2xl shadow-emerald-500/30">
            <CalendarCheck2 size={32} strokeWidth={2.25} />
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight">
            Daydora
          </h1>
          <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-muted">
            Create your account and never miss a date again.
          </p>
        </div>
        <div className="rounded-3xl border border-white/[0.07] bg-surface/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">
          <SignupForm />
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Sign in
          </Link>
        </p>
        <div className="mt-4 flex justify-center gap-2 text-[11px] font-medium text-muted/80">
          {FEATURES.map(({ Icon, label, tint }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5"
            >
              <Icon size={12} className={tint} /> {label}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
