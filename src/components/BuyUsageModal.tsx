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
            <p className="text-[11px] uppercase tracking-[0.25em] text-brand">Usage</p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Buy more generations</h2>
            <p className="mt-1 text-sm text-muted">
              Demo checkout on GitHub Pages — packs credit instantly. Real Stripe needs a backend later.
            </p>
          </div>
          <button className="btn-ghost text-sm" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="grid gap-3">
          {USAGE_PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              className="flex items-center justify-between rounded-xl border border-border bg-black/40 px-4 py-3 text-left transition hover:border-brand"
              onClick={() => {
                addUsage(pack.generations);
                onClose();
              }}
            >
              <span>
                <span className="block font-semibold text-white">{pack.generations} generations</span>
                <span className="text-xs text-muted">One-time top-up (demo)</span>
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
              type="button"
              onClick={() => {
                upgradeToPro();
                onClose();
              }}
            >
              Upgrade to Pro (demo)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
