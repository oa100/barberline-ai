import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

function getPriceId(tier: string, interval: string): string | undefined {
  const priceIds: Record<string, string | undefined> = {
    "starter:monthly": process.env.STRIPE_STARTER_PRICE_ID,
    "starter:annual": process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
    "pro:monthly": process.env.STRIPE_PRO_PRICE_ID,
    "pro:annual": process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  };
  return priceIds[`${tier}:${interval}`];
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit(`checkout:${userId}`, { limit: 5, windowMs: 60_000 });
  if (!success) return rateLimitResponse();

  const body = await req.json();
  const tier = body.tier as string;
  const interval = body.interval === "annual" ? "annual" : "monthly";
  const priceId = getPriceId(tier, interval);

  if (!priceId) {
    return NextResponse.json({ error: "Invalid tier or interval" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, stripe_customer_id, clerk_user_id")
    .eq("clerk_user_id", userId)
    .single();

  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  // Reuse existing Stripe customer or create one
  let customerId = shop.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { clerk_user_id: userId, shop_id: shop.id },
    });
    customerId = customer.id;

    await supabase
      .from("shops")
      .update({ stripe_customer_id: customerId })
      .eq("id", shop.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { shop_id: shop.id, tier },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
