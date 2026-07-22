"use client";

import { PRO_MONTHLY_PRICE, PRO_YEARLY_PRICE, PRO_MONTHLY_USAGE, FREE_MONTHLY_USAGE } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { BuyUsageModal } from "@/components/BuyUsageModal";
import { useState } from "react";

export default function PricingPage() {
  const plan = useAppStore((s) => s.plan);
  const upgradeToPro = useAppStore((s) => s.upgradeToPro);
  const [buyOpen, setBuyOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <p className="font-[family-name:var(--font-display)] text-xs font-semibold tracking-[0.3em] text-brand">
          Pro
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
          Better animations. More usage.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Every export is watermark-free. Pro unlocks video→animation, high quality, and a bigger monthly pool.
          Billing on GitHub Pages is demo-only until a Stripe backend is added.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="panel p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl">Free</h2>
          <p className="mt-2 text-3xl font-bold">$0</p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>{FREE_MONTHLY_USAGE} generations / month</li>
            <li>Text → animation</li>
            <li>Standard quality</li>
            <li>Watermark-free export</li>
            <li>Buy more usage anytime</li>
          </ul>
          {plan === "free" ? (
            <p className="mt-6 text-sm text-brand">Current plan</p>
          ) : (
            <p className="mt-6 text-sm text-muted">Included forever</p>
          )}
        </div>

        <div className="panel relative overflow-hidden p-6 shadow-[0_0_40px_rgba(225,6,0,0.2)]">
          <div className="absolute right-4 top-4 rounded-md bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Recommended
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-brand">Pro</h2>
          <p className="mt-2 text-3xl font-bold">
            ${PRO_MONTHLY_PRICE}
            <span className="text-base font-normal text-muted">/mo</span>
          </p>
          <p className="text-sm text-muted">or ${PRO_YEARLY_PRICE}/year</p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>{PRO_MONTHLY_USAGE} generations / month</li>
            <li>Video → animation</li>
            <li>Better / high-quality animations</li>
            <li>Priority generation</li>
            <li>Watermark-free export</li>
            <li>Buy more usage when you run out</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            {plan === "pro" ? (
              <p className="text-sm text-brand">You&apos;re on Pro</p>
            ) : (
              <>
                <button className="btn-primary" type="button" onClick={() => upgradeToPro()}>
                  Go Pro monthly (demo)
                </button>
                <button className="btn-ghost" type="button" onClick={() => upgradeToPro()}>
                  Go Pro yearly (demo)
                </button>
              </>
            )}
            <button className="btn-ghost" type="button" onClick={() => setBuyOpen(true)}>
              Buy more usage
            </button>
          </div>
        </div>
      </div>

      <BuyUsageModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
}
