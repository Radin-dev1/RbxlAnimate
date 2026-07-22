import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  const customerId = process.env.STRIPE_DEMO_CUSTOMER_ID;
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (!key || !customerId) {
    return NextResponse.redirect(`${base}/pricing`);
  }

  const stripe = new Stripe(key);
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${base}/settings`,
  });

  return NextResponse.redirect(portal.url);
}
