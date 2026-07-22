"use client";

import { FormEvent, useState } from "react";
import { signIn, getProviders } from "next-auth/react";
import { useEffect } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [providers, setProviders] = useState<Record<string, { id: string; name: string }> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProviders().then((p) => setProviders(p));
  }, []);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("email-demo", { email, callbackUrl: "/studio", redirect: false });
    setBusy(false);
    if (res?.error) setError("Could not sign in with that email.");
    else if (res?.url) window.location.href = res.url;
  }

  const oauth = ["github", "google", "roblox"].filter((id) => providers?.[id]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="panel p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-brand">Account</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Website: Email, GitHub, Google, or Roblox. Studio plugin will require Roblox.
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
          <button className="btn-primary w-full" disabled={busy} type="submit">
            {busy ? "Signing in…" : "Continue with email"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          {oauth.length === 0 && (
            <p className="rounded-lg border border-border bg-black/30 p-3 text-sm text-muted">
              GitHub / Google / Roblox appear here when OAuth env keys are set. Email sign-in works now for local use.
            </p>
          )}
          {oauth.map((id) => (
            <button
              key={id}
              className="btn-ghost w-full capitalize"
              onClick={() => signIn(id, { callbackUrl: "/studio" })}
            >
              Continue with {providers?.[id]?.name || id}
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-brand-hot">{error}</p>}

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/" className="hover:text-white">
            Back home
          </Link>
        </p>
      </div>
    </div>
  );
}
