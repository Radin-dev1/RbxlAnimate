"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { getOAuthProviders, buildRobloxAuthorizeUrl, type OAuthProviderId } from "@/lib/oauthConfig";

type Status = "idle" | "busy" | "success" | "error";

const PROVIDER_ICONS: Record<OAuthProviderId, ReactNode> = {
  github: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.295 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.5-5.1 3.5-3.1 0-5.6-2.5-5.6-5.6S8.9 6.1 12 6.1c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 6.9 2.7 2.7 6.9 2.7 12S6.9 21.3 12 21.3c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
      />
      <path fill="#34A853" d="M3.9 7.4l3 2.2C7.7 7.5 9.7 6.1 12 6.1c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.5 2.7 12 2.7 8.6 2.7 5.6 4.6 3.9 7.4z" />
      <path fill="#4A90E2" d="M12 21.3c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-3.5 0-6.5-2.4-7.6-5.6l-3 2.3c1.7 3.4 5.2 5.8 10.6 5.8z" />
      <path fill="#FBBC05" d="M4.4 14.2c-.2-.6-.4-1.3-.4-2.2s.1-1.6.4-2.2l-3-2.3C1.1 9 1 10.4 1 12s.1 3 .7 4.5l2.7-2.3z" />
    </svg>
  ),
  roblox: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M18.9 5.1 5.1 8.7l3.6 10.2L20.1 15.3 18.9 5.1zm-7.2 8.4-1.5-4.3 4.3-1.2 1.5 4.3-4.3 1.2z" />
    </svg>
  ),
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);
  const [robloxUser, setRobloxUser] = useState("");
  const signIn = useAppStore((s) => s.signIn);
  const user = useAppStore((s) => s.user);
  const settings = useAppStore((s) => s.settings);
  const router = useRouter();
  const providers = useMemo(
    () => getOAuthProviders({ robloxClientId: settings.robloxClientId }),
    [settings.robloxClientId],
  );

  useEffect(() => {
    if (user && status !== "success") router.replace("/");
  }, [user, router, status]);

  function onEmail(e: FormEvent) {
    e.preventDefault();
    setOauthNotice(null);
    setStatus("busy");
    setMessage(null);

    const cleaned = email.trim().toLowerCase();
    if (!cleaned.includes("@") || cleaned.indexOf("@") === 0 || cleaned.endsWith("@")) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    // Brief pause so success state is visible before landing on the maker
    signIn(cleaned);
    setStatus("success");
    setMessage("You're in — opening the maker…");
    window.setTimeout(() => router.push("/"), 650);
  }

  function onOAuth(id: OAuthProviderId) {
    const provider = providers.find((p) => p.id === id);
    if (!provider) return;
    setMessage(null);
    setStatus("idle");

    if (id === "roblox") {
      const clientId = settings.robloxClientId?.trim();
      if (!clientId) {
        setOauthNotice(
          "Add your Roblox Client ID (and Secret) in Settings → Roblox OAuth, then come back.",
        );
        return;
      }
      try {
        sessionStorage.setItem("rbxl_oauth_pending", "1");
        window.location.href = buildRobloxAuthorizeUrl(clientId);
      } catch {
        setOauthNotice("Could not start Roblox OAuth. Check your Client ID in Settings.");
      }
      return;
    }

    if (provider.configured) {
      setOauthNotice(
        `${provider.label} keys are set, but OAuth needs a backend — not available on static GitHub Pages yet.`,
      );
    } else {
      setOauthNotice(
        `${provider.label} is coming soon. ${provider.hint}. Email sign-in works now.`,
      );
    }
  }

  function finishRobloxUsername() {
    const name = robloxUser.trim().replace(/^@/, "");
    if (!name) {
      setOauthNotice("Enter your Roblox username to finish linking.");
      return;
    }
    signIn(`roblox:${name}`, { provider: "roblox", name });
    setStatus("success");
    setMessage(`Signed in as ${name} — opening the maker…`);
    window.setTimeout(() => router.push("/"), 650);
  }

  return (
    <div className="login-shell relative flex min-h-[100dvh] flex-col overflow-hidden">
      {/* Atmospheric plane */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="login-grain absolute inset-0" />
        <div className="animate-pulse-red absolute left-1/2 top-[-8%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-brand/22 blur-[110px]" />
        <div className="animate-drift absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-brand/12 blur-[100px]" />
        <div className="animate-float absolute -left-16 bottom-16 h-56 w-56 rounded-full bg-brand/10 blur-[90px]" />
        <div className="surface-grid absolute inset-0 opacity-50" />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:py-14">
        <div className="page-enter text-center">
          <Link
            href="/"
            className="hero-brand brand-glow inline-block text-[clamp(2.4rem,10vw,3.4rem)] tracking-tight transition hover:brightness-110"
          >
            <span className="text-brand">rbxl</span>
            <span className="text-white">Animate</span>
          </Link>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Sign in to generate Roblox-ready motion. Session stays in this browser.
          </p>
        </div>

        <div className="panel panel-hot stagger-1 mt-8 p-6 sm:p-8">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight sm:text-2xl">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted">Continue with email or a provider below.</p>

          <form onSubmit={onEmail} className="mt-6 space-y-3" noValidate>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-muted">
                Email
              </span>
              <input
                className={`input ${status === "error" ? "input-error" : ""}`}
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                placeholder="you@studio.dev"
                value={email}
                disabled={status === "busy" || status === "success"}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") {
                    setStatus("idle");
                    setMessage(null);
                  }
                }}
                aria-invalid={status === "error"}
                aria-describedby={message ? "login-status" : undefined}
              />
            </label>
            <button
              className={`btn-primary w-full ${status === "busy" ? "is-busy" : ""}`}
              disabled={status === "busy" || status === "success"}
              type="submit"
            >
              {status === "busy"
                ? "Signing in…"
                : status === "success"
                  ? "Signed in"
                  : "Continue with email"}
            </button>
          </form>

          <div
            id="login-status"
            role="status"
            aria-live="polite"
            className={`mt-3 min-h-[1.25rem] text-sm ${
              status === "error"
                ? "text-brand-hot"
                : status === "success"
                  ? "text-emerald-400"
                  : "text-muted"
            }`}
          >
            {message}
          </div>

          <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2.5">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`oauth-btn group w-full ${p.id === "roblox" ? "oauth-btn-roblox" : ""}`}
                onClick={() => onOAuth(p.id)}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/40 text-white">
                    {PROVIDER_ICONS[p.id]}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-semibold text-white">
                      Continue with {p.label}
                    </span>
                    <span className="block text-[11px] text-muted group-hover:text-muted">
                      {p.id === "roblox"
                        ? p.configured
                          ? "Uses your Client ID from Settings"
                          : "Add Client ID in Settings first"
                        : p.configured
                          ? "Keys detected · backend required"
                          : "Coming soon · connect keys"}
                    </span>
                  </span>
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    p.configured
                      ? "bg-brand/20 text-brand"
                      : "border border-border bg-black/30 text-muted"
                  }`}
                >
                  {p.configured ? "Ready" : "Soon"}
                </span>
              </button>
            ))}
          </div>

          {settings.robloxClientId ? (
            <div className="mt-4 space-y-2 rounded-xl border border-border bg-black/30 p-3">
              <p className="text-xs text-muted">
                After Roblox redirects back (or if token exchange is blocked), finish with your
                username:
              </p>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Roblox username"
                  value={robloxUser}
                  onChange={(e) => setRobloxUser(e.target.value)}
                />
                <button type="button" className="btn-primary shrink-0 text-sm" onClick={finishRobloxUsername}>
                  Link
                </button>
              </div>
            </div>
          ) : null}

          {oauthNotice && (
            <p
              role="status"
              className="mt-3 rounded-xl border border-border bg-black/35 px-3 py-2.5 text-sm leading-relaxed text-muted"
            >
              {oauthNotice}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            <Link href="/" className="inline-flex items-center gap-1.5 transition hover:text-white">
              <span aria-hidden>←</span> Back to maker
            </Link>
            {" · "}
            <Link href="/settings" className="hover:text-white">
              Settings
            </Link>
          </p>
        </div>

        <p className="stagger-2 mt-6 text-center text-[11px] leading-relaxed text-muted/80">
          Demo auth · localStorage · Roblox Client ID from Settings
        </p>
      </div>
    </div>
  );
}
