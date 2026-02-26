"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingToggle, plans, type BillingInterval } from "@/components/pricing-toggle";
import { CheckoutButton } from "./checkout-button";

export function BillingPlans() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <PricingToggle onChange={setInterval} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => {
          const price = interval === "annual" ? plan.annualPrice : plan.monthlyPrice;
          return (
            <Card key={plan.tier} className={plan.popular ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.popular && <Badge>Most Popular</Badge>}
                </div>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">${price}</span>
                  <span className="text-muted-foreground">/mo</span>
                  {interval === "annual" && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      billed ${plan.annualTotal}/yr
                    </span>
                  )}
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
                  interval={interval}
                  label={`Subscribe to ${plan.name}`}
                  variant={plan.popular ? "default" : "outline"}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
