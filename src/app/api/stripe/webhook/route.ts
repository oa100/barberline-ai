import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await supabase
        .from("shops")
        .update({
          stripe_subscription_id: session.subscription as string,
          subscription_status: "active",
        })
        .eq("stripe_customer_id", session.customer as string);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const tier = sub.metadata?.tier ?? null;
      // Access raw event data for fields not in SDK types
      const rawSub = event.data.object as unknown as Record<string, unknown>;
      const periodEnd = typeof rawSub.current_period_end === "number"
        ? new Date(rawSub.current_period_end * 1000).toISOString()
        : null;
      await supabase
        .from("shops")
        .update({
          subscription_status: sub.status,
          subscription_tier: tier,
          current_period_end: periodEnd,
          trial_ends_at: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null,
        })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("shops")
        .update({
          subscription_status: "canceled",
          stripe_subscription_id: null,
          subscription_tier: null,
        })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
