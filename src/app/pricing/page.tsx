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
    <div className="page-enter relative mx-auto max-w-5xl px-4 py-14">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-pulse-red absolute left-1/2 top-8 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/15 blur-[90px]" />
      </div>

      <div className="text-center">
        <p className="eyebrow brand-glow">Pro</p>
        <h1 className="hero-brand mt-3 text-[clamp(2.2rem,5vw,3.6rem)] text-white">
          Better motion.
          <span className="block text-brand">More usage.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Every export is watermark-free. Pro unlocks video→animation, high-quality timelines, and a bigger
          monthly pool. Billing on GitHub Pages is demo-only until a Stripe backend is added.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="panel p-7">
          <h2 className="font-[family-name:var(--font-display)] text-xl">Free</h2>
          <p className="mt-3 text-4xl font-bold tracking-tight">$0</p>
          <ul className="mt-6 space-y-2.5 text-sm text-muted">
            <li>{FREE_MONTHLY_USAGE} generations / month</li>
            <li>Text → animation</li>
            <li>Standard quality</li>
            <li>Watermark-free export</li>
            <li>Buy more usage anytime</li>
          </ul>
          {plan === "free" ? (
            <p className="mt-7 text-sm font-semibold text-brand">Current plan</p>
          ) : (
            <p className="mt-7 text-sm text-muted">Included forever</p>
          )}
        </div>

        <div className="panel panel-hot relative overflow-hidden p-7">
          <div className="absolute right-4 top-4 rounded-md bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
            Recommended
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-brand">Pro</h2>
          <p className="mt-3 text-4xl font-bold tracking-tight">
            ${PRO_MONTHLY_PRICE}
            <span className="text-base font-normal text-muted">/mo</span>
          </p>
          <p className="text-sm text-muted">or ${PRO_YEARLY_PRICE}/year</p>
          <ul className="mt-6 space-y-2.5 text-sm text-muted">
            <li>{PRO_MONTHLY_USAGE} generations / month</li>
            <li>Video → animation</li>
            <li>High-quality multi-phase timelines</li>
            <li>Secondary motion & smoother arcs</li>
            <li>Watermark-free export</li>
            <li>Buy more usage when you run out</li>
          </ul>
          <div className="mt-7 flex flex-wrap gap-2">
            {plan === "pro" ? (
              <p className="text-sm font-semibold text-brand">You&apos;re on Pro</p>
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
