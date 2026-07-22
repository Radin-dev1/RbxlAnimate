import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { PRO_MONTHLY_PRICE, PRO_YEARLY_PRICE } from "@/lib/types";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { interval } = await req.json();
  const stripe = getStripe();
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (!stripe) {
    // Demo mode: client upgrades locally
    return NextResponse.json({ ok: true, demo: true });
  }

  const priceEnv =
    interval === "year"
      ? process.env.STRIPE_PRICE_PRO_YEARLY
      : process.env.STRIPE_PRICE_PRO_MONTHLY;

  const sessionCheckout = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: `${base}/pricing?success=1`,
    cancel_url: `${base}/pricing?canceled=1`,
    line_items: priceEnv
      ? [{ price: priceEnv, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "rbxlAnimate Pro" },
              unit_amount: Math.round((interval === "year" ? PRO_YEARLY_PRICE : PRO_MONTHLY_PRICE) * 100),
              recurring: { interval: interval === "year" ? "year" : "month" },
            },
            quantity: 1,
          },
        ],
    customer_email: session.user.email || undefined,
    metadata: { userId: (session.user as { id?: string }).id || "" },
  });

  return NextResponse.json({ checkoutUrl: sessionCheckout.url });
}
