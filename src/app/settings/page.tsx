"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { BuyUsageModal } from "@/components/BuyUsageModal";
import { ThemePicker } from "@/components/ThemePicker";
import type { AnimStyle } from "@/lib/types";
import { FREE_MONTHLY_USAGE, PRO_MONTHLY_USAGE } from "@/lib/types";

export default function SettingsPage() {
  const user = useAppStore((s) => s.user);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const plan = useAppStore((s) => s.plan);
  const usageRemaining = useAppStore((s) => s.usageRemaining);
  const periodResetAt = useAppStore((s) => s.periodResetAt);
  const [buyOpen, setBuyOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="page-enter mx-auto max-w-3xl space-y-5 px-4 py-12">
      <div>
        <p className="eyebrow">Settings</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Control panel
        </h1>
      </div>

      <section className="panel space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Account</h2>
        <p className="text-sm text-muted">
          Signed in as {user?.email || user?.name || "guest"}{" "}
          {user ? "(demo session in this browser)" : "(sign in to track usage locally)"}
        </p>
        {!user && (
          <Link href="/login" className="btn-primary inline-flex text-sm">
            Sign in
          </Link>
        )}
        <Toggle
          label="Link Roblox account (required for Studio plugin)"
          checked={settings.robloxLinked}
          onChange={(v) =>
            updateSettings({
              robloxLinked: v,
              robloxUsername: v ? settings.robloxUsername || "RobloxUser" : "",
            })
          }
        />
        {settings.robloxLinked && (
          <input
            className="input"
            placeholder="Roblox username"
            value={settings.robloxUsername}
            onChange={(e) => updateSettings({ robloxUsername: e.target.value })}
          />
        )}
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Roblox OAuth</h2>
        <p className="text-sm text-muted">
          Paste your OAuth <strong className="text-white">Client ID</strong> and{" "}
          <strong className="text-white">Client Secret</strong> from the{" "}
          <a
            className="text-brand underline"
            href="https://create.roblox.com/dashboard/credentials"
            target="_blank"
            rel="noreferrer"
          >
            Creator Dashboard
          </a>
          . Saved only in this browser. Set redirect URI to your{" "}
          <code className="text-white/80">…/login/callback/</code> page.
        </p>
        <label className="block space-y-1 text-sm">
          Client ID
          <input
            className="input font-mono text-sm"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={settings.robloxClientId || ""}
            onChange={(e) => updateSettings({ robloxClientId: e.target.value.trim() })}
            autoComplete="off"
          />
        </label>
        <label className="block space-y-1 text-sm">
          Client Secret
          <input
            className="input font-mono text-sm"
            type="password"
            placeholder="••••••••"
            value={settings.robloxClientSecret || ""}
            onChange={(e) => updateSettings({ robloxClientSecret: e.target.value.trim() })}
            autoComplete="off"
          />
        </label>
        <p className="text-[11px] text-muted">
          On static GitHub Pages, Roblox may block browser token exchange (CORS). If OAuth
          can&apos;t finish, you can still link a Roblox username after authorizing.
        </p>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Look & style</h2>
        <ThemePicker />
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Preferences</h2>
        <label className="block space-y-1 text-sm">
          Default style
          <select
            className="input"
            value={settings.defaultStyle}
            onChange={(e) => updateSettings({ defaultStyle: e.target.value as AnimStyle })}
          >
            <option value="emote">Emote</option>
            <option value="combat">Combat</option>
            <option value="idle">Idle</option>
            <option value="walk">Walk</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          Default rig / preview
          <select
            className="input"
            value={settings.defaultPreviewMode || settings.defaultRig || "r15"}
            onChange={(e) => {
              const v = e.target.value as "r15" | "r6" | "dual";
              updateSettings({
                defaultPreviewMode: v,
                defaultRig: v === "dual" ? "r15" : v,
              });
            }}
          >
            <option value="r15">R15</option>
            <option value="r6">R6</option>
            <option value="dual">Dual (R15 + R6)</option>
          </select>
        </label>
        <Toggle
          label="Auto-play preview"
          checked={settings.autoPlayPreview}
          onChange={(v) => updateSettings({ autoPlayPreview: v })}
        />
        <label className="block space-y-1 text-sm">
          Export format
          <select
            className="input"
            value={settings.exportFormat}
            onChange={(e) => updateSettings({ exportFormat: e.target.value as "json" | "plugin" })}
          >
            <option value="json">JSON KeyframeSequence package</option>
            <option value="plugin">Plugin-ready package</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          Accent intensity
          <select
            className="input"
            value={settings.accentIntensity}
            onChange={(e) => updateSettings({ accentIntensity: e.target.value as "soft" | "bold" })}
          >
            <option value="soft">Soft</option>
            <option value="bold">Bold</option>
          </select>
        </label>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg">AI</h2>
        <label className="block space-y-1 text-sm">
          Quality preference
          <select
            className="input"
            value={settings.aiQualityPref}
            onChange={(e) => updateSettings({ aiQualityPref: e.target.value as "standard" | "high" })}
          >
            <option value="standard">Standard</option>
            <option value="high">High (Pro)</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          Content filter
          <select
            className="input"
            value={settings.contentFilter}
            onChange={(e) =>
              updateSettings({ contentFilter: e.target.value as "strict" | "standard" | "off" })
            }
          >
            <option value="strict">Strict</option>
            <option value="standard">Standard</option>
            <option value="off">Off</option>
          </select>
        </label>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Usage & billing</h2>
        <p className="text-sm text-muted">
          Plan: <span className="text-white">{plan.toUpperCase()}</span> · {usageRemaining} gens left · resets{" "}
          {new Date(periodResetAt).toLocaleDateString()}
        </p>
        <p className="text-xs text-muted">
          Free includes {FREE_MONTHLY_USAGE}/mo · Pro includes {PRO_MONTHLY_USAGE}/mo · $15.99/mo or $179.99/yr.
          On GitHub Pages, upgrades are demo-only (local). Real Stripe needs a server later.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary text-sm" type="button" onClick={() => setBuyOpen(true)}>
            Buy more usage
          </button>
          <Link className="btn-ghost text-sm" href="/pricing">
            Manage plan
          </Link>
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Library</h2>
        <Toggle
          label="Auto-save generations"
          checked={settings.autoSave}
          onChange={(v) => updateSettings({ autoSave: v })}
        />
        <button
          className="btn-ghost text-sm"
          type="button"
          onClick={() => {
            if (confirm("Clear local library and reset usage demo data?")) {
              localStorage.removeItem("rbxlanimate-store-v1");
              window.location.reload();
            }
          }}
        >
          Wipe local data
        </button>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Notifications</h2>
        <Toggle
          label="Email when generation completes"
          checked={settings.emailOnComplete}
          onChange={(v) => updateSettings({ emailOnComplete: v })}
        />
        <Toggle
          label="Warn when usage is low"
          checked={settings.lowUsageWarning}
          onChange={(v) => updateSettings({ lowUsageWarning: v })}
        />
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Developer</h2>
        <p className="text-sm text-muted">API tokens and webhooks land here for plugin + automations.</p>
        <input className="input" disabled placeholder="API token — coming soon" />
        <input className="input" disabled placeholder="Webhook URL — coming soon" />
      </section>

      <button className="btn-primary" type="button" onClick={save}>
        {saved ? "Saved" : "Save settings"}
      </button>

      <BuyUsageModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className="toggle"
        data-on={checked ? "true" : "false"}
        onClick={() => onChange(!checked)}
      />
    </label>
  );
}
