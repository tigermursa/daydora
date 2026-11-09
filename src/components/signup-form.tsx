"use client";

import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { signup } from "@/lib/actions/auth";

export function SignupForm() {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await signup(fd);
      if (!res.ok) {
        toast.error(res.error ?? "Signup failed");
        return;
      }
      localStorage.setItem("daydora:lastActivity", String(Date.now()));
      toast.success("Account created — welcome aboard");
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">
          Name
        </span>
        <div className="relative">
          <User
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            name="name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            maxLength={40}
            className="w-full rounded-xl border border-white/[0.08] bg-background/60 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted/50 hover:border-white/[0.14] focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
            required
          />
        </div>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">
          Email
        </span>
        <div className="relative">
          <Mail
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full rounded-xl border border-white/[0.08] bg-background/60 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted/50 hover:border-white/[0.14] focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
            required
          />
        </div>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">
          Password
        </span>
        <div className="relative">
          <Lock
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            name="password"
            type="password"
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
            minLength={6}
            className="w-full rounded-xl border border-white/[0.08] bg-background/60 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted/50 hover:border-white/[0.14] focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
            required
          />
        </div>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-[#071510] shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
        {!pending && <ArrowRight size={16} strokeWidth={2.5} />}
      </button>
      <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted/80">
        <Lock size={11} />
        Secure · Your dates stay private
      </p>
    </form>
  );
}
