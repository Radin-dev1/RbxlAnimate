"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { robloxRedirectUri } from "@/lib/oauthConfig";

/**
 * Roblox OAuth redirect target for GitHub Pages.
 * Tries token exchange with Client Secret from Settings; falls back to username link
 * if Roblox blocks browser CORS.
 */
export default function RobloxCallbackPage() {
  const router = useRouter();
  const signIn = useAppStore((s) => s.signIn);
  const settings = useAppStore((s) => s.settings);
  const [status, setStatus] = useState("Finishing Roblox sign-in…");
  const [username, setUsername] = useState("");
  const [needUsername, setNeedUsername] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const err = params.get("error");
    if (err) {
      setStatus(`Roblox error: ${err}`);
      setNeedUsername(true);
      return;
    }
    if (!code) {
      setStatus("No authorization code returned.");
      setNeedUsername(true);
      return;
    }

    const clientId = settings.robloxClientId?.trim();
    const clientSecret = settings.robloxClientSecret?.trim();
    if (!clientId || !clientSecret) {
      setStatus("OAuth code received. Add Client Secret in Settings, or link your username below.");
      setNeedUsername(true);
      return;
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: robloxRedirectUri(),
    });

    fetch("https://apis.roblox.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`token ${res.status}`);
        return res.json() as Promise<{ access_token?: string }>;
      })
      .then((token) => {
        if (!token.access_token) throw new Error("no access_token");
        return fetch("https://apis.roblox.com/oauth/v1/userinfo", {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });
      })
      .then(async (res) => {
        if (!res.ok) throw new Error(`userinfo ${res.status}`);
        return res.json() as Promise<{ preferred_username?: string; name?: string; sub?: string }>;
      })
      .then((profile) => {
        const name = profile.preferred_username || profile.name || profile.sub || "RobloxUser";
        signIn(`roblox:${name}`, { provider: "roblox", name });
        setStatus(`Welcome, ${name}`);
        window.setTimeout(() => router.replace("/"), 700);
      })
      .catch(() => {
        setStatus(
          "Roblox blocked browser token exchange (common on static Pages). Link your username to finish.",
        );
        setNeedUsername(true);
      });
  }, [router, settings.robloxClientId, settings.robloxClientSecret, signIn]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="panel p-6">
        <p className="eyebrow">Roblox</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">OAuth callback</h1>
        <p className="mt-3 text-sm text-muted">{status}</p>
        {needUsername && (
          <div className="mt-4 flex gap-2">
            <input
              className="input"
              placeholder="Roblox username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary shrink-0 text-sm"
              onClick={() => {
                const name = username.trim().replace(/^@/, "");
                if (!name) return;
                signIn(`roblox:${name}`, { provider: "roblox", name });
                router.replace("/");
              }}
            >
              Link
            </button>
          </div>
        )}
        <p className="mt-4 text-sm text-muted">
          <Link href="/settings" className="text-brand underline">
            Settings
          </Link>
          {" · "}
          <Link href="/login" className="hover:text-white">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
