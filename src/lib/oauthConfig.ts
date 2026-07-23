/**
 * Client-side OAuth readiness for static GitHub Pages.
 * Real token exchange with a Client Secret usually needs a backend (CORS).
 * Credentials can be saved in Settings (localStorage) for the Roblox button.
 */
export type OAuthProviderId = "github" | "google" | "roblox";

export interface OAuthProvider {
  id: OAuthProviderId;
  label: string;
  /** Short note for the “coming soon” / connect state */
  hint: string;
  /** Env flag that would enable this provider when a backend exists */
  envKey: string;
  configured: boolean;
}

function flag(name: string): boolean {
  const v = process.env[name];
  return Boolean(v && v !== "0" && v.toLowerCase() !== "false");
}

export function getOAuthProviders(opts?: { robloxClientId?: string }): OAuthProvider[] {
  const robloxFromSettings = Boolean(opts?.robloxClientId?.trim());
  return [
    {
      id: "github",
      label: "GitHub",
      hint: "Add GITHUB_ID / GITHUB_SECRET on a backend host",
      envKey: "NEXT_PUBLIC_GITHUB_OAUTH",
      configured: flag("NEXT_PUBLIC_GITHUB_OAUTH"),
    },
    {
      id: "google",
      label: "Google",
      hint: "Add GOOGLE_CLIENT_ID / SECRET on a backend host",
      envKey: "NEXT_PUBLIC_GOOGLE_OAUTH",
      configured: flag("NEXT_PUBLIC_GOOGLE_OAUTH"),
    },
    {
      id: "roblox",
      label: "Roblox",
      hint: "Paste Client ID (+ Secret) in Settings → Roblox OAuth",
      envKey: "NEXT_PUBLIC_ROBLOX_OAUTH",
      configured: robloxFromSettings || flag("NEXT_PUBLIC_ROBLOX_OAUTH"),
    },
  ];
}

/** Redirect URI for GitHub Pages project site */
export function robloxRedirectUri() {
  if (typeof window === "undefined") return "";
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${window.location.origin}${base}/login/callback/`;
}

export function buildRobloxAuthorizeUrl(clientId: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: robloxRedirectUri(),
    response_type: "code",
    scope: "openid profile",
  });
  return `https://apis.roblox.com/oauth/v1/authorize?${params.toString()}`;
}
