import { redirect } from "next/navigation";
import { getAuthenticatedShop } from "@/lib/dashboard/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { CheckoutButton } from "./checkout-button";
import { PortalButton } from "./portal-button";

const plans = [
  {
    tier: "starter",
    name: "Starter",
    price: "$49",
    features: ["200 AI calls/mo", "Square booking", "SMS confirmations", "Call log", "Basic analytics"],
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$99",
    popular: true,
    features: [
      "All Starter features",
      "Unlimited calls",
      "Full analytics",
      "Custom voice/greeting",
      "Multi-barber routing",
      "Priority support",
    ],
  },
];

export default async function BillingPage() {
  const shop = await getAuthenticatedShop();

  if (!shop) {
    redirect("/dashboard/onboarding");
  }

  const status = shop.subscription_status ?? "trialing";
  const tier = shop.subscription_tier;
  const hasSubscription = shop.stripe_customer_id && status === "active";
  const isTrialing = status === "trialing";
  const trialDaysLeft = shop.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(shop.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 14;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan
            {isTrialing && <Badge variant="secondary">Free Trial</Badge>}
            {hasSubscription && tier && (
              <>
                <Badge>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Badge>
                <Badge variant="secondary">Active</Badge>
              </>
            )}
            {status === "past_due" && <Badge variant="destructive">Past Due</Badge>}
            {status === "canceled" && <Badge variant="destructive">Canceled</Badge>}
          </CardTitle>
          <CardDescription>
            {isTrialing
              ? `You have ${trialDaysLeft} days left on your free trial. Choose a plan to continue after your trial ends.`
              : hasSubscription
                ? "Your subscription is active. Manage your plan below."
                : "Choose a plan to get started."}
          </CardDescription>
        </CardHeader>
        {hasSubscription && (
          <CardContent>
            <PortalButton />
          </CardContent>
        )}
      </Card>

      {/* Plan Cards — show when no active subscription */}
      {!hasSubscription && (
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.tier} className={plan.popular ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.popular && <Badge>Most Popular</Badge>}
                </div>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <CheckoutButton
                  tier={plan.tier}
                  label={`Subscribe to ${plan.name}`}
                  variant={plan.popular ? "default" : "outline"}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
