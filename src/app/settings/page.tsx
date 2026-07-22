"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import { BuyUsageModal } from "@/components/BuyUsageModal";
import type { AnimStyle } from "@/lib/types";
import { FREE_MONTHLY_USAGE, PRO_MONTHLY_USAGE } from "@/lib/types";

export default function SettingsPage() {
  const { data: session } = useSession();
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
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand">Settings</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Control panel</h1>
      </div>

      <section className="panel space-y-4 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Account</h2>
        <p className="text-sm text-muted">
          Signed in as {session?.user?.email || session?.user?.name || "guest"}{" "}
          {session ? "" : "(sign in to sync across devices)"}
        </p>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Link Roblox account (required for Studio plugin)</span>
          <input
            type="checkbox"
            checked={settings.robloxLinked}
            onChange={(e) =>
              updateSettings({
                robloxLinked: e.target.checked,
                robloxUsername: e.target.checked ? settings.robloxUsername || "RobloxUser" : "",
              })
            }
          />
        </label>
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
            <option value="soft">Soft red</option>
            <option value="bold">Bold red</option>
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
          Free includes {FREE_MONTHLY_USAGE}/mo · Pro includes {PRO_MONTHLY_USAGE}/mo · $15.99/mo or $179.99/yr
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary text-sm" onClick={() => setBuyOpen(true)}>
            Buy more usage
          </button>
          <a className="btn-ghost text-sm" href="/pricing">
            Manage plan
          </a>
          <button
            className="btn-ghost text-sm"
            onClick={() => {
              window.open("/api/billing/portal", "_blank");
            }}
          >
            Stripe portal
          </button>
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
          onClick={() => {
            if (confirm("Clear local library and reset usage demo data?")) {
              localStorage.removeItem("rbxlanimate-store-v1");
              window.location.reload();
            }
          }}
        >
          Export / wipe local data
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

      <button
        className="btn-primary"
        onClick={() => {
          save();
        }}
      >
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
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
