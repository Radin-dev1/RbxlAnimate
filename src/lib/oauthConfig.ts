/**
 * Client-side OAuth readiness for static GitHub Pages.
 * Real redirects need a backend; these flags only control polished UI states.
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

export function getOAuthProviders(): OAuthProvider[] {
  return [
    {
      id: "github",
      label: "GitHub",
      hint: "Connect GITHUB_CLIENT_ID when you leave static Pages",
      envKey: "NEXT_PUBLIC_GITHUB_OAUTH",
      configured: flag("NEXT_PUBLIC_GITHUB_OAUTH"),
    },
    {
      id: "google",
      label: "Google",
      hint: "Connect GOOGLE_CLIENT_ID when you leave static Pages",
      envKey: "NEXT_PUBLIC_GOOGLE_OAUTH",
      configured: flag("NEXT_PUBLIC_GOOGLE_OAUTH"),
    },
    {
      id: "roblox",
      label: "Roblox",
      hint: "Needed for Studio plugin — connect ROBLOX_OAUTH keys later",
      envKey: "NEXT_PUBLIC_ROBLOX_OAUTH",
      configured: flag("NEXT_PUBLIC_ROBLOX_OAUTH"),
    },
  ];
}
