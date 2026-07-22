"use client";

import { USAGE_PACKS } from "@/lib/types";
import { useAppStore } from "@/lib/store";

export function BuyUsageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addUsage = useAppStore((s) => s.addUsage);
  const plan = useAppStore((s) => s.plan);
  const upgradeToPro = useAppStore((s) => s.upgradeToPro);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-lg p-6 shadow-[0_0_60px_rgba(225,6,0,0.25)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand">Usage</p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Buy more generations</h2>
            <p className="mt-1 text-sm text-muted">No watermarks. Packs add to your current balance instantly.</p>
          </div>
          <button className="btn-ghost text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="grid gap-3">
          {USAGE_PACKS.map((pack) => (
            <button
              key={pack.id}
              className="flex items-center justify-between rounded-xl border border-border bg-black/40 px-4 py-3 text-left transition hover:border-brand"
              onClick={async () => {
                const res = await fetch("/api/billing/pack", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ packId: pack.id }),
                });
                const data = await res.json();
                if (data.ok) {
                  addUsage(pack.generations);
                  onClose();
                } else if (data.checkoutUrl) {
                  window.location.href = data.checkoutUrl;
                } else {
                  // Demo fallback when Stripe is not configured
                  addUsage(pack.generations);
                  onClose();
                }
              }}
            >
              <span>
                <span className="block font-semibold text-white">{pack.generations} generations</span>
                <span className="text-xs text-muted">One-time top-up</span>
              </span>
              <span className="font-[family-name:var(--font-display)] text-brand">${pack.price}</span>
            </button>
          ))}
        </div>

        {plan !== "pro" && (
          <div className="mt-5 rounded-xl border border-brand/40 bg-brand/10 p-4">
            <p className="font-semibold">Or go Pro — $15.99/mo</p>
            <p className="mt-1 text-sm text-muted">150 gens/mo, video→anim, better quality animations.</p>
            <button
              className="btn-primary mt-3 text-sm"
              onClick={async () => {
                const res = await fetch("/api/billing/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ interval: "month" }),
                });
                const data = await res.json();
                if (data.checkoutUrl) {
                  window.location.href = data.checkoutUrl;
                } else {
                  upgradeToPro();
                  onClose();
                }
              }}
            >
              Upgrade to Pro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
