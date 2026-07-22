import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { USAGE_PACKS } from "@/lib/types";

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

  const { packId } = await req.json();
  const pack = USAGE_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }

  const stripe = getStripe();
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (!stripe) {
    return NextResponse.json({ ok: true, demo: true, generations: pack.generations });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${base}/studio?pack=1`,
    cancel_url: `${base}/pricing`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `rbxlAnimate ${pack.generations} generations`,
          },
          unit_amount: Math.round(pack.price * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: session.user.email || undefined,
    metadata: {
      packId: pack.id,
      generations: String(pack.generations),
      userId: (session.user as { id?: string }).id || "",
    },
  });

  return NextResponse.json({ checkoutUrl: checkout.url });
}
