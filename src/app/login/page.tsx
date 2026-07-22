"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signIn = useAppStore((s) => s.signIn);
  const user = useAppStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const cleaned = email.trim().toLowerCase();
    if (!cleaned.includes("@")) {
      setError("Enter a valid email.");
      setBusy(false);
      return;
    }
    signIn(cleaned);
    setBusy(false);
    router.push("/");
  }

  return (
    <div className="page-enter relative mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-pulse-red absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-brand/18 blur-[80px]" />
      </div>

      <div className="panel panel-hot p-6 md:p-8">
        <p className="eyebrow brand-glow">rbxlAnimate</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted">
          Demo email sign-in (saved in this browser). OAuth (GitHub / Google / Roblox) needs a backend —
          coming when you leave static Pages.
        </p>

        <form onSubmit={onEmail} className="mt-6 space-y-3">
          <input
            className="input"
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className={`btn-primary w-full ${busy ? "is-busy" : ""}`} disabled={busy} type="submit">
            {busy ? "Signing in…" : "Continue with email"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-border" />
          later
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          {["GitHub", "Google", "Roblox"].map((name) => (
            <button key={name} className="btn-ghost w-full opacity-50" disabled type="button">
              Continue with {name} — soon
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-brand-hot">{error}</p>}

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/" className="hover:text-white">
            Back to maker
          </Link>
        </p>
      </div>
    </div>
  );
}
