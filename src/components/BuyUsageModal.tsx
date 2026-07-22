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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="panel panel-hot w-full max-w-lg p-6 shadow-[0_0_80px_rgba(225,6,0,0.28)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Usage</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
              Buy more generations
            </h2>
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
              className="flex items-center justify-between rounded-2xl border border-border bg-black/45 px-4 py-3.5 text-left transition hover:border-brand hover:shadow-[0_0_24px_rgba(225,6,0,0.15)]"
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
          <div className="mt-5 rounded-2xl border border-brand/40 bg-brand/10 p-4">
            <p className="font-semibold">Or go Pro — $15.99/mo</p>
            <p className="mt-1 text-sm text-muted">
              150 gens/mo, video→anim, high-quality multi-phase motion.
            </p>
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
